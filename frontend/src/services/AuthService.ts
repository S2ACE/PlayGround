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
    type User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { API_ENDPOINTS } from '../config/api';
import { SupabaseClient } from '../lib/SupabaseClient';

export interface MemberDto {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    role: string;
    preferredLanguage: string;
    darkMode: boolean;
}

export class AuthService {
    private googleProvider = new GoogleAuthProvider();

    constructor() {
        this.googleProvider.addScope('profile');
        this.googleProvider.addScope('email');
    }

    async getMember(): Promise<MemberDto | null> {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        try {
            const idToken = await currentUser.getIdToken();
            const res = await fetch(`${API_ENDPOINTS.MEMBERS}/${currentUser.uid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!res.ok) return null;

            const member = (await res.json()) as MemberDto;
            return member;
        } catch (e) {
            console.error('Failed to load member profile', e);
            return null;
        }
    }

    // ==================== Registration & Sign-in ====================

    // Email registration
    async registerWithEmail(email: string, password: string) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Email registration successful:', result);

            // Use custom actionCodeSettings for email verification
            const actionCodeSettings = {
                url: `${window.location.origin}/email-verified`,
                handleCodeInApp: true,
            };

            await sendEmailVerification(result.user, actionCodeSettings);
            console.log('✅ Verification email sent to:', result.user.email);

            await this.syncUserToDatabase(result.user);

            return {
                user: result.user,
                emailVerificationSent: true,
            };
        } catch (error) {
            console.error('Email registration failed:', error);
            throw error;
        }
    }

    // Email sign-in
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

    // Google sign-in
    async signInWithGoogle() {
        try {
            console.log('🚀 Starting Google popup sign-in...');
            const result = await signInWithPopup(auth, this.googleProvider);
            console.log('✅ Google sign-in success:', result.user.email);

            await this.syncUserToDatabase(result.user);
            return result.user;
        } catch (error: any) {
            console.log('⚠️ Google sign-in error:', error.code);

            // Special handling for account-exists-with-different-credential
            if (error.code === 'auth/account-exists-with-different-credential') {
                console.log('🔍 Account conflict detected, preparing to link...');

                const credential = GoogleAuthProvider.credentialFromError(error);
                const email = error.customData?.email || error.email;

                console.log('📧 Conflicting email:', email);
                console.log('🔑 Google credential:', credential ? 'resolved' : 'missing');

                if (!email || !credential) {
                    console.error('❌ Missing linking information');
                    throw new Error('Unable to get required information to link accounts');
                }

                const signInMethods = await this.fetchSignInMethodsForEmail(email);
                console.log('📋 Existing sign-in methods:', signInMethods);

                // Throw enriched error so UI can handle linking flow
                throw {
                    ...error,
                    needsLinking: true,
                    email,
                    credential,
                    existingMethods: signInMethods,
                    requiresPassword: signInMethods.includes('password'),
                };
            }

            console.log('🔥 Other Google sign-in error:', error.code, error.message);
            throw error;
        }
    }

    // Sign-out
    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }

    // ==================== Account settings ====================

    /* Update member profile via backend API (and Firebase profile when needed). */
    async updateMember(
        displayName?: string,
        photoURL?: string,
        darkMode?: boolean,
    ): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not signed in');
        }

        try {
            // 1. Update Firebase Auth profile when needed
            const updates: { displayName?: string; photoURL?: string; darkMode?: boolean } = {};
            if (displayName !== undefined) updates.displayName = displayName;
            if (photoURL !== undefined) updates.photoURL = photoURL;

            if (Object.keys(updates).length > 0) {
                await updateProfile(currentUser, updates);
                console.log('✅ Firebase profile updated');
            }

            // 2. Update member record via backend API
            const idToken = await currentUser.getIdToken();

            const response = await fetch(`${API_ENDPOINTS.MEMBERS}/${currentUser.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    displayName,
                    photoURL,
                    darkMode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update member profile');
            }

            const updatedMember = await response.json();
            console.log('✅ Member profile updated:', updatedMember);
        } catch (error: any) {
            console.error('❌ Failed to update member profile:', error);
            throw error;
        }
    }

    /*  Convenience helper: update only display name. */
    async updateDisplayName(displayName: string): Promise<void> {
        await this.updateMember(displayName, undefined, undefined);
    }

    /* Convenience helper: update only dark mode preference. */
    async updateDarkMode(darkMode: boolean): Promise<void> {
        await this.updateMember(undefined, undefined, darkMode);
    }

    /* Upload avatar to Supabase Storage and update profile. */
    async updateAvatar(file: File): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not signed in');
        }

        // 1. Upload to Supabase Storage (upsert)
        const filePath = `${currentUser.uid}`;
        const { data, error: uploadError } = await SupabaseClient.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        console.log('upload result', { data, uploadError });

        if (uploadError) {
            console.error('Avatar upload failed:', uploadError);
            throw uploadError;
        }

        // 2. Get public URL and cache-bust it to avoid stale avatar in browser
        const {
            data: { publicUrl },
        } = SupabaseClient.storage.from('avatars').getPublicUrl(filePath);

        const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

