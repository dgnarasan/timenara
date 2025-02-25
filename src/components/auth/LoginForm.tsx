
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail } from "lucide-react";

// Schema for magic link login
const magicLinkSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" })
});

// Schema for password login
const passwordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface LoginFormProps {
  setIsLoading: (loading: boolean) => void;
}

const LoginForm = ({ setIsLoading }: LoginFormProps) => {
  const [formLoading, setFormLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Magic link form
  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: ""
    }
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Reset error state when form values change
  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [
    magicLinkForm.watch("email"), 
    passwordForm.watch("email"), 
    passwordForm.watch("password"), 
    loginError
  ]);

  // Safety timeout to prevent indefinite loading state
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (formLoading) {
      timeoutId = window.setTimeout(() => {
        console.log("Login timeout triggered - resetting loading state");
        setFormLoading(false);
        setIsLoading(false);
        setLoginError("Request timed out. Please try again.");
      }, 15000); // 15 seconds timeout
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [formLoading, setIsLoading]);

  // Send magic link for passwordless login
  const onMagicLinkSubmit = async (values: MagicLinkFormValues) => {
    try {
      setFormLoading(true);
      setIsLoading(true);
      setLoginError(null);
      setMagicLinkSent(false);
      
      console.log("Sending magic link to:", values.email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error("Magic link error:", error);
        throw error;
      }
      
      setMagicLinkSent(true);
      
      toast({
        title: "Magic link sent!",
        description: "Check your email for a login link.",
      });
      
    } catch (error: any) {
      console.error("Magic link error:", error);
      setLoginError(error.message || "Failed to send magic link. Please try again.");
      
      toast({
        title: "Failed to send magic link",
        description: error.message || "Please try again or use password login.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
      setIsLoading(false);
    }
  };

  // Login with password
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setFormLoading(true);
      setIsLoading(true);
      setLoginError(null);
      
      console.log("Attempting to sign in with password:", values.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Login error from Supabase:", error);
        throw error;
      }

      if (!data || !data.user) {
        console.error("No user data returned from Supabase");
        throw new Error("Authentication failed. No user data returned.");
      }
      
      console.log("Sign in successful:", data.user.id);
      
      toast({
        title: "Successfully logged in",
        description: "Welcome back to Scheduler!",
      });
      
      // Navigate after a short delay to ensure auth state is fully updated
      setTimeout(() => {
        navigate("/");
      }, 1000);
      
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Authentication failed. Please try again.");
      
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="magic-link" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      
      <TabsContent value="magic-link">
        {magicLinkSent ? (
          <div className="bg-muted/50 p-5 rounded-lg text-center space-y-4">
            <Mail className="h-12 w-12 mx-auto text-primary" />
            <h3 className="text-lg font-medium">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a magic link to your email address. Click the link to sign in.
            </p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => setMagicLinkSent(false)}
            >
              Send new link
            </Button>
          </div>
        ) : (
          <Form {...magicLinkForm}>
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
              <FormField
                control={magicLinkForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        {...field} 
                        type="email" 
                        autoComplete="email"
                        disabled={formLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {loginError && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {loginError}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={formLoading}
                onClick={(e) => {
                  if (formLoading) {
                    e.preventDefault();
                    e.stopPropagation();
                    setFormLoading(false);
                    setIsLoading(false);
                    setLoginError("Process was interrupted. Please try again.");
                  }
                }}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </Button>
            </form>
          </Form>
        )}
      </TabsContent>
      
      <TabsContent value="password">
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      type="email" 
                      autoComplete="email"
                      disabled={formLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      {...field} 
                      type="password" 
                      autoComplete="current-password"
                      disabled={formLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {loginError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {loginError}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={formLoading}
              onClick={(e) => {
                if (formLoading) {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormLoading(false);
                  setIsLoading(false);
                  setLoginError("Login process was interrupted. Please try again.");
                }
              }}
            >
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in with Password"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
};

export default LoginForm;
