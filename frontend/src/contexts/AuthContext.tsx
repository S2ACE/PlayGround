// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
    user: User | null;
    loading: boolean;
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};