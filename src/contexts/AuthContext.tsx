
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session, User } from '@supabase/supabase-js';
import { College } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, role: 'student' | 'admin', college?: College, accessCode?: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userCollege: College | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserCollege(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("Found existing session for user:", session.user.email);
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, college, email')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        console.log('Fetched user profile:', profileData);
        setUserRole(profileData.role);
        setUserCollege(profileData.college as College);
      } else {
        console.log('No profile found for user ID:', userId);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error.message);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role: 'student' | 'admin', college?: College, accessCode?: string) => {
    try {
      console.log("Sign up attempt:", { email, role, college, hasAccessCode: !!accessCode });
      
      // If role is admin, validate the access code first
      if (role === 'admin' && college && accessCode) {
        console.log("Validating admin access code for college:", college);
        const { data: isValid, error: validationError } = await supabase
          .rpc('validate_admin_code', { code_to_check: accessCode, college_to_check: college });

        if (validationError || !isValid) {
          console.error('Access code validation error:', validationError || "Code is invalid");
          toast({
            title: "Invalid access code",
            description: "The access code you entered is not valid for this college.",
            variant: "destructive",
          });
          return { error: new Error("Invalid access code") };
        }
        
        console.log("Access code validated successfully");
      }

      // Create the user account
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error('Sign up error:', error.message);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      if (data.user) {
        // Update the user's profile with role and college (if admin)
        const updates = {
          id: data.user.id,
          email: email,
          role: role,
          college: role === 'admin' ? college : null,
          updated_at: new Date().toISOString()
        };

        console.log('Creating user profile with data:', updates);

        // First try to get the existing profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        let updateError;
        
        if (existingProfile) {
          console.log("Existing profile found, updating...");
          // Update existing profile
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.user.id);
          
          updateError = error;
        } else {
          console.log("No existing profile, inserting new one...");
          // Insert new profile
          const { error } = await supabase
            .from('profiles')
            .insert(updates);
          
          updateError = error;
        }

        if (updateError) {
          console.error('Error updating user profile:', updateError);
          toast({
            title: "Profile update failed",
            description: "Your account was created but profile details couldn't be updated.",
            variant: "destructive",
          });
        }

        // If admin role, mark the access code as used
        if (role === 'admin' && college && accessCode) {
          console.log("Marking access code as used");
          const { error: codeError } = await supabase
            .rpc('use_admin_code', { code_to_use: accessCode, user_id: data.user.id });

          if (codeError) {
            console.error('Error marking access code as used:', codeError);
          }
        }
      }
      
      toast({
        title: "Account created successfully",
        description: "Please check your email for a confirmation link.",
      });
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    userCollege,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
