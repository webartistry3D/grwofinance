import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton"; // if you’re using shadcn/ui Skeleton
import { 
  Camera, Upload, Edit3, TrendingDown, 
  Receipt, History, BarChart3, Settings, 
  ShoppingCart, Car, Zap, ChevronDown, FileText, Shield, PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type TimePeriod = 'daily' | 'last7days' | 'last30days' | 'yearly';

interface ExpenseStats {
  totalExpenses: number;
  monthlyExpenses: number;
  weeklyExpenses: number;
  receiptCount: number;
  recentExpenses: Array<{
    id: string;
    merchant: string;
    amount: number;
    date: string;
    category: string;
    imageUrl?: string;
    notes?: string;
    dayOfWeek?: string;
    transactionTime?: string;
  }>;
}

export default function ExpenseManager() {
  const [, setLocation] = useLocation();
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last30days');

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Fetch expenses from API
  const { data: expenseStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Only use real data from API - no fallback to mock data
  const stats: ExpenseStats = {
    totalExpenses: (expenseStats && typeof expenseStats === 'object' && 'recentExpenses' in expenseStats && Array.isArray(expenseStats.recentExpenses) 
      ? expenseStats.recentExpenses.reduce((sum, e) => sum + parseFloat(e.amount) + parseFloat(e.vatAmount || '0'), 0)
      : (expenseStats && typeof expenseStats === 'object' && 'totalExpenses' in expenseStats ? Number(expenseStats.totalExpenses) : 0)),
    monthlyExpenses: (expenseStats && typeof expenseStats === 'object' && 'monthlyTotal' in expenseStats ? Number(expenseStats.monthlyTotal) : 0),
    weeklyExpenses: (expenseStats && typeof expenseStats === 'object' && 'weeklyExpenses' in expenseStats ? Number(expenseStats.weeklyExpenses) : 0),
    receiptCount: (expenseStats && typeof expenseStats === 'object' && 'receiptCount' in expenseStats ? Number(expenseStats.receiptCount) : 0),
    recentExpenses: (expenseStats && typeof expenseStats === 'object' && 'recentExpenses' in expenseStats ? Array.isArray(expenseStats.recentExpenses) ? expenseStats.recentExpenses : [] : []), // <- always fallback to array
  };

  // Calculate expense breakdown for piechart
  const COLORS = ['#EA580C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316'];
  const categoryTotals = (expenseStats as any)?.categoryTotals || {};
  
  // For now, use the existing categoryTotals but add period filtering logic
  // In a real implementation, we'd need all expenses with dates to filter by period
  const expenseBreakdown = Object.entries(categoryTotals).map(([category, amount], idx) => ({
    category,
    amount: Number(amount),
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Expense Manager" showBack={true} backHref="/" />

      <main className="pb-20 px-4 py-4">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Expenses */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />  // Skeleton while loading
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "#EA580C", fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-total-expenses"
                    >
                      {formatNaira(stats.totalExpenses)}
                    </p>
                  )}
                </div>
                {/*<TrendingDown className="h-8 w-8" style={{ color: "#EA580C" }} />*/}
              </div>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "#EA580C", fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-weekly-expenses"
                    >
                      {formatNaira(stats.weeklyExpenses)}
                    </p>
                  )}
                </div>
                {/*<TrendingDown className="h-8 w-8" style={{ color: "#EA580C" }} />*/}
              </div>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "#EA580C", fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-monthly-expenses"
                    >
                      {formatNaira(stats.monthlyExpenses)}
                    </p>
                  )}
                </div>
                {/*<TrendingDown className="h-8 w-8" style={{ color: "#EA580C" }} />*/}
              </div>
            </CardContent>
          </Card>

          {/* Total Receipts */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "#EA580C", fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-receipt-count"
                    >
                      {stats.receiptCount}
                    </p>
                  )}
                </div>
                <FileText className="h-8 w-8" style={{ color: "#EA580C" }} />
              </div>
            </CardContent>
          </Card>
        </section>


        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/scan-receipt"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-scan-receipt"
              >
                <Camera className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Scan</span>
              </Button>
            </Link>

            <Link
              href="/upload-receipt"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-upload-receipt"
              >
                <Upload className="h-5 w-5 text-green-600" />
                <span className="text-xs">Upload</span>
              </Button>
            </Link>

            <Link
              href="/manual-entry"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-manual-entry"
              >
                <Edit3 className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Type</span>
              </Button>
            </Link>

            <Link
              href="/expense-history"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-expense-reports"
              >
                <FileText className="h-5 w-5 text-orange-600" />
                <span className="text-xs">Reports</span>
              </Button>
            </Link>
            <Link
              href="/expense-history"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-expenses"
              >
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-xs">Expenses</span>
              </Button>
            </Link>

            {/* Added from Expense Management */}
            <Link
              href="/expense-categories"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-categories"
              >
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="text-xs">Categories</span>
              </Button>
            </Link>

            <Link
              href="/tax-compliance"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-tax"
              >
                <Shield className="h-5 w-5 text-red-600" />
                <span className="text-xs">Tax</span>
              </Button>
            </Link>

            <Link
              href="/expense-history"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]"
                data-testid="button-history"
              >
                <History className="h-5 w-5 text-indigo-600" />
                <span className="text-xs">History</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Payments */}
        {/*}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Payments</h2>
            <Link href="/expense-history" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button variant="outline" size="sm" data-testid="button-view-expense-history">
                View All
              </Button>
            </Link>
          </div>
          {stats.recentExpenses && stats.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {stats.recentExpenses.slice(0, 3).map((expense) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.merchant}</p>
                      <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                        {formatNaira(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No recent expenses</p>
            </Card>
          )}
        </section>
        */}


        {/* Main Content - Two 50% Sections Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left 50% - Recent Expenses */}
          <section className="lg:w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Expenses</h2>
              <Link href="/expense-history">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="link-view-all-expenses"
                >
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {Array.isArray(stats.recentExpenses) && stats.recentExpenses.length > 0 ? (
                stats.recentExpenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(234, 88, 12, 0.1)'}}>
                            <TrendingDown className="h-5 w-5" style={{color: '#EA580C'}} />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-expense-merchant-${expense.id}`}>{expense.merchant}</p>
                            <p className="text-sm text-muted-foreground">{expense.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-expense-amount-${expense.id}`}>
                            {formatNaira(expense.amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No recent expenses</p>
                </Card>
              )}
            </div>
          </section>

          {/* Right 50% - Expense Breakdown Pie Chart */}
          <section className="lg:w-full">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Expense Breakdown</h2>
                </div>
                
                {/* Time Period Selection Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('daily')}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={selectedPeriod === 'last7days' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('last7days')}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant={selectedPeriod === 'last30days' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('last30days')}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant={selectedPeriod === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('yearly')}
                  >
                    Yearly
                  </Button>
                </div>
                
                {expenseBreakdown.length > 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={expenseBreakdown} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={100} 
                          dataKey="amount" 
                          stroke="#fff" 
                          strokeWidth={2}
                          startAngle={90}
                          endAngle={-270}
                          animationBegin={0}
                          animationDuration={800}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => [
                            formatNaira(value),
                            props.payload.category || name
                          ]}
                          labelStyle={{ color: "#333", fontWeight: "bold" }}
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
                            padding: "12px"
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value: string, entry: any) => (
                            <span style={{ color: entry.color, fontWeight: 'bold' }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-center">
                    <p className="text-muted-foreground">No expense data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}

/*import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/currency";
import { Camera, Upload, Edit3, TrendingDown, Receipt, History, BarChart3, Settings, ShoppingCart, Car, Zap } from "lucide-react";

interface ExpenseStats {
  totalExpenses: number;
  monthlyExpenses: number;
  weeklyExpenses: number;
  receiptCount: number;
  recentExpenses: Array<{
    id: string;
    merchant: string;
    amount: number;
    date: string;
        {/* Stats Overview /}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expense</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-total-expenses">
                    {formatNaira(stats.totalExpenses)}
                  </p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <TrendingDown className="h-8 w-8" style={{color: '#EA580C'}} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-weekly-expenses">
                    {formatNaira(stats.weeklyExpenses)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8" style={{color: '#EA580C'}} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipts Scanned</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-receipt-count">
                    {stats.receiptCount}
                  </p>
                </div>
                <Receipt className="h-8 w-8" style={{color: '#60A5FA'}} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions /}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/scan-receipt" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button className="h-16 flex flex-col items-center justify-center space-y-1 w-full" data-testid="button-scan-receipt">
                <Camera className="h-5 w-5" />
                <span className="text-xs">Scan</span>
              </Button>
            </Link>
            
            <Link href="/upload-receipt" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 w-full" data-testid="button-upload-receipt">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Upload</span>
              </Button>
            </Link>
            
            <Link href="/manual-entry" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 w-full" data-testid="button-manual-entry">
                <Edit3 className="h-5 w-5" />
                <span className="text-xs">Type</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Expenses /}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Expenses</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" data-testid="link-view-all-expenses">View All</Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {Array.isArray(stats.recentExpenses) && stats.recentExpenses.length > 0 ? (
              stats.recentExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        {expense.category === 'Groceries' && <ShoppingCart className="h-5 w-5 text-blue-600" />}
                        {expense.category === 'Transportation' && <Car className="h-5 w-5 text-blue-600" />}
                        {expense.category === 'Utilities' && <Zap className="h-5 w-5 text-blue-600" />}
                        {!['Groceries', 'Transportation', 'Utilities'].includes(expense.category) && <div className="font-bold text-blue-600 text-lg">₦</div>}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-expense-merchant-${expense.id}`}>{expense.merchant}</p>
                        <p className="text-sm text-muted-foreground">{expense.category} • {expense.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-expense-amount-${expense.id}`}>
                        {formatNaira(expense.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Navigation Menu /}
        <section>
          <h2 className="text-lg font-semibold mb-3">Expense Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/transactions">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <History className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">History</h3>
                      <p className="text-sm text-muted-foreground">View all transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Reports</h3>
                      <p className="text-sm text-muted-foreground">Analytics and insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/expense-categories">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-gray-600" />
                    <div>
                      <h3 className="font-semibold">Categories</h3>
                      <p className="text-sm text-muted-foreground">Manage expense categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/expense-categories">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8" style={{color: '#EA580C'}} />
                    <div>
                      <h3 className="font-semibold">Settings</h3>
                      <p className="text-sm text-muted-foreground">Manage expense categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}*/