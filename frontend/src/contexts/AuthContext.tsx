import { createContext, useContext, useEffect, useState, useCallback, type ReactNode, type JSX } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
//import { favouriteService } from '../services/FavouriteService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>; // ✅ 新增 refreshUser 函數
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


interface AuthProviderProps {
    children: ReactNode;
}


export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // ✅ 建立 refreshUser 函數來手動重新載入用戶資料
    const refreshUser = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                // 重新載入 Firebase 用戶資料
                await currentUser.reload();
                // 強制更新 ID Token (可選,但建議加上)
                await currentUser.getIdToken(true);
                // 更新狀態 - 使用展開運算子創建新物件以觸發 React 重新渲染
                setUser({ ...currentUser });
                console.log('✅ 用戶資料已刷新:', currentUser.displayName);
            } catch (error) {
                console.error('❌ 刷新用戶資料失敗:', error);
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            /* 暫時不需要同步
            if (firebaseUser) {
                try {
                    await favouriteService.syncLocalStorageToDatabase();
                    console.log('✅ 收藏列表已自動同步');
                } catch (error) {
                    console.error('❌ 同步收藏失敗:', error);
                }
            }
            */
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading,
        refreshUser, // ✅ 提供給所有子元件使用
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
