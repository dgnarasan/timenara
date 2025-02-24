
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Starting auth process...');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email for verification",
        });
      } else {
        console.log('Attempting sign in...');
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          throw signInError;
        }

        if (!authData.user) {
          console.error('No user data returned from sign in');
          throw new Error('No user data returned');
        }

        console.log('Sign in successful, fetching profile...');
        
        // Try to get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }
        
        if (!profile) {
          console.error('No profile found for user');
          // Instead of throwing an error, let's create a profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: authData.user.id,
              email: authData.user.email,
              role: 'student' 
            }]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          console.log('Created new profile, redirecting to schedule...');
          navigate('/schedule');
          return;
        }

        console.log('Profile found, role:', profile.role);
        console.log('Redirecting to:', profile.role === 'admin' ? '/admin' : '/schedule');
        
        // Redirect based on role
        navigate(profile.role === 'admin' ? '/admin' : '/schedule');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            {isSignUp ? (
              <UserPlus className="h-8 w-8 text-primary" />
            ) : (
              <LogIn className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isSignUp 
              ? 'Join us today and get access to your personalized schedule' 
              : 'Sign in to access your account and manage your schedule'}
          </p>
        </div>

        <Card className="p-6 backdrop-blur-sm bg-card/95 border-primary/10 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full text-base py-6"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Please wait...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </div>
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm hover:text-primary transition-colors"
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
