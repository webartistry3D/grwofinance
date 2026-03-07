import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Home, Bot, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginData } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const debugMessage = `Client login attempt: ${data.email}`;
      console.log(debugMessage);
      setDebugInfo(prev => [...prev, debugMessage]);
      
      const response = await apiRequest('/api/auth/login', 'POST', data);
      const result = await response.json();
      
      const responseMessage = `Client login response: ${JSON.stringify(result, null, 2)}`;
      console.log(responseMessage);
      setDebugInfo(prev => [...prev, responseMessage]);
      
      return result;
    },
    onSuccess: () => {
      const successMessage = "Client login success - invalidating user query";
      console.log(successMessage);
      setDebugInfo(prev => [...prev, successMessage]);
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
        duration: 2000
      });
      
      // Check if user is admin and redirect accordingly
      setTimeout(() => {
        // Get fresh auth state after invalidation
        queryClient.fetchQuery({ queryKey: ['/api/auth/user'] }).then((result: any) => {
          const isAdmin = result?.user?.isAdmin || false;
          console.log("Login redirect - User is admin:", isAdmin);
          if (isAdmin) {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
          }
        });
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = `Client login error: ${error}`;
      console.log(errorMessage);
      setDebugInfo(prev => [...prev, errorMessage]);
      
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  const onSubmit = (data: LoginData) => loginMutation.mutate(data);

  // Fix autofill styles
  useEffect(() => {
    const fixAutofillStyles = () => {
      const inputs = document.querySelectorAll('input:-webkit-autofill');
      inputs.forEach(input => {
        input.classList.add('autofilled');
      });
    };
    fixAutofillStyles();
    const interval = setInterval(fixAutofillStyles, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4 relative">
      {/* Home Button */}
      <div className="absolute top-4 left-4 sm:left-auto sm:right-4 z-10">
        <Link href="/">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 hover:bg-gradient-to-br hover:from-primary/15 hover:via-white hover:to-secondary/15 border-primary hover:border-primary shadow-md text-xs sm:text-sm px-2 sm:px-4 text-primary hover:text-primary"
            data-testid="button-visit-home"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Visit Home Page</span>
            <span className="sm:hidden">Home</span>
          </Button>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto mt-8 sm:mt-0">
        {/* Logo Section */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <Bot className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1 font-display">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to your GrwoFinance account
          </p>
        </div>

        {/* Login Form */}
        <div className="relative w-3/4 max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-20 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-t-full shadow-lg flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center mb-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                </div>
                <div className="w-8 h-1 bg-gray-600 rounded"></div>
              </div>
            </div>
            <CardContent className="pt-24 pb-4 px-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="bg-white border-gray-300 focus:border-primary focus:ring-primary transition-all duration-200"
                          data-testid="input-email"
                          ref={emailInputRef}
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
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="bg-gray-800 border-gray-300 focus:border-primary focus:ring-primary transition-all duration-200 pr-10"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Debug Display */}
        {debugInfo.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Debug Information</h3>
            {debugInfo.map((message, index) => (
              <div key={index} className="text-xs text-gray-600 mb-1 font-mono bg-white p-2 rounded border border-gray-200">
                {message}
              </div>
            ))}
            <button 
              onClick={() => setDebugInfo([])}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear Debug
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
