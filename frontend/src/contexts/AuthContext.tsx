import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
    type JSX,
} from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    // Manually refresh current Firebase user info (profile, token, etc.)
    refreshUser: () => Promise<void>;
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

    // Refresh current user from Firebase (force reload and token refresh)
    const refreshUser = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                await currentUser.reload();
                // Optionally force-refresh ID token so backend sees latest claims
                await currentUser.getIdToken(true);
                // Spread to create a new object reference and trigger re-render
                setUser({ ...currentUser });
                console.log('✅ User info refreshed:', currentUser.displayName);
            } catch (error) {
                console.error('❌ Failed to refresh user info:', error);
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            /*
            // If you want to sync favourites after login, re‑enable this block:
            if (firebaseUser) {
                try {
                    await favouriteService.syncLocalStorageToDatabase();
                    console.log('✅ Favourites synced');
                } catch (error) {
                    console.error('❌ Failed to sync favourites:', error);
                }
            }
            */

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
