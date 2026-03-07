import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Home, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { registerSchema, type RegisterData } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      isAdmin: false,
      isActive: true,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('/api/auth/register', 'POST', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Account Created!",
        description: "Welcome to GrwoFinance. You have been logged in automatically."
      });
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4 relative">
      {/* Visit Home Page Button - Responsive positioning */}
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
      
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Bot className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 font-display">
            <span style={{color: '#29A378'}}>Kudi</span><span className="text-white">Tracker</span>
          </h1>
          <p className="text-gray-600">Start tracking your finances today</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            data-testid="input-firstname"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            data-testid="input-lastname"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          data-testid="input-email"
                          {...field}
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
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Need an admin account?{" "}
                <Link href="/admin-register" className="text-[#29A378] hover:text-[#119e6c] font-medium">
                  Register as Admin
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}