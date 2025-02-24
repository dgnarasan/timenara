
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
    let mounted = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        if (!session?.user) {
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        if (!profile) {
          console.error('No profile found for user');
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        if (mounted) {
          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: profile.role,
            },
            loading: false,
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        if (mounted) setState({ user: null, loading: false });
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        if (mounted) setState({ user: null, loading: false });
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        if (!profile) {
          console.error('No profile found for user');
          if (mounted) setState({ user: null, loading: false });
          return;
        }

        if (mounted) {
          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: profile.role,
            },
            loading: false,
          });
        }
      } catch (error) {
        console.error('Unexpected error in auth change:', error);
        if (mounted) setState({ user: null, loading: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
