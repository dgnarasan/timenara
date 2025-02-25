
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  
  useEffect(() => {
    async function checkUserRole() {
      if (user) {
        const { data: role } = await supabase.rpc('get_user_role');
        setUserRole(role);
      }
      setCheckingRole(false);
    }
    
    checkUserRole();
  }, [user]);
  
  if (loading || checkingRole) {
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
