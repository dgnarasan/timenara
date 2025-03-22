
import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
};

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
