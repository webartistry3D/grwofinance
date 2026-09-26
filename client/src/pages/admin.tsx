import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatNaira } from "@/lib/currency";
import { 
  Users, 
  Banknote, 
  TrendingUp, 
  Activity, 
  Search,
  UserCheck,
  UserX,
  Crown,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { SystemHealthReport } from "@/components/admin/system-health-report";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
  averageSpending: number;
}

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isActive: boolean;
  subscriptionPlan: string;
  createdAt: string;
  totalExpenses: number;
  lastActivity?: string;
  isOnline: boolean;
}

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilterStatus, setUserFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  const [socket, setSocket] = useState(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Initialize online status tracking using HTTP polling
  useEffect(() => {
    if (currentUser) {
      // Mark current user as online via HTTP API
      const markOnline = async () => {
        try {
          await apiRequest('/api/user/online', 'POST');
        } catch (error) {
          console.error('❌ Failed to mark user online:', error);
        }
      };
      
      // Mark online immediately
      markOnline();
      
      // Set up interval to keep user marked as online
      const onlineInterval = setInterval(markOnline, 2 * 60 * 1000); // Every 2 minutes
      
      // Cleanup on unmount
      return () => {
        clearInterval(onlineInterval);
      };
    }
  }, [currentUser]);

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users, isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ['/api/admin/users'],
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest(`/api/admin/users/${userId}/status`, 'PATCH', { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return await apiRequest(`/api/admin/users/${userId}/admin`, 'PATCH', { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user: UserData) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesStatus = 
      userFilterStatus === "all" || 
      (userFilterStatus === "active" && user.isActive) ||
      (userFilterStatus === "inactive" && !user.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (statsLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Admin Dashboard" />
        <div className="p-4 space-y-6">
          <div className="animate-pulse">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
            
            {/* User Management Section */}
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-32"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen overflow-x-hidden">
      <Header
        title={
          <div className="flex items-center gap-2">
            Admin
          </div>
        }
      />
      
      <main className="pb-20 pt-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full mx-auto">
          <div className="px-4 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedTab === "overview" ? "default" : "outline"}
                onClick={() => setSelectedTab("overview")}
                className="text-xs"
                data-testid="tab-overview"
              >
                Overview
              </Button>
              <Button
                variant={selectedTab === "users" ? "default" : "outline"}
                onClick={() => setSelectedTab("users")}
                className="text-xs"
                data-testid="tab-users"
              >
                Users
              </Button>
              <Button
                variant={selectedTab === "reports" ? "default" : "outline"}
                onClick={() => setSelectedTab("reports")}
                className="text-xs"
                data-testid="tab-reports"
              >
                Reports
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="px-4 space-y-4 max-w-full">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p 
                        className="text-3xl font-bold"
                        style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                        data-testid="text-total-users"
                      >
                        {adminStats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8" style={{ color: '#059669' }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p 
                        className="text-3xl font-bold"
                        style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                        data-testid="text-active-users"
                      >
                        {adminStats?.activeUsers || 0}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8" style={{ color: '#059669' }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Users</p>
                      <p 
                        className="text-3xl font-bold"
                        style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                        data-testid="text-paid-users"
                      >
                        {adminStats?.paidUsers || 0}
                      </p>
                    </div>
                    <Crown className="w-8 h-8" style={{ color: '#059669' }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-display">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New users this month:</span>
                    <Badge variant="secondary">{adminStats?.newUsersThisMonth || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">System status:</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="px-4 space-y-4 max-w-full">
            {/* User Filters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label htmlFor="user-search">Search Users</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-search"
                      placeholder="Search by email or name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-user-search"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="user-filter">Filter by Status</Label>
                  <Select value={userFilterStatus} onValueChange={(value: "all" | "active" | "inactive") => setUserFilterStatus(value)}>
                    <SelectTrigger data-testid="user-filter-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-3">
              {usersLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center relative flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {user.firstName?.[0] || user.email[0].toUpperCase()}
                            </span>
                            {user.isAdmin && (
                              <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.email}
                              </p>
                              {user.isAdmin && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-xs ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {user.isActive ? 'Active' : 'Not Active'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                <span className={`text-xs ${user.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <Badge 
                                variant={user.subscriptionPlan === 'premium' ? 'default' : 'secondary'} 
                                className="text-xs"
                                style={user.subscriptionPlan === 'premium' ? {backgroundColor: '#8B5CF6', color: 'white'} : undefined}
                              >
                                {user.subscriptionPlan === 'premium' ? 'Premium' : 'Freemium'}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 justify-end">
                          <Button
                            size="sm"
                            variant={user.isActive ? "outline" : "default"}
                            style={user.isActive ? {backgroundColor: '#EA580C', color: 'white', border: 'none'} : undefined}
                            onClick={() => toggleUserStatusMutation.mutate({
                              userId: user.id,
                              isActive: !user.isActive
                            })}
                            disabled={toggleUserStatusMutation.isPending}
                            data-testid={`button-toggle-user-status-${user.id}`}
                          >
                            {user.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAdminStatusMutation.mutate({
                              userId: user.id,
                              isAdmin: !user.isAdmin
                            })}
                            disabled={toggleAdminStatusMutation.isPending}
                            data-testid={`button-toggle-admin-status-${user.id}`}
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No users found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="px-4 space-y-4 max-w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-display">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  System Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowSystemHealth(!showSystemHealth)}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  System Health Report
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast({
                    title: "User Analytics",
                    description: "Detailed user analytics report coming soon!",
                  })}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate User Analytics Report
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast({
                    title: "Financial Report",
                    description: "Financial summary report coming soon!",
                  })}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Generate Financial Report
                </Button>
              </CardContent>
            </Card>

            {/* System Health Report - Hidden by default, shown when button is clicked */}
            {showSystemHealth && <SystemHealthReport />}

            {/* Quick System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-display">
                  <Settings className="w-5 h-5 mr-2" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  {/* Application Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Application</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <Badge variant="outline">v1.0.0</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Environment:</span>
                        <Badge variant="default">Development</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Build:</span>
                        <Badge variant="outline">Development</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Deploy:</span>
                        <span className="font-mono">{format(new Date(), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Backend Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Backend</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Server:</span>
                        <Badge className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Running
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Database:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">WebSocket:</span>
                        <Badge className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="font-mono">2h 15m</span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Storage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">File Storage:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Upload Path:</span>
                        <span className="font-mono text-xs">/uploads/dev</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-mono">2.5 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Backup:</span>
                        <span className="font-mono">Today at 3:00 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Frontend Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Frontend</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cache:</span>
                        <Badge variant="outline">Clear</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bundle Size:</span>
                        <span className="font-mono">1.2 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Load Time:</span>
                        <span className="font-mono">245ms</span>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">System</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform:</span>
                        <span className="font-mono">Windows</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Node.js:</span>
                        <span className="font-mono">v18.17.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Memory:</span>
                        <span className="font-mono">256 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Process ID:</span>
                        <span className="font-mono">12345</span>
                      </div>
                    </div>
                  </div>

                  {/* Database Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Database</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-mono">PostgreSQL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connections:</span>
                        <span className="font-mono">12 / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Backup:</span>
                        <span className="font-mono">Today at 3:00 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Services */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Services</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Online Users:</span>
                        <Badge variant="outline">0</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Endpoints:</span>
                        <span className="font-mono">24 Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cron Jobs:</span>
                        <Badge className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Running
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SSL Certificate:</span>
                        <Badge className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}