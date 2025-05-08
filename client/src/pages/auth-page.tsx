import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
    },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      ...data,
      profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
    });
  };
  
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  
  const onForgotPasswordSubmit = (data: ForgotPasswordFormValues) => {
    // In a real app, we would send a reset email to the user
    // For this demo, we'll just show a success message
    setForgotPasswordSent(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[hsl(var(--instagram-bg))]">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full bg-white border border-[hsl(var(--instagram-border))] rounded-lg p-8 mb-4">
            <h1 className="text-4xl font-semibold mb-8 text-center">Instagram</h1>
            
            <TabsList className="hidden">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Phone number, username, or email" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
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
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Password" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white py-2 px-4 rounded font-semibold text-sm"
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Log in
                  </Button>
                </form>
              </Form>
              
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
                <span className="px-4 text-sm text-[hsl(var(--instagram-text-secondary))]">OR</span>
                <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-center text-[hsl(var(--primary))] font-semibold mb-4 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-facebook mr-2" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
                Log in with Facebook
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-xs text-[hsl(var(--primary))]"
                  onClick={() => setActiveTab("forgot")}
                >
                  Forgot password?
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="forgot">
              {forgotPasswordSent ? (
                <div className="text-center py-8">
                  <div className="bg-blue-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Email Sent</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    We've sent an email with instructions to reset your password.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white py-2 px-4 rounded font-semibold text-sm"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="bg-blue-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Trouble Logging In?</h3>
                      <p className="text-sm text-gray-500">
                        Enter your email and we'll send you a link to get back into your account.
                      </p>
                    </div>
                    
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Email" 
                              {...field} 
                              className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white py-2 px-4 rounded font-semibold text-sm"
                    >
                      Send Reset Link
                    </Button>
                    
                    <div className="flex items-center justify-center my-4">
                      <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
                      <span className="px-4 text-sm text-[hsl(var(--instagram-text-secondary))]">OR</span>
                      <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="w-full text-center font-semibold text-sm"
                    >
                      Create New Account
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Email" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Full Name" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Username" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Password" 
                            {...field} 
                            className="px-2 py-2 border border-[hsl(var(--instagram-border))] rounded text-sm focus:outline-none focus:border-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white py-2 px-4 rounded font-semibold text-sm"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Sign up
                  </Button>
                </form>
              </Form>
              
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
                <span className="px-4 text-sm text-[hsl(var(--instagram-text-secondary))]">OR</span>
                <div className="flex-1 h-px bg-[hsl(var(--instagram-border))]"></div>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-center text-[hsl(var(--primary))] font-semibold mb-4 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-facebook mr-2" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
                Sign up with Facebook
              </Button>
              
              <p className="text-xs text-center text-[hsl(var(--instagram-text-secondary))] mt-4">
                By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
              </p>
            </TabsContent>
          </div>
          
          <div className="w-full bg-white border border-[hsl(var(--instagram-border))] rounded-lg p-4 text-center">
            <p className="text-sm">
              {activeTab === "login" ? (
                <>
                  Don't have an account? {" "}
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("signup")} 
                    className="text-[hsl(var(--primary))] font-semibold p-0"
                  >
                    Sign up
                  </Button>
                </>
              ) : activeTab === "forgot" ? (
                <>
                  Back to {" "}
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")} 
                    className="text-[hsl(var(--primary))] font-semibold p-0"
                  >
                    Log in
                  </Button>
                </>
              ) : (
                <>
                  Have an account? {" "}
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")} 
                    className="text-[hsl(var(--primary))] font-semibold p-0"
                  >
                    Log in
                  </Button>
                </>
              )}
            </p>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
