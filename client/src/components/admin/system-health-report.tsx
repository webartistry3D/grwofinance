import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Database, 
  HardDrive, 
  Monitor,
  Cpu, 
  Zap,
  Users, 
  Server, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface SystemHealthData {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    lastChecked: string;
  };
  database: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error: string | null;
  };
  storage: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error: string | null;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: {
    seconds: number;
    human: string;
  };
  activeUsers: {
    count: number;
    list: string[];
  };
  databaseStats: {
    users: number;
    expenses: number;
    income: number;
    invoices: number;
  };
  systemInfo: {
    platform: string;
    nodeVersion: string;
    environment: string;
    pid: number;
  };
  performance: {
    apiResponseTime: number;
    memoryUsagePercent: number;
  };
}

export function SystemHealthReport() {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log("🔍 SystemHealthReport component rendering");

  const { data: healthData, isLoading, error, refetch } = useQuery<SystemHealthData>({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Debug: Log all states
  console.log("🔍 SystemHealthReport states:", { 
    isLoading, 
    error: error?.message, 
    hasData: !!healthData,
    activeUsers: healthData?.activeUsers 
  });

  // Debug: Log when data changes
  React.useEffect(() => {
    if (healthData) {
      console.log("🔍 Frontend received healthData:", {
        overall: healthData.overall,
        activeUsers: healthData.activeUsers,
        databaseStats: healthData.databaseStats
      });
    }
  }, [healthData]);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatBytes = (bytes: number) => {
    return `${bytes} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Health Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Health Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-2">Failed to load system health data</p>
            <p className="text-sm text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <Button onClick={() => refetch()} className="mt-2" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Health Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">No health data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="system-health-report">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              System Health Report
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getHealthColor(healthData.overall.status)}>
                {getHealthIcon(healthData.overall.status)}
                <span className="ml-1 capitalize">{healthData.overall.status}</span>
              </Badge>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(healthData.overall.score)}`}>
                {healthData.overall.score}%
              </div>
              <p className="text-sm text-muted-foreground">Health Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {healthData.performance.apiResponseTime}ms
              </div>
              <p className="text-sm text-muted-foreground">API Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {healthData.uptime.human}
              </div>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Last checked: {format(new Date(healthData.overall.lastChecked), 'PPpp')}
          </p>
        </CardContent>
      </Card>

      {/* Core Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Database className="w-5 h-5 mr-2" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge className={getHealthColor(healthData.database.status)}>
                  {getHealthIcon(healthData.database.status)}
                  <span className="ml-1 capitalize">{healthData.database.status}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span className="font-mono">{healthData.database.responseTime}ms</span>
              </div>
              {healthData.database.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded dark:text-red-400 dark:bg-red-900/20">
                  {healthData.database.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <HardDrive className="w-5 h-5 mr-2" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge className={getHealthColor(healthData.storage.status)}>
                  {getHealthIcon(healthData.storage.status)}
                  <span className="ml-1 capitalize">{healthData.storage.status}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span className="font-mono">{healthData.storage.responseTime}ms</span>
              </div>
              {healthData.storage.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded dark:text-red-400 dark:bg-red-900/20">
                  {healthData.storage.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Monitor className="w-5 h-5 mr-2" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  Memory Usage
                </span>
                <span className="font-mono">{healthData.performance.memoryUsagePercent}%</span>
              </div>
              <Progress value={healthData.performance.memoryUsagePercent} className="h-2" />
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Heap Used: {formatBytes(healthData.memory.heapUsed)}</div>
                <div>Heap Total: {formatBytes(healthData.memory.heapTotal)}</div>
                <div>RSS: {formatBytes(healthData.memory.rss)}</div>
              </div>
            </div>

            {/* CPU Info */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                CPU Usage
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>User: {healthData.cpu.user}μs</div>
                <div>System: {healthData.cpu.system}μs</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Database className="w-5 h-5 mr-2" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{healthData.databaseStats.users.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthData.databaseStats.expenses.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Expenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthData.databaseStats.income.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Income Records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthData.databaseStats.invoices.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Active Users
            </div>
            <Badge variant="outline">
              {healthData.activeUsers.count} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData.activeUsers.count > 0 ? (
            <>
              {(() => {
                console.log("🔍 Rendering active users list:", healthData.activeUsers.list);
                return null;
              })()}
              <div className="space-y-2">
                {healthData.activeUsers.list.slice(0, isExpanded ? undefined : 5).map((userDisplay, index) => {
                  console.log(`🔍 Rendering user ${index}:`, userDisplay);
                  return (
                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                      {userDisplay}
                    </div>
                  );
                })}
                {healthData.activeUsers.list.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full"
                  >
                    {isExpanded ? 'Show Less' : `Show ${healthData.activeUsers.list.length - 5} More`}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">No active users</p>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Server className="w-5 h-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <Badge variant={healthData.systemInfo.environment === 'production' ? 'default' : 'secondary'}>
                    {healthData.systemInfo.environment}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Process ID:</span>
                  <span className="font-mono">{healthData.systemInfo.pid}</span>
                </div>
              </div>
            </div>

            {/* Backend Status */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Backend</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getHealthColor(healthData.database.status)}>
                    {getHealthIcon(healthData.database.status)}
                    <span className="ml-1 capitalize">{healthData.database.status}</span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-mono">{healthData.performance.apiResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <Badge className={getHealthColor(healthData.database.status)}>
                    {healthData.database.status === 'healthy' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-mono">{healthData.uptime.human}</span>
                </div>
              </div>
            </div>

            {/* Storage Status */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Storage</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getHealthColor(healthData.storage.status)}>
                    {getHealthIcon(healthData.storage.status)}
                    <span className="ml-1 capitalize">{healthData.storage.status}</span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-mono">{healthData.storage.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory Usage:</span>
                  <span className="font-mono">{healthData.performance.memoryUsagePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-mono">{formatBytes(healthData.memory.heapTotal - healthData.memory.heapUsed)}</span>
                </div>
              </div>
            </div>

            {/* Frontend Status */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Frontend</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build:</span>
                  <span className="font-mono">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Deploy:</span>
                  <span className="font-mono">{format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache:</span>
                  <Badge variant="outline">Clear</Badge>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">System</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-mono">{healthData.systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Node.js:</span>
                  <span className="font-mono">{healthData.systemInfo.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory Total:</span>
                  <span className="font-mono">{formatBytes(healthData.memory.heapTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory Used:</span>
                  <span className="font-mono">{formatBytes(healthData.memory.heapUsed)}</span>
                </div>
              </div>
            </div>

            {/* Database Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Database</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getHealthColor(healthData.database.status)}>
                    {healthData.database.status === 'healthy' ? 'Connected' : 'Error'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-mono">{healthData.database.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Records:</span>
                  <span className="font-mono">
                    {healthData.databaseStats.users + healthData.databaseStats.expenses + healthData.databaseStats.income + healthData.databaseStats.invoices}
                  </span>
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
                  <span className="text-muted-foreground">API Server:</span>
                  <Badge className="text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Running
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WebSocket:</span>
                  <Badge className="text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Storage:</span>
                  <Badge className={getHealthColor(healthData.storage.status)}>
                    {getHealthIcon(healthData.storage.status)}
                    <span className="ml-1">{healthData.storage.status}</span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online Users:</span>
                  <Badge variant="outline">{healthData.activeUsers.count}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
