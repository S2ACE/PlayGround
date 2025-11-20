// components/common/ProtectedRoute.tsx
import type { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

const ProtectedRoute = ({ 
    children, 
    redirectTo = '/wordguess' 
}: ProtectedRouteProps): JSX.Element => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner message="Checking authentication..." />;
    }

    if (!user) {
        console.log('🚫 Unauthorized, redirecting to:', redirectTo);
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
