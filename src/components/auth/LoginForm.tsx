
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  setIsLoading: (loading: boolean) => void;
}

const LoginForm = ({ setIsLoading }: LoginFormProps) => {
  const [formLoading, setFormLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Reset error state when form values change
  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [form.watch("email"), form.watch("password"), loginError]);

  const onSubmit = async (values: FormValues) => {
    try {
      setFormLoading(true);
      setIsLoading(true);
      setLoginError(null);
      
      console.log("Attempting to sign in with:", values.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Login error from Supabase:", error);
        throw error;
      }

      console.log("Sign in successful:", data);
      
      // Check if we have a user in the response
      if (!data.user) {
        throw new Error("No user data returned after successful login");
      }

      toast({
        title: "Successfully logged in",
        description: "Welcome back to Scheduler!",
      });
      
      // Add a small delay before redirecting to ensure auth state is updated
      setTimeout(() => {
        navigate("/");
      }, 500);
      
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          onClick={() => {
            if (formLoading) {
              // Allow force reset if stuck
              setFormLoading(false);
              setIsLoading(false);
            }
          }}
        >
          {formLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
