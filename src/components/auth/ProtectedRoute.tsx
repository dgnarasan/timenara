
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to auth page if user is not logged in
  if (!user) {
    console.log("No user found, redirecting to auth page");
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Redirect to access denied page if admin access is required but user is not an admin
  if (requireAdmin && userRole !== 'admin') {
    console.log("User is not an admin, redirecting to access denied page");
    return <Navigate to="/access-denied" replace />;
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
}
