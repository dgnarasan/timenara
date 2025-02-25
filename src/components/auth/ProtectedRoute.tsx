
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth',
  allowedRoles
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not logged in, redirect to auth page
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If specific roles are required and user doesn't have one of them
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
