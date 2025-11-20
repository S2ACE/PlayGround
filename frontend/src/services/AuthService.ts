// services/AuthService.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
    updateProfile,
    updatePassword as firebaseUpdatePassword,
    EmailAuthProvider, 
    linkWithCredential,
    type User
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { API_ENDPOINTS } from '../config/api';

export class AuthService {
    private googleProvider = new GoogleAuthProvider();

    constructor() {
        this.googleProvider.addScope('profile');
        this.googleProvider.addScope('email');
    }
    
    // ==================== 註冊和登入 ====================
    
    // Email 註冊
    async registerWithEmail(email: string, password: string) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Email registration successful:', result);
            
            // ✅ 使用自訂 actionCodeSettings
            const actionCodeSettings = {
                url: `${window.location.origin}/email-verified`,
                handleCodeInApp: true,
            };
            
            await sendEmailVerification(result.user, actionCodeSettings);
            console.log('✅ 驗證 Email 已發送到:', result.user.email);

            await this.syncUserToDatabase(result.user);
            
            return {
                user: result.user,
                emailVerificationSent: true
            };
        } catch (error) {
            console.error('Email registration failed:', error);
            throw error;
        }
    }

    // Email 登入
    async signInWithEmail(email: string, password: string) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await this.syncUserToDatabase(result.user);
            return result.user;
        } catch (error) {
            console.error('Email sign-in failed:', error);
            throw error;
        }
    }

    // Google 登入
    async signInWithGoogle() {
        try {
            console.log('🚀 執行 Google 彈窗登入...');
            const result = await signInWithPopup(auth, this.googleProvider);
            console.log('✅ Google 登入成功:', result.user.email);
            
            await this.syncUserToDatabase(result.user);
            return result.user;
        } catch (error: any) {
            console.log('⚠️ Google 登入遇到錯誤:', error.code);
            
            if (error.code === 'auth/account-exists-with-different-credential') {
                console.log('🔍 檢測到帳戶衝突，準備連結資訊...');
                
                const credential = GoogleAuthProvider.credentialFromError(error);
                const email = error.customData?.email || error.email;
                
                console.log('📧 衝突的 Email:', email);
                console.log('🔑 Google 憑證:', credential ? '已獲取' : '未獲取');
                
                if (!email || !credential) {
                    console.error('❌ 無法獲取必要的連結資訊');
                    throw new Error('無法獲取帳戶連結所需的資訊');
                }
                
                const signInMethods = await this.fetchSignInMethodsForEmail(email);
                console.log('📋 現有登入方式:', signInMethods);
                
                throw {
                    ...error,
                    needsLinking: true,
                    email: email,
                    credential: credential,
                    existingMethods: signInMethods,
                    requiresPassword: signInMethods.includes('password')
                };
            }
            
            console.log('🔥 Google 登入其他錯誤:', error.code, error.message);
            throw error;
        }
    }

    // 登出
    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    // ==================== 帳戶設定功能 ====================

    /**
     * 更新會員資料（使用後端 API）
     */
    async updateMember(displayName?: string, photoURL?: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            // 1. 更新 Firebase Auth Profile
            const updates: { displayName?: string; photoURL?: string } = {};
            if (displayName !== undefined) updates.displayName = displayName;
            if (photoURL !== undefined) updates.photoURL = photoURL;
            
            if (Object.keys(updates).length > 0) {
                await updateProfile(currentUser, updates);
                console.log('✅ Firebase Profile 已更新');           
            }

            // 2. 呼叫後端 API 更新資料庫
            const idToken = await currentUser.getIdToken();
            
            const response = await fetch(`${API_ENDPOINTS.MEMBERS}/${currentUser.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    displayName: displayName,
                    photoURL: photoURL
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '更新會員資料失敗');
            }

            const updatedMember = await response.json();
            console.log('✅ 會員資料已更新:', updatedMember);

        } catch (error: any) {
            console.error('❌ 更新會員資料失敗:', error);
            throw error;
        }
    }

    /**
     * 更新顯示名稱
     */
    async updateDisplayName(displayName: string): Promise<void> {
        await this.updateMember(displayName, undefined);
    }

    /**
     * 為現有用戶新增密碼（Account Linking）
     */
    async addPasswordToCurrentUser(password: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('用戶未登入');
        }

        if (!currentUser.email) {
            throw new Error('用戶沒有 Email 地址');
        }

        try {
            // 建立 Email/Password 憑證
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            
            // 連結到現有帳戶
            await linkWithCredential(currentUser, credential);
            
            console.log('✅ 密碼已成功連結到帳戶');

            // ✅ 關鍵步驟：重新載入用戶資料（獲取最新的 providerData）
            await currentUser.reload();
            console.log('✅ 用戶資料已重新載入');
            console.log("currentuser.emailVerified:" + currentUser.emailVerified);
            // 同步到資料庫（更新 providers 資訊）
            await this.syncUserToDatabase(currentUser);
            await currentUser.reload();
        } catch (error: any) {
            console.error('❌ 連結密碼失敗:', error);
            
            if (error.code === 'auth/provider-already-linked') {
                throw new Error('此帳戶已設定密碼');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('密碼強度太弱，請設定至少 6 個字元');
            } else if (error.code === 'auth/email-already-in-use') {
                throw new Error('此 Email 已被其他帳戶使用');
            } else if (error.code === 'auth/requires-recent-login') {
                throw new Error('請重新登入後再試');
            }
            
            throw error;
        }
    }

    /**
     * 更改密碼（需要最近登入）
     */
    async updatePassword(newPassword: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            await firebaseUpdatePassword(currentUser, newPassword);
            console.log('✅ 密碼已更新');
        } catch (error: any) {
            console.error('❌ 更新密碼失敗:', error);
            
            if (error.code === 'auth/weak-password') {
                throw new Error('密碼強度太弱，請設定至少 6 個字元');
            } else if (error.code === 'auth/requires-recent-login') {
                throw new Error('基於安全考量，請重新登入後再更改密碼');
            }
            
            throw error;
        }
    }

    /**
     * 檢查是否有密碼登入方式
     */
    hasPasswordProvider(): boolean {
        const currentUser = auth.currentUser;
        if (!currentUser) return false;
        
        return currentUser.providerData.some(provider => provider.providerId === 'password');
    }

    // ==================== Email 檢查功能 ====================

    async checkEmailRegistrationStatus(email: string): Promise<{
        exists: boolean;
        hasEmailProvider?: boolean;
        hasGoogleProvider?: boolean;
        providers?: string[];
        databaseInfo?: {
            userId?: string;
            provider?: string;
            providers?: string[];
            registeredAt?: string;
            providerCount?: number;
        };
    }> {
        try {
            console.log('🔍 開始檢查 Email 狀態:', email);
            
            // 檢查資料庫
            console.log('📊 檢查資料庫...');
            let databaseResult;
            try {
                databaseResult = await this.checkEmailInDatabase(email);
                console.log('📊 資料庫檢查結果:', databaseResult);
            } catch (err) {
                console.warn('⚠️ 資料庫檢查失敗:', err);
                databaseResult = { exists: false, providers: [] };
            }

            const accountExists = databaseResult.exists;
            const providers = databaseResult.providers || [];

            console.log('- 資料庫存在:', accountExists);
            console.log('- 提供者列表:', providers);

            const hasEmailProvider = providers.includes('email');
            const hasGoogleProvider = providers.includes('google');

            const result = {
                exists: accountExists,
                hasEmailProvider,
                hasGoogleProvider,
                providers,
                databaseInfo: accountExists ? {
                    userId: databaseResult.userId,
                    provider: databaseResult.provider,
                    providers: providers,
                    registeredAt: databaseResult.registeredAt,
                    providerCount: providers.length
                } : undefined
            };

            console.log('✅ 最終檢查結果:', result);
            return result;
        } catch (error) {
            console.error('❌ 檢查 Email 狀態失敗:', error);
            throw error;
        }
    }

    async checkEmailInDatabase(email: string): Promise<{
        exists: boolean;
        userId?: string;
        providers?: string[];
        registeredAt?: string;
        provider?: string;
    }> {
        try {
            const response = await fetch(`${API_ENDPOINTS.AUTH}/check-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📊 資料庫 Email 檢查結果:', result);

            return {
                exists: Boolean(result.exists),
                userId: result.id || undefined,
                providers: result.providers || [],
                registeredAt: result.registeredAt || undefined,
                provider: result.providers?.[0] || undefined
            };
        } catch (error) {
            console.error('❌ 檢查資料庫 Email 失敗:', error);
            throw error;
        }
    }

    async fetchSignInMethodsForEmail(email: string): Promise<string[]> {
        try {
            console.log('正在檢查 Firebase Email:', email);
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            console.log(`✅ Firebase 檢查成功 - Email: ${email}, 方法:`, signInMethods);
            return signInMethods;
        } catch (error: any) {
            console.error('❌ Firebase 檢查失敗:', error);
            console.error('錯誤代碼:', error.code);
            console.error('錯誤訊息:', error.message);
            
            switch (error.code) {
                case 'auth/invalid-email':
                    console.error('無效的電子郵件格式');
                    return [];
                case 'auth/network-request-failed':
                    console.error('網路連線失敗');
                    return [];
                case 'auth/configuration-not-found':
                    console.error('Firebase 配置錯誤');
                    return [];
                case 'auth/invalid-api-key':
                    console.error('Firebase API 金鑰無效');
                    return [];
                default:
                    console.warn('Firebase 檢查失敗，返回空結果:', error.code);
                    return [];
            }
        }
    }

    // ==================== 工具方法 ====================

    // 同步用戶到資料庫
    private async syncUserToDatabase(user: User) {
        const providers = this.getAllProviders(user);
        
        const userData = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            lastLoginAt: new Date().toISOString(),
            providers: providers  // ✅ 傳送所有 providers
        };
        console.log('🔄 同步用戶到資料庫:', userData);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.AUTH}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('資料庫同步失敗');
            }

            console.log('✅ 資料庫同步成功:', await response.json());
        } catch (error) {
            console.error('❌ 資料庫同步失敗:', error);
        }
    }

    // ✅ 取得所有 providers
    private getAllProviders(user: User): Array<{ provider: string; providerId: string }> {
        if (!user.providerData || user.providerData.length === 0) {
            console.warn('⚠️ User providerData is empty or null', user.uid);
            throw new Error('無法取得用戶的認證提供者資訊');
        }

        return user.providerData.map(providerInfo => {
            const providerId = providerInfo.providerId;
            
            if (providerId === 'google.com') {
                return { provider: 'google', providerId: 'google.com' };
            } else if (providerId === 'password') {
                return { provider: 'email', providerId: 'password' };
            } else if (providerId === 'facebook.com') {
                return { provider: 'facebook', providerId: 'facebook.com' };
            } else if (providerId === 'apple.com') {
                return { provider: 'apple', providerId: 'apple.com' };
            }
            
            // 預設處理其他 provider
            return { 
                provider: providerId.replace('.com', ''), 
                providerId: providerId 
            };
        });
    }


    // 取得當前用戶
    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    // 檢查用戶是否已登入
    isAuthenticated(): boolean {
        return auth.currentUser !== null;
    }

    // 重設密碼
    async sendPasswordResetEmail(email: string) {
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            await sendPasswordResetEmail(auth, email);
            console.log('密碼重設郵件已發送');
        } catch (error) {
            console.error('發送密碼重設郵件失敗:', error);
            throw error;
        }
    }

    // 驗證Email
    async sendEmailVerification() {
        try {
            const { sendEmailVerification } = await import('firebase/auth');
            const currentUser = auth.currentUser;
            if (currentUser && !currentUser.emailVerified) {
                await sendEmailVerification(currentUser);
                console.log('驗證郵件已發送');
            }
        } catch (error) {
            console.error('發送驗證郵件失敗:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();