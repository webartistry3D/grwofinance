import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, Download, PieChart, DollarSign, Settings } from "lucide-react";
import { Link } from "wouter";
import { formatNaira } from "@/lib/currency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

export default function IncomeReports() {
  const [reportType, setReportType] = useState("monthly");
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [monthlyTarget, setMonthlyTarget] = useState(280000);

  // Fetch real income stats from API
  const { data: incomeStats, isLoading } = useQuery({
    queryKey: ["/api/income/stats"],
    retry: false,
  });

  // Process real data for charts
  const currentMonthIncome = incomeStats && typeof incomeStats === 'object' && 'monthlyIncome' in incomeStats ? Number(incomeStats.monthlyIncome) || 0 : 0;
  const totalIncome = incomeStats && typeof incomeStats === 'object' && 'totalIncome' in incomeStats ? Number(incomeStats.totalIncome) || 0 : 0;

  // Debug: Check incomeStats data
  console.log('Income Stats Debug:', {
    incomeStats,
    currentMonthIncome,
    totalIncome,
    hasMonthlyIncome: incomeStats && typeof incomeStats === 'object' && 'monthlyIncome' in incomeStats
  });

  // Fetch income data for analysis
  const { data: incomeData } = useQuery({
    queryKey: ["/api/income"],
    retry: false,
  });

  // Calculate current month income from incomeData as fallback
  const fallbackCurrentMonthIncome = useMemo(() => {
    if (!incomeData || !Array.isArray(incomeData)) return 0;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return incomeData
      .filter((income: any) => {
        const incomeDate = new Date(income.date || income.createdAt);
        return incomeDate.getFullYear() === currentYear && incomeDate.getMonth() === currentMonth;
      })
      .reduce((sum: number, income: any) => sum + Number(income.amount), 0);
  }, [incomeData]);

  // Use fallback if currentMonthIncome is 0
  const actualCurrentMonthIncome = currentMonthIncome > 0 ? currentMonthIncome : fallbackCurrentMonthIncome;

  // Process real API data for monthly income trend
  const monthlyData = useMemo(() => {
    if (!incomeData || !Array.isArray(incomeData)) {
      // Fallback to current month only if no data
      return [{ month: 'Current', income: actualCurrentMonthIncome, target: monthlyTarget, growth: 0 }].filter(item => item.income > 0);
    }

    // Group income by month
    const monthlyTotals: { [key: string]: number } = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    incomeData.forEach((income: any) => {
      const incomeDate = new Date(income.date || income.createdAt);
      const year = incomeDate.getFullYear();
      const month = incomeDate.getMonth();
      
      // Only include current year data
      if (year === currentYear) {
        const monthKey = `${year}-${month}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(income.amount);
      }
    });

    // Generate monthly data for the last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      // Add "Current" to current month
      const displayName = i === 0 ? `${monthName} (Current)` : monthName;
      const income = monthlyTotals[monthKey] || 0;
      
      // Calculate growth compared to previous month
      let growth = 0;
      if (i > 0) {
        const prevDate = new Date(currentYear, currentDate.getMonth() - i + 1, 1);
        const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;
        const prevIncome = monthlyTotals[prevMonthKey] || 0;
        if (prevIncome > 0) {
          growth = ((income - prevIncome) / prevIncome) * 100;
        }
      }
      
      data.push({
        month: displayName,
        income,
        target: monthlyTarget,
        growth: Number(growth.toFixed(1))
      });
    }

    return data;
  }, [incomeData, actualCurrentMonthIncome, monthlyTarget]);

  // Calculate trend metrics - only use months with actual income
  const monthsWithIncome = monthlyData.filter((item: any) => item.income > 0);
  const lastThreeMonths = monthsWithIncome.slice(-3);
  const avgIncome = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum: number, item: any) => sum + item.income, 0) / lastThreeMonths.length : 0;
  const trendDirection = lastThreeMonths.length >= 2 ? 
    (lastThreeMonths[lastThreeMonths.length - 1].income > lastThreeMonths[0].income ? 'up' : 'down') : 'stable';
  const trendPercentage = lastThreeMonths.length >= 2 ? 
    (() => {
      const diff = lastThreeMonths[lastThreeMonths.length - 1].income - lastThreeMonths[0].income;
      const percentage = Math.abs(diff / lastThreeMonths[0].income * 100);
      return Number(percentage.toFixed(1));
    })() : 0;

  // Enhanced category data using all income records
  const categoryData = (() => {
    const categoryTotals: { [key: string]: number } = {};
    
    // Use API categoryTotals if available
    if (incomeStats && typeof incomeStats === 'object' && 'categoryTotals' in incomeStats && incomeStats.categoryTotals) {
      Object.entries(incomeStats.categoryTotals).forEach(([category, amount]) => {
        categoryTotals[category] = Number(amount);
      });
    }
    
    // Also process individual income records for more comprehensive data
    if (incomeData && Array.isArray(incomeData)) {
      incomeData.forEach((income: any) => {
        const category = income.category || 'Uncategorized';
        const amount = Number(income.amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
    }
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#8b5cf6'][index % 8]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  })();

  const clientData = (() => {
    // Group income by client/source and calculate totals
    const clientTotals: { [key: string]: number } = {};
    
    // Use recentIncome from API if available
    if (incomeStats && typeof incomeStats === 'object' && 'recentIncome' in incomeStats && Array.isArray(incomeStats.recentIncome)) {
      incomeStats.recentIncome.forEach((income: any) => {
        const client = income.source || 'Unknown';
        const amount = Number(income.amount);
        clientTotals[client] = (clientTotals[client] || 0) + amount;
      });
    }
    
    // Also process individual income records for more comprehensive data
    if (incomeData && Array.isArray(incomeData)) {
      incomeData.forEach((income: any) => {
        const client = income.source || 'Unknown';
        const amount = Number(income.amount);
        clientTotals[client] = (clientTotals[client] || 0) + amount;
      });
    }
    
    // Convert to array and sort by amount
    return Object.entries(clientTotals)
      .map(([client, amount]) => ({
        client,
        amount,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4); // Top 4 clients
  })();

  const averageMonthlyIncome = monthlyData.length > 0 ? monthlyData.reduce((sum: number, item: any) => sum + item.income, 0) / monthlyData.length : 0;
  const targetAchievement = actualCurrentMonthIncome > 0 ? (actualCurrentMonthIncome / monthlyTarget) * 100 : 0;

  // Debug: Check values for target achievement calculation
  console.log('Target Achievement Debug:', {
    currentMonthIncome,
    actualCurrentMonthIncome,
    monthlyTarget,
    targetAchievement,
    calculation: `${actualCurrentMonthIncome} / ${monthlyTarget} * 100 = ${targetAchievement}`
  });

  const exportReport = () => {
    // Generate and download CSV report with current filter settings
    const csvHeader = "Date,Description,Category,Client,Amount,Status";
    const csvData = incomeData && Array.isArray(incomeData) ? incomeData.map((income: any) => 
      `${income.date},${income.description},${income.category},${income.source},${income.amount},${income.status}`
    ).join('\n') : '';
    
    const csvContent = `${csvHeader}\n${csvData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Income Reports" showBack={true} backHref="/income-manager" />
      
      <main className="pb-20 px-4 py-6">
        {/* Report Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Analysis</SelectItem>
                  <SelectItem value="category">Category Breakdown</SelectItem>
                  <SelectItem value="client">Client Analysis</SelectItem>
                  <SelectItem value="trends">Income Trends</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-date-range">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select Period
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || {})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button onClick={exportReport} className="flex-1" data-testid="button-export-report">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Link href="/income-settings">
                  <Button variant="outline" size="sm" data-testid="button-income-settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl font-bold text-green-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-total-income">
                    {formatNaira(totalIncome)}
                  </p>
                </div>
                <span className="h-4 w-4 text-xl font-bold">₦</span>
                {/*<DollarSign className="h-6 w-6 text-green-600" />*/}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly</p>
                  <p className="text-xl font-bold text-green-1000" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-avg-monthly">
                    {formatNaira(averageMonthlyIncome)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-1000" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Target Achievement</p>
                  <p className="text-xl font-bold text-purple-800" data-testid="text-target-achievement">
                    {targetAchievement.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-purple-800" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Client</p>
                  <p className="text-lg font-bold text-purple-1000" data-testid="text-top-client">
                    {clientData[0]?.percentage || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{clientData[0]?.client || 'No data'}</p>
                </div>
                <PieChart className="h-6 w-6 text-purple-1000" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Monthly Income Trend */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Income Trend</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Target:</label>
                  <input
                    type="text"
                    value={monthlyTarget.toLocaleString()}
                    onChange={(e) => {
                      // Remove all non-numeric characters and convert to number
                      const numericValue = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setMonthlyTarget(numericValue);
                    }}
                    className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trendDirection === 'up' ? 'bg-green-100 text-green-800' : 
                  trendDirection === 'down' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                  {trendDirection === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
                  {trendDirection === 'stable' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                  <span>{trendPercentage}%</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg: {formatNaira(avgIncome)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <style>{`
                .recharts-bar-rectangle:hover {
                  filter: none !important;
                  opacity: 1 !important;
                  fill-opacity: 1 !important;
                }
              `}</style>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900">{label}</p>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Actual:</span>
                                <span className="font-bold text-green-600">{formatNaira(data.income)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Target:</span>
                                <span className="font-bold text-gray-600">{formatNaira(data.target)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Growth:</span>
                                <span className={`font-bold ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.growth >= 0 ? '+' : ''}{data.growth}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Achievement:</span>
                                <span className={`font-bold ${data.income >= data.target ? 'text-green-600' : 'text-red-600'}`}>
                                  {((data.income / data.target) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="income" 
                    fill="#10b981" 
                    name="Actual Income"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar 
                    dataKey="target" 
                    fill="#e5e7eb" 
                    name="Target"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Trend Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">3-Month Average</div>
                  <div className="font-bold text-lg" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                    {formatNaira(avgIncome)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Current Trend</div>
                  <div className={`font-bold text-lg flex items-center justify-center gap-1 ${
                    trendDirection === 'up' ? 'text-green-600' : 
                    trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trendDirection === 'up' && <TrendingUp className="w-4 h-4" />}
                    {trendDirection === 'down' && <TrendingUp className="w-4 h-4 rotate-180" />}
                    {trendDirection === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                    <span>{trendDirection === 'up' ? 'Growing' : trendDirection === 'down' ? 'Declining' : 'Stable'}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Target Achievement</div>
                  <div className={`font-bold text-lg ${
                    actualCurrentMonthIncome >= monthlyTarget ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {actualCurrentMonthIncome > 0 ? ((actualCurrentMonthIncome / monthlyTarget) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatNaira(value), ""]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-medium" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-category-${item.name.toLowerCase().replace(' ', '-')}`}>
                      {formatNaira(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientData && clientData.length > 0 ? (
                  clientData.map((client, index) => (
                    <div key={client.client} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" data-testid={`text-client-${index}`}>
                          {client.client}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {client.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${client.percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-client-amount-${index}`}>
                          {formatNaira(client.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No client data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Enhanced Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Key Insights:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {trendDirection === 'up' ? 'Positive' : trendDirection === 'down' ? 'Negative' : 'Stable'} income trend over last 3 months ({trendPercentage}%)</li>
                  <li>• Current month target achievement at {actualCurrentMonthIncome > 0 ? ((actualCurrentMonthIncome / monthlyTarget) * 100).toFixed(1) : 0}%</li>
                  <li>• 3-month average income: {formatNaira(avgIncome)}</li>
                  <li>• {actualCurrentMonthIncome >= monthlyTarget ? 'Target exceeded' : 'Below target'} for current month</li>
                  <li>• Top client contributes {clientData[0]?.percentage || 0}% of total income</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Strategic Recommendations:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {trendDirection === 'up' ? 'Maintain current growth trajectory' : trendDirection === 'down' ? 'Implement recovery strategies' : 'Focus on consistency'}</li>
                  <li>• {actualCurrentMonthIncome < monthlyTarget ? 'Adjust targets to realistic levels' : 'Set higher targets for next quarter'}</li>
                  <li>• Diversify income sources to reduce volatility</li>
                  <li>• Focus on high-margin service offerings</li>
                  <li>• Implement recurring revenue streams for stability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}