
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AtSign, KeyRound, LogIn, UserPlus, Eye, EyeOff, UserCog, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { College, collegeStructure } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schemas for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "admin"]),
  college: z.string().optional(),
  accessCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => {
  // If role is admin, college and accessCode are required
  if (data.role === "admin") {
    return !!data.college && !!data.accessCode;
  }
  return true;
}, {
  message: "College and access code are required for admin accounts",
  path: ["accessCode"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loading, signIn, signUp } = useAuth();
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Role selection state
  const [selectedRole, setSelectedRole] = useState<"student" | "admin">("student");
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
      college: "",
      accessCode: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    await signIn(values.email, values.password);
  };

  const onSignupSubmit = async (values: SignupFormValues) => {
    await signUp(
      values.email, 
      values.password, 
      values.role, 
      values.college as College, 
      values.accessCode
    );
  };

  const handleRoleChange = (value: "student" | "admin") => {
    setSelectedRole(value);
    signupForm.setValue("role", value);
  };

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to Scheduler</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-6">
            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="name@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-10 w-10 px-3 py-2 text-muted-foreground"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showLoginPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" /> 
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="name@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showSignupPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-10 w-10 px-3 py-2 text-muted-foreground"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                            >
                              {showSignupPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showSignupPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-10 w-10 px-3 py-2 text-muted-foreground"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showConfirmPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => handleRoleChange(value as "student" | "admin")}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="student" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <User className="mr-1 h-4 w-4" /> Student
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="admin" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <UserCog className="mr-1 h-4 w-4" /> College Admin
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedRole === "admin" && (
                    <>
                      <FormField
                        control={signupForm.control}
                        name="college"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select College</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your college" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {collegeStructure.map((item) => (
                                  <SelectItem key={item.college} value={item.college}>
                                    {item.college.replace(/\s*\([^)]*\)/g, '')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="accessCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter admin access code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                    {signupForm.formState.isSubmitting ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" /> 
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="px-6 py-4 flex flex-col space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