        await this.updateMember(undefined, cacheBustedUrl, undefined);
    }

    /* Add password credential to the current user (account linking). */
    async addPasswordToCurrentUser(password: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not signed in');
        }

        if (!currentUser.email) {
            throw new Error('User has no email address');
        }

        try {
            // Create Email/Password credential
            const credential = EmailAuthProvider.credential(currentUser.email, password);

            // Link password credential to existing account
            await linkWithCredential(currentUser, credential);

            console.log('✅ Password linked to account');

            // Reload to get latest providerData
            await currentUser.reload();
            console.log('✅ User data reloaded');
            console.log('currentUser.emailVerified:', currentUser.emailVerified);

            // Sync to database with updated providers
            await this.syncUserToDatabase(currentUser);
            await currentUser.reload();
        } catch (error: any) {
            console.error('❌ Failed to link password:', error);

            if (error.code === 'auth/provider-already-linked') {
                throw new Error('Password is already set for this account');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password is too weak, please use at least 6 characters');
            } else if (error.code === 'auth/email-already-in-use') {
                throw new Error('This email is already in use by another account');
            } else if (error.code === 'auth/requires-recent-login') {
                throw new Error('Please sign in again before updating password');
            }

            throw error;
        }
    }

    /*  Update password for the current user (requires recent sign-in). */
    async updatePassword(newPassword: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not signed in');
        }

        try {
            await firebaseUpdatePassword(currentUser, newPassword);
            console.log('✅ Password updated');
        } catch (error: any) {
            console.error('❌ Failed to update password:', error);

            if (error.code === 'auth/weak-password') {
                throw new Error('Password is too weak, please use at least 6 characters');
            } else if (error.code === 'auth/requires-recent-login') {
                throw new Error(
                    'For security reasons, please sign in again before changing your password',
                );
            }

            throw error;
        }
    }

    /* Check if current user has an Email/Password provider linked. */
    hasPasswordProvider(): boolean {
        const currentUser = auth.currentUser;
        if (!currentUser) return false;

        return currentUser.providerData.some((provider) => provider.providerId === 'password');
    }

    // ==================== Email / account status helpers ====================

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
            console.log('🔍 Checking email status:', email);

            // Check in application database
            console.log('📊 Checking database...');
            let databaseResult;
            try {
                databaseResult = await this.checkEmailInDatabase(email);
                console.log('📊 Database check result:', databaseResult);
            } catch (err) {
                console.warn('⚠️ Database check failed:', err);
                databaseResult = { exists: false, providers: [] };
            }

            const accountExists = databaseResult.exists;
            const providers = databaseResult.providers || [];

            console.log('- Exists in DB:', accountExists);
            console.log('- Provider list:', providers);

            const hasEmailProvider = providers.includes('email');
            const hasGoogleProvider = providers.includes('google');

            const result = {
                exists: accountExists,
                hasEmailProvider,
                hasGoogleProvider,
                providers,
                databaseInfo: accountExists
                    ? {
                          userId: databaseResult.userId,
                          provider: databaseResult.provider,
                          providers,
                          registeredAt: databaseResult.registeredAt,
                          providerCount: providers.length,
                      }
                    : undefined,
            };

            console.log('✅ Final email status result:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to check email status:', error);
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
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📊 Database email check result:', result);

            return {
                exists: Boolean(result.exists),
                userId: result.id || undefined,
                providers: result.providers || [],
                registeredAt: result.registeredAt || undefined,
                provider: result.providers?.[0] || undefined,
            };
        } catch (error) {
            console.error('❌ Failed to check email in database:', error);
            throw error;
        }
    }

    async fetchSignInMethodsForEmail(email: string): Promise<string[]> {
        try {
            console.log('Checking Firebase sign-in methods for email:', email);
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            console.log('✅ Firebase methods:', email, signInMethods);
            return signInMethods;
        } catch (error: any) {
            console.error('❌ Firebase sign-in methods check failed:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            // Normalize errors to an empty list so caller can handle gracefully
            switch (error.code) {
                case 'auth/invalid-email':
                    console.error('Invalid email format');
                    return [];
                case 'auth/network-request-failed':
                    console.error('Network request failed');
                    return [];
                case 'auth/configuration-not-found':
                    console.error('Firebase configuration error');
                    return [];
                case 'auth/invalid-api-key':
                    console.error('Invalid Firebase API key');
                    return [];
                default:
                    console.warn('Firebase check failed, returning empty result:', error.code);
                    return [];
            }
        }
    }

    // ==================== Utility helpers ====================

    // Sync Firebase user to application database
    private async syncUserToDatabase(user: User) {
        const providers = this.getAllProviders(user);

        const userData = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            lastLoginAt: new Date().toISOString(),
            providers, // send full provider list to backend
        };
        console.log('🔄 Syncing user to database:', userData);

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.AUTH}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error('Failed to sync user with database');
            }

            console.log('✅ Database sync success:', await response.json());
        } catch (error) {
            console.error('❌ Database sync failed:', error);
        }
    }

    // Get normalized list of all providers for a user
    private getAllProviders(user: User): Array<{ provider: string; providerId: string }> {
        if (!user.providerData || user.providerData.length === 0) {
            console.warn('⚠️ User providerData is empty or null', user.uid);
            throw new Error('Unable to get authentication provider info for user');
        }

        return user.providerData.map((providerInfo) => {
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

            // Default fallback for other providers
            return {
                provider: providerId.replace('.com', ''),
                providerId,
            };
        });
    }

    // Get current Firebase user directly from auth instance
    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    // Simple flag for "is user signed in"
    isAuthenticated(): boolean {
        return auth.currentUser !== null;
    }

    // Send password reset email
    async sendPasswordResetEmail(email: string) {
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            await sendPasswordResetEmail(auth, email);
            console.log('Password reset email sent');
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw error;
        }
    }

    // Send email verification to current user
    async sendEmailVerification() {
        try {
            const { sendEmailVerification } = await import('firebase/auth');
            const currentUser = auth.currentUser;
            if (currentUser && !currentUser.emailVerified) {
                await sendEmailVerification(currentUser);
                console.log('Verification email sent');
            }
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();
