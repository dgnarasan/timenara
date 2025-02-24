
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthState, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      if (session?.user) {
        setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            role: 'student', // Default role
          },
          loading: false,
        });
      } else {
        setState({ user: null, loading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: 'student', // Default role
            },
            loading: false,
          });
        } else {
          setState({ user: null, loading: false });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
