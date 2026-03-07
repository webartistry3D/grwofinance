import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Home, Shield, Crown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { registerSchema, type RegisterData } from "@shared/schema";
import { z } from "zod";

export default function AdminRegister() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin registration schema with additional validation
  const adminRegisterSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    adminSecret: z.string().min(10, "Admin secret key must be at least 10 characters"),
    isAdmin: z.boolean().default(true),
    isActive: z.boolean().default(true),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type AdminRegisterData = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    adminSecret: string;
    isAdmin: boolean;
    isActive: boolean;
  };

  const form = useForm<AdminRegisterData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      isAdmin: true,
      isActive: true,
      adminSecret: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: AdminRegisterData) => {
      const response = await apiRequest('/api/auth/register', 'POST', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Admin registration successful:", data);
      
      // Force clear all auth-related queries
      queryClient.clear();
      
      toast({
        title: "Admin Account Created! 👑",
        description: "Welcome to GrwoFinance Admin. You have been logged in automatically.",
        duration: 2000
      });
      
      // Small delay to ensure auth state is updated, then redirect
      setTimeout(() => {
        console.log("Redirecting to admin dashboard...");
        setLocation("/admin");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Admin registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create admin account. Please check your inputs.",
        variant: "destructive",
        duration: 2000
      });
    },
  });

  function onSubmit(data: AdminRegisterData) {
    registerMutation.mutate(data);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#29A378] to-[#119e6c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Registration Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#29A378] to-[#119e6c] rounded-2xl flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Registration</CardTitle>
            <CardDescription className="text-gray-600">
              Create a new administrator account for GrwoFinance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
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
                            {...field}
                            className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378]"
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
                            {...field}
                            className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                          className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Fields */}
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
                            placeholder="••••••••"
                            {...field}
                            className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378] pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
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
                            placeholder="••••••••"
                            {...field}
                            className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378] pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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

                {/* Admin Secret Key */}
                <FormField
                  control={form.control}
                  name="adminSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Secret Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Enter admin secret key"
                            {...field}
                            className="border-gray-300 focus:border-[#29A378] focus:ring-[#29A378] pr-10"
                          />
                          <Shield className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1">
                        This secret key provides additional security for admin account creation
                      </p>
                    </FormItem>
                  )}
                />

                {/* Hidden Admin Field */}
                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="hidden" 
                        {...field}
                        value={field.value ? "true" : "false"}
                      />
                    </FormControl>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="hidden" 
                        {...field}
                        value={field.value ? "true" : "false"}
                      />
                    </FormControl>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#29A378] to-[#119e6c] hover:from-[#29A378]/90 hover:to-[#119e6c]/90 text-white font-semibold py-3"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin Account...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">⚠️ Admin Account Creation</p>
                  <p>
                    This form creates an administrator account with full system access. 
                    Only use this for legitimate administrative purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Need a regular user account?{" "}
                <Link href="/register" className="text-[#29A378] hover:text-[#119e6c] font-medium">
                  Register as User
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-[#29A378] hover:text-[#119e6c] font-medium">
                  Sign In
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Already admin?{" "}
                <Link href="/admin" className="text-[#29A378] hover:text-[#119e6c] font-medium">
                  Admin Dashboard
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
