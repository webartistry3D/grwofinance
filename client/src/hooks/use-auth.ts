import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery<{ user: User } | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    queryFn: async (): Promise<{ user: User } | null> => {
      console.log("useAuth - Checking user authentication...");
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      console.log("useAuth - Response status:", response.status);
      if (response.status === 401) {
        console.log("useAuth - Got 401, returning null");
        return null;
      }
      if (!response.ok) {
        console.log("useAuth - Response not ok:", response.statusText);
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("useAuth - User data received:", data);
      console.log("useAuth - User admin status:", data.user?.isAdmin);
      return { user: data.user };
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/logout', 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
        duration: 2000
      });
      setLocation("/login");
    },
    onError: () => {
      // Force logout even if API call fails
      queryClient.clear();
      setLocation("/login");
    }
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  const authResult = {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user?.user && !error,
    isAdmin: user?.user?.isAdmin || false,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
  
  console.log("useAuth - Final auth result:", authResult);
  return authResult;
}