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
import { CalendarIcon, BarChart3, TrendingDown, Download, PieChart, DollarSign, Settings } from "lucide-react";
import { Link } from "wouter";
import { formatNaira } from "@/lib/currency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

export default function ExpenseReports() {
  const [reportType, setReportType] = useState("monthly");
  const [dateRange, setDateRange] = useState<any>(undefined);
  const [monthlyBudget, setMonthlyBudget] = useState(500000);

  // Fetch real expense stats from API
  const { data: expenseStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Process real data for charts
  const currentMonthExpenses = expenseStats && typeof expenseStats === 'object' && 'monthlyExpenses' in expenseStats ? Number(expenseStats.monthlyExpenses) || 0 : 0;
  const totalExpenses = expenseStats && typeof expenseStats === 'object' && 'totalExpenses' in expenseStats ? Number(expenseStats.totalExpenses) || 0 : 0;

  // Debug: Check expenseStats data
  console.log('Expense Stats Debug:', {
    expenseStats,
    currentMonthExpenses,
    totalExpenses,
    hasMonthlyExpenses: expenseStats && typeof expenseStats === 'object' && 'monthlyExpenses' in expenseStats
  });

  // Fetch expense data for analysis
  const { data: expenseData } = useQuery({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  // Calculate current month expenses from expenseData as fallback
  const fallbackCurrentMonthExpenses = useMemo(() => {
    if (!expenseData || !Array.isArray(expenseData)) return 0;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return expenseData
      .filter((expense: any) => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth;
      })
      .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
  }, [expenseData]);

  // Use fallback if currentMonthExpenses is 0
  const actualCurrentMonthExpenses = currentMonthExpenses > 0 ? currentMonthExpenses : fallbackCurrentMonthExpenses;

  // Process real API data for monthly expense trend
  const monthlyData = useMemo(() => {
    if (!expenseData || !Array.isArray(expenseData)) {
      // Fallback to current month only if no data
      return [{ month: 'Current', expenses: actualCurrentMonthExpenses, budget: monthlyBudget, growth: 0 }].filter(item => item.expenses > 0);
    }

    // Group expenses by month
    const monthlyTotals: { [key: string]: number } = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    expenseData.forEach((expense: any) => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const year = expenseDate.getFullYear();
      const month = expenseDate.getMonth();
      
      // Only include current year data
      if (year === currentYear) {
        const monthKey = `${year}-${month}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(expense.amount);
      }
    });

    // Generate monthly data for last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      // Add "Current" to current month
      const displayName = i === 0 ? `${monthName} (Current)` : monthName;
      const expenses = monthlyTotals[monthKey] || 0;
      
      // Calculate growth compared to previous month
      let growth = 0;
      if (i > 0) {
        const prevDate = new Date(currentYear, currentDate.getMonth() - i + 1, 1);
        const prevMonthKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}`;
        const prevExpenses = monthlyTotals[prevMonthKey] || 0;
        if (prevExpenses > 0) {
          growth = ((expenses - prevExpenses) / prevExpenses) * 100;
        }
      }
      
      data.push({
        month: displayName,
        expenses,
        budget: monthlyBudget,
        growth: Number(growth.toFixed(1))
      });
    }

    return data;
  }, [expenseData, actualCurrentMonthExpenses, monthlyBudget]);

  // Calculate trend metrics - only use months with actual expenses
  const monthsWithExpenses = monthlyData.filter((item: any) => item.expenses > 0);
  const lastThreeMonths = monthsWithExpenses.slice(-3);
  const avgExpenses = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((sum: number, item: any) => sum + item.expenses, 0) / lastThreeMonths.length : 0;
  const trendDirection = lastThreeMonths.length >= 2 ? 
    (lastThreeMonths[lastThreeMonths.length - 1].expenses > lastThreeMonths[0].expenses ? 'up' : 'down') : 'stable';
  const trendPercentage = lastThreeMonths.length >= 2 ? 
    (() => {
      const diff = lastThreeMonths[lastThreeMonths.length - 1].expenses - lastThreeMonths[0].expenses;
      const percentage = Math.abs(diff / lastThreeMonths[0].expenses * 100);
      return Number(percentage.toFixed(1));
    })() : 0;

  // Enhanced category data using all expense records
  const categoryData = (() => {
    const categoryTotals: { [key: string]: number } = {};
    
    // Use individual expense records for comprehensive data (avoid double counting)
    if (expenseData && Array.isArray(expenseData)) {
      expenseData.forEach((expense: any) => {
        const category = expense.category || 'Uncategorized';
        const amount = Number(expense.amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
    }
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: ['#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#84cc16', '#fbbf24'][index % 8]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  })();

  const vendorData = (() => {
    // Group expenses by vendor/merchant and calculate totals
    const vendorTotals: { [key: string]: number } = {};
    
    // Use individual expense records for comprehensive data (avoid double counting)
    if (expenseData && Array.isArray(expenseData)) {
      expenseData.forEach((expense: any) => {
        const vendor = expense.merchant || 'Unknown';
        const amount = Number(expense.amount);
        vendorTotals[vendor] = (vendorTotals[vendor] || 0) + amount;
      });
    }
    
    // Convert to array and sort by amount
    return Object.entries(vendorTotals)
      .map(([vendor, amount]) => ({
        vendor,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4); // Top 4 vendors
  })();

  const averageMonthlyExpenses = monthlyData.length > 0 ? monthlyData.reduce((sum: number, item: any) => sum + item.expenses, 0) / monthlyData.length : 0;
  const budgetUtilization = actualCurrentMonthExpenses > 0 ? (actualCurrentMonthExpenses / monthlyBudget) * 100 : 0;

  // Debug: Check values for budget utilization calculation
  console.log('Budget Utilization Debug:', {
    currentMonthExpenses,
    actualCurrentMonthExpenses,
    monthlyBudget,
    budgetUtilization,
    calculation: `${actualCurrentMonthExpenses} / ${monthlyBudget} * 100 = ${budgetUtilization}`
  });

  const exportReport = () => {
    // Generate and download CSV report with current filter settings
    const csvHeader = "Date,Description,Category,Vendor,Amount,Status";
    const csvData = expenseData && Array.isArray(expenseData) ? expenseData.map((expense: any) => 
      `${expense.date},${expense.description},${expense.category},${expense.merchant},${expense.amount},${expense.status || 'Completed'}`
    ).join('\n') : '';
    
    const csvContent = `${csvHeader}\n${csvData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Expense Reports" showBack={true} backHref="/expense-manager" />
      
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
                  <SelectItem value="vendor">Vendor Analysis</SelectItem>
                  <SelectItem value="trends">Expense Trends</SelectItem>
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
                <Link href="/budget-settings">
                  <Button variant="outline" size="sm" data-testid="button-budget-settings">
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
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-orange-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-total-expenses">
                    {formatNaira(totalExpenses)}
                  </p>
                </div>
                <span className="h-4 w-4 text-xl font-bold">₦</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly</p>
                  <p className="text-xl font-bold text-orange-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-avg-monthly">
                    {formatNaira(averageMonthlyExpenses)}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Utilization</p>
                  <p className="text-xl font-bold text-purple-800" data-testid="text-budget-utilization">
                    {budgetUtilization.toFixed(1)}%
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
                  <p className="text-sm text-muted-foreground">Top Vendor</p>
                  <p className="text-lg font-bold text-purple-1000" data-testid="text-top-vendor">
                    {vendorData[0]?.percentage || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">{vendorData[0]?.vendor || 'No data'}</p>
                </div>
                <PieChart className="h-6 w-6 text-purple-1000" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Monthly Expense Trend */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Expense Trend</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Budget:</label>
                  <input
                    type="text"
                    value={monthlyBudget.toLocaleString()}
                    onChange={(e) => {
                      // Remove all non-numeric characters and convert to number
                      const numericValue = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setMonthlyBudget(numericValue);
                    }}
                    className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trendDirection === 'up' ? 'bg-orange-100 text-orange-800' : 
                  trendDirection === 'down' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trendDirection === 'up' && <TrendingDown className="w-3 h-3" />}
                  {trendDirection === 'down' && <TrendingDown className="w-3 h-3 rotate-180" />}
                  {trendDirection === 'stable' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                  <span>{trendPercentage}%</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg: {formatNaira(avgExpenses)}
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
                                <span className="font-bold text-orange-600">{formatNaira(data.expenses)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Budget:</span>
                                <span className="font-bold text-gray-600">{formatNaira(data.budget)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Growth:</span>
                                <span className={`font-bold ${data.growth >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {data.growth >= 0 ? '+' : ''}{data.growth}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-600">Utilization:</span>
                                <span className={`font-bold ${data.expenses >= data.budget ? 'text-orange-600' : 'text-green-600'}`}>
                                  {((data.expenses / data.budget) * 100).toFixed(1)}%
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
                    dataKey="expenses" 
                    fill="#f97316" 
                    name="Actual Expenses"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar 
                    dataKey="budget" 
                    fill="#e5e7eb" 
                    name="Budget"
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
                    {formatNaira(avgExpenses)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Current Trend</div>
                  <div className={`font-bold text-lg flex items-center justify-center gap-1 ${
                    trendDirection === 'up' ? 'text-orange-600' : 
                    trendDirection === 'down' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {trendDirection === 'up' && <TrendingDown className="w-4 h-4" />}
                    {trendDirection === 'down' && <TrendingDown className="w-4 h-4 rotate-180" />}
                    {trendDirection === 'stable' && <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                    <span>{trendDirection === 'up' ? 'Increasing' : trendDirection === 'down' ? 'Decreasing' : 'Stable'}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Budget Utilization</div>
                  <div className={`font-bold text-lg ${
                    actualCurrentMonthExpenses >= monthlyBudget ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {actualCurrentMonthExpenses > 0 ? ((actualCurrentMonthExpenses / monthlyBudget) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
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

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorData && vendorData.length > 0 ? (
                  vendorData.map((vendor, index) => (
                    <div key={vendor.vendor} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" data-testid={`text-vendor-${index}`}>
                          {vendor.vendor}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {vendor.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${vendor.percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-vendor-amount-${index}`}>
                          {formatNaira(vendor.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No vendor data available</p>
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
                  <li>• {trendDirection === 'up' ? 'Increasing' : trendDirection === 'down' ? 'Decreasing' : 'Stable'} expense trend over last 3 months ({trendPercentage}%)</li>
                  <li>• Current month budget utilization at {actualCurrentMonthExpenses > 0 ? ((actualCurrentMonthExpenses / monthlyBudget) * 100).toFixed(1) : 0}%</li>
                  <li>• 3-month average expenses: {formatNaira(avgExpenses)}</li>
                  <li>• {actualCurrentMonthExpenses >= monthlyBudget ? 'Budget exceeded' : 'Within budget'} for current month</li>
                  <li>• Top vendor contributes {vendorData[0]?.percentage || 0}% of total expenses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Strategic Recommendations:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {trendDirection === 'up' ? 'Implement cost control measures' : trendDirection === 'down' ? 'Maintain current spending discipline' : 'Focus on expense consistency'}</li>
                  <li>• {actualCurrentMonthExpenses >= monthlyBudget ? 'Review and reduce non-essential expenses' : 'Optimize spending within budget limits'}</li>
                  <li>• Negotiate better terms with top vendors</li>
                  <li>• Implement expense tracking and approval workflows</li>
                  <li>• Consider alternative vendors for cost optimization</li>
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
