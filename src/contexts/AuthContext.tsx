
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: (User & { role: UserRole }) | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { role: UserRole }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      console.log('Fetching role for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'student';
      }
      
      console.log('Role data received:', data);
      return data?.role || 'student';
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return 'student';
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Start with loading state
        setLoading(true);
        
        console.log('Initializing auth state...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session?.user && mounted) {
          console.log('Session found for user:', session.user.id);
          try {
            const role = await getUserRole(session.user.id);
            console.log('User role fetched:', role);
            
            const userWithRole = {
              ...session.user,
              role
            };
            setUser(userWithRole);
          } catch (roleError) {
            console.error('Failed to get user role:', roleError);
            // Still set the user with default role
            setUser({
              ...session.user,
              role: 'student'
            });
          }
        } else if (mounted) {
          console.log('No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to initialize session",
            variant: "destructive",
          });
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          console.log('User signed out');
          setUser(null);
          setLoading(false);
        }
        return;
      }
      
      if (session?.user && mounted) {
        console.log('User session updated:', session.user.id);
        try {
          const role = await getUserRole(session.user.id);
          console.log('User role updated:', role);
          
          const userWithRole = {
            ...session.user,
            role
          };
          setUser(userWithRole);
        } catch (error) {
          console.error('Error updating user role:', error);
          // Still set the user with default role
          setUser({
            ...session.user,
            role: 'student'
          });
        }
      } else if (mounted) {
        setUser(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error);
        throw error;
      }
      console.log('Sign out successful');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
