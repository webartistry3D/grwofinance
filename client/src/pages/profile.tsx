import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Camera, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await apiRequest('/api/auth/profile', 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = (data: ProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const userDisplayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || "User";

  return (
    <div className="w-full bg-background min-h-screen">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/settings")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Profile
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            data-testid="button-edit-profile"
          >
            {isEditing ? (
              <X className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Edit className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </header>
      
      <main className="p-4 space-y-6">
        {/* Profile Picture Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center relative">
                  <span className="text-white text-3xl font-bold">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </span>
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">A</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                  data-testid="button-change-avatar"
                  onClick={() => toast({ title: "Avatar Change", description: "Avatar upload coming soon!" })}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground font-display">
                  {userDisplayName}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                {isAdmin && (
                  <Badge variant="secondary" className="mt-2">
                    Administrator
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Subscription Status</span>
              <Badge variant={(user as any)?.subscriptionPlan === "premium" ? "default" : "secondary"} className={(user as any)?.subscriptionPlan === "premium" ? "bg-primary" : ""}>
                {(user as any)?.subscriptionPlan === "premium" ? "Premium" : "Freemium"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Scans Used</span>
              <span className="text-sm font-mono">
                {(user as any)?.monthlyScansUsed || 0} / {(user as any)?.subscriptionPlan === "premium" ? "Unlimited" : "10"}
              </span>
            </div>
            {(user as any)?.subscriptionPlan === "freemium" && parseInt((user as any)?.monthlyScansUsed || "0") >= 8 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="text-xs text-yellow-700 dark:text-yellow-400">
                  {parseInt((user as any)?.monthlyScansUsed || "0") >= 10 
                    ? "Monthly limit reached. Upgrade to Premium for unlimited scans."
                    : "You're close to your monthly scan limit. Consider upgrading to Premium."
                  }
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setLocation("/subscription")}
              data-testid="button-manage-subscription"
            >
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
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
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">First Name</label>
                  <p className="font-medium text-foreground">
                    {user?.firstName || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Name</label>
                  <p className="font-medium text-foreground">
                    {user?.lastName || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium text-foreground">
                    {user?.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member Since</label>
                  <p className="font-medium text-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
              <div className="text-center p-3 bg-secondary/10 rounded-lg">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Receipts Scanned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}