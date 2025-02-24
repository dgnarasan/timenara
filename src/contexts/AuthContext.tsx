
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
    const getInitialSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setState({ user: null, loading: false });
          return;
        }

        if (!session?.user) {
          console.log('No active session found');
          setState({ user: null, loading: false });
          return;
        }

        console.log('Session found, fetching profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setState({ user: null, loading: false });
          return;
        }

        if (!profile) {
          console.error('No profile found for user');
          setState({ user: null, loading: false });
          return;
        }

        console.log('Profile found:', profile);
        setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            role: profile.role,
          },
          loading: false,
        });
      } catch (error) {
        console.error('Unexpected error:', error);
        setState({ user: null, loading: false });
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (!session) {
        console.log('No session in auth change');
        setState({ user: null, loading: false });
        return;
      }

      try {
        console.log('Fetching profile after auth change...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setState({ user: null, loading: false });
          return;
        }

        if (!profile) {
          console.error('No profile found for user');
          setState({ user: null, loading: false });
          return;
        }

        console.log('Profile found after auth change:', profile);
        setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            role: profile.role,
          },
          loading: false,
        });
      } catch (error) {
        console.error('Unexpected error in auth change:', error);
        setState({ user: null, loading: false });
      }
    });

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
