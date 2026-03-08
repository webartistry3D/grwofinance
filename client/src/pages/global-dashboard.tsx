import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/currency";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
  Target,
  Calendar,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
  LineChart,
  LabelList,
} from "recharts";

/**
 * Production Global Dashboard:
 * - Uses real endpoints from your routes.ts:
 *   - /api/dashboard/stats  (expenses summary)
 *   - /api/income/stats     (income summary)
 *   - /api/expenses        (all expense records - used to build charts)
 *   - /api/income          (all income records - used to build charts)
 *   - /api/user/settings   (optional: for savingsGoal or user stored targets)
 *
 * - No mock data remains. If endpoints lack certain fields,
 *   the transformer provides safe defaults to keep the UI stable.
 */

/* ---------- Types ---------- */

interface ExpenseRecord {
  id: string;
  amount: string | number;
  category?: string;
  date?: string;
  description?: string;
  vatAmount?: string | number;
}

interface IncomeRecord {
  id: string;
  amount: string | number;
  source?: string;
  date?: string;
  status?: string;
}

interface DashboardApiResponse {
  totalExpenses?: number;
  monthlyTotal?: number; // monthly expenses
  weeklyTotal?: number; // weekly expenses
  categoryTotals?: Record<string, number>;
  receiptCount?: number;
  categoryCount?: number;
  recentTransactions?: ExpenseRecord[];
}

interface IncomeApiResponse {
  totalIncome?: number;
  monthlyTotal?: number; // monthly income
  weeklyTotal?: number; // weekly income
  pendingInvoices?: number;
  recentPayments?: IncomeRecord[];
}

interface UserSettings {
  savingsGoal?: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    createdAt: string;
    updatedAt: string;
  }>;
  // any other settings you store
}

interface GlobalStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netPosition: number;
  weeklyIncome: number;
  weeklyExpenses: number;
  totalTransactions: number;
  chartData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  savingsGoal: {
    target: number;
    current: number;
    targetDate: string;
  };
  cashFlow: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
}

/* ---------- Helpers ---------- */

const COLORS = ["#EA580C", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16"];

function parseNumber(v: number | string | undefined | null) {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function monthLabel(date: Date) {
  return date.toLocaleString("default", { month: "short" });
}

function getLastNMonths(n: number) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: monthLabel(d) });
  }
  return months;
}

function getLastNMonthsForYear(year: number) {
  const months = [];
  for (let i = 0; i <= 11; i++) {
    const d = new Date(year, i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: monthLabel(d) });
  }
  return months;
}

function getAvailableYears(incomes: IncomeRecord[], expenses: ExpenseRecord[]) {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  
  // Add current year
  years.add(currentYear);
  
  // Add years from income records
  incomes.forEach(income => {
    if (income.date) {
      const year = new Date(income.date).getFullYear();
      years.add(year);
    }
  });
  
  // Add years from expense records
  expenses.forEach(expense => {
    if (expense.date) {
      const year = new Date(expense.date).getFullYear();
      years.add(year);
    }
  });
  
  return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
}

function monthKeyFromDateString(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${d.getMonth()}`; // unique key per month
}

function weekKeyFromDateString(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  // get monday-start week number anchor: find date of Monday of that week
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10); // yyyy-mm-dd (monday)
}

/* ---------- Fetch wrapper for react-query ---------- */
async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${url} returned ${res.status} ${res.statusText} ${text ? "- " + text : ""}`);
  }
  return res.json();
}

/* ---------- Component ---------- */

export default function GlobalDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Debug: Log when selectedYear changes
  useEffect(() => {
    console.log('selectedYear state changed to:', selectedYear);
  }, [selectedYear]);

  // Invalidate queries when component mounts or when user returns to dashboard
  useEffect(() => {
    // Invalidate all relevant queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['income-stats'] });
    queryClient.invalidateQueries({ queryKey: ['income-list'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
    console.log('Queries invalidated for fresh data');
  }, []); // Run once on mount

  // 1) Core dashboard (expenses summary)
  const dashboardQuery = useQuery<DashboardApiResponse>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchJson("/api/dashboard/stats"),
    staleTime: 1000 * 60 * 2, // 2m
    retry: 1,
  });

  // 2) Income summary (to compute incomes & net position)
  const incomeStatsQuery = useQuery<IncomeApiResponse>({
    queryKey: ["income-stats"],
    queryFn: () => fetchJson("/api/income/stats"),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // 3) Full expense list (used to compute chart data / cash flow)
  const expensesListQuery = useQuery<ExpenseRecord[]>({
    queryKey: ["expenses-list"],
    queryFn: () => fetchJson("/api/expenses"),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    // we can keep this enabled so charts can draw; if you want minimal requests, set enabled: false
  });

  // 4) Full income list (used to compute chart data / cash flow)
  const incomeListQuery = useQuery<IncomeRecord[]>({
    queryKey: ["income-list"],
    queryFn: () => fetchJson("/api/income"),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // 5) Optional user settings (for savingsGoal if you stored it)
  const settingsQuery = useQuery<UserSettings | null>({
    queryKey: ["user-settings"],
    queryFn: () => fetchJson("/api/user/settings"),
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });

  const savingsGoalsQuery = useQuery({
      queryKey: ["savings-goals"],
      queryFn: () => fetchJson("/api/savings-goals"),
      staleTime: 1000 * 60 * 5,
      retry: 1,
    });

  const isLoading =
    dashboardQuery.isLoading ||
    incomeStatsQuery.isLoading ||
    expensesListQuery.isLoading ||
    incomeListQuery.isLoading ||
    savingsGoalsQuery.isLoading ||
    settingsQuery.isLoading;

  const isError =
    dashboardQuery.isError ||
    incomeStatsQuery.isError ||
    expensesListQuery.isError ||
    incomeListQuery.isError ||
    savingsGoalsQuery.isError;

  // ----- Transform backend responses into the UI's GlobalStats shape -----
  const currentStats = useMemo<GlobalStats | null>(() => {
    if (!dashboardQuery.data && !incomeStatsQuery.data && !expensesListQuery.data && !incomeListQuery.data)
      return null;

    const dash = dashboardQuery.data || {};
    const incStats = incomeStatsQuery.data || {};
    const expenses = expensesListQuery.data || [];
    const incomes = incomeListQuery.data || [];

    // Basic numeric values
    {/*const monthlyExpenses = parseNumber(dash.monthlyTotal || dash.monthlyTotal);
    const weeklyExpenses = parseNumber(dash.weeklyTotal || dash.weeklyTotal);
    const totalExpenses = parseNumber(dash.totalExpenses || 0);*/}
    // Calculate expenses more reliably
    const monthlyExpenses =
      dash.monthlyTotal !== undefined
        ? parseNumber(dash.monthlyTotal)
        : expenses.reduce((sum, e) => {
            const d = new Date(e.date ?? "");
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              ? sum + parseNumber(e.amount) + parseNumber(e.vatAmount || '0')
              : sum;
          }, 0);

    const weeklyExpenses =
      dash.weeklyTotal !== undefined
        ? parseNumber(dash.weeklyTotal)
        : expenses.reduce((sum, e) => {
            const d = new Date(e.date ?? "");
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return d >= startOfWeek && d <= endOfWeek ? sum + parseNumber(e.amount) + parseNumber(e.vatAmount || '0') : sum;
          }, 0);

    const totalExpenses =
      dash.totalExpenses !== undefined
        ? parseNumber(dash.totalExpenses)
        : expenses.reduce((sum, e) => sum + parseNumber(e.amount) + parseNumber(e.vatAmount || '0'), 0);


    const monthlyIncome = parseNumber(incStats.monthlyTotal || 0);
    const weeklyIncome = parseNumber(incStats.weeklyTotal || 0);
    const totalIncome = parseNumber(incStats.totalIncome || 0);

    // Net position preference:
    // Prefer (totalIncome - totalExpenses) if both present, otherwise fallback to monthlyIncome - monthlyExpenses
    let netPosition = 0;
    if (totalIncome || totalExpenses) {
      netPosition = totalIncome - totalExpenses;
    } else {
      netPosition = monthlyIncome - monthlyExpenses;
    }

    // chartData: full 12 months (income vs expenses) computed from full lists if available,
    // otherwise fallback to current month values
    const months = getLastNMonthsForYear(selectedYear);
    const monthSums: { [k: string]: { income: number; expenses: number; label: string } } = {};

    months.forEach((m) => {
      const key = `${m.year}-${m.month}`;
      monthSums[key] = { income: 0, expenses: 0, label: `${m.label}` };
    });

    // Aggregate incomes by month (filtered by selected year)
    console.log('Debug - Selected Year:', selectedYear);
    console.log('Debug - Available incomes count:', incomeListQuery.data?.length || 0);
    console.log('Debug - Available expenses count:', expensesListQuery.data?.length || 0);
    console.log('Debug - Sample incomes:', incomeListQuery.data?.slice(0, 5));
    console.log('Debug - Sample expenses:', expensesListQuery.data?.slice(0, 5));
    
    incomes.forEach((it) => {
      const key = monthKeyFromDateString(it.date);
      if (!key) return;
      const incomeDate = it.date ? new Date(it.date) : null;
      if (!incomeDate || isNaN(incomeDate.getTime())) return;
      const incomeYear = incomeDate.getFullYear();
      console.log('Debug - Income:', it.date, 'Year:', incomeYear, 'Selected Year:', selectedYear, 'Match:', incomeYear === selectedYear);
      if (incomeYear !== selectedYear) return; // Filter by selected year
      if (!monthSums[key]) {
        // ignore months outside our last 3 months
        return;
      }
      monthSums[key].income += parseNumber(it.amount);
    });

    // Aggregate expenses by month (filtered by selected year)
    expenses.forEach((it) => {
      const key = monthKeyFromDateString(it.date);
      if (!key) return;
      const expenseDate = it.date ? new Date(it.date) : null;
      if (!expenseDate || isNaN(expenseDate.getTime())) return;
      const expenseYear = expenseDate.getFullYear();
      console.log('Debug - Expense:', it.date, 'Year:', expenseYear, 'Selected Year:', selectedYear, 'Match:', expenseYear === selectedYear);
      if (expenseYear !== selectedYear) return; // Filter by selected year
      if (!monthSums[key]) return;
      monthSums[key].expenses += parseNumber(it.amount);
    });

    const chartData = Object.values(monthSums).map((m) => ({
      month: m.label,
      income: Math.round(m.income),
      expenses: Math.round(m.expenses),
    }));

    console.log('Debug - Final Chart Data for Year', selectedYear, ':', chartData);

    // If we have no list data, produce a safe fallback using monthly totals
    if (chartData.every((c) => c.income === 0 && c.expenses === 0)) {
      // fallback: replicate current month values (keeps charts functioning)
      chartData.splice(0, chartData.length);
      months.forEach((m) => {
        chartData.push({
          month: m.label,
          income: Math.round(monthlyIncome || 0),
          expenses: Math.round(monthlyExpenses || 0),
        });
      });
    }

    // expenseBreakdown: from dash.categoryTotals -> array with colors
    const categoryTotals = dash.categoryTotals || {};
    const expenseBreakdown = Object.entries(categoryTotals).map(([category, amount], idx) => ({
      category,
      amount: parseNumber(amount),
      color: COLORS[idx % COLORS.length],
    }));

    // if no breakdown provided, derive top categories from expenses list (fallback)
    if (expenseBreakdown.length === 0 && expenses.length > 0) {
      const catMap: Record<string, number> = {};
      expenses.forEach((e) => {
        const cat = e.category || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + parseNumber(e.amount);
      });
      let i = 0;
      Object.entries(catMap).forEach(([cat, amt]) => {
        expenseBreakdown.push({ category: cat, amount: Math.round(amt), color: COLORS[i % COLORS.length] });
        i++;
      });
    } 


 

    // savingsGoal: prefer user settings if present, otherwise build a conservative default
    console.log('Settings query data:', settingsQuery.data);
    const savingsGoalsArray = savingsGoalsQuery.data || [];
    console.log('Savings goals array:', savingsGoalsArray);
    const primaryGoal = savingsGoalsArray.length > 0 ? savingsGoalsArray[0] : null;
    console.log('Primary goal:', primaryGoal);
    
    const savingsGoal = primaryGoal
      ? {
          target: parseNumber(primaryGoal.targetAmount),
          current: parseNumber(primaryGoal.currentAmount || 0),
          targetDate: new Date(primaryGoal.deadline).toLocaleString("default", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }
      : {
          target: 0, // default to ₦0.00 - should not be auto-populated
          current: Math.round(netPosition),
          targetDate: "", // empty when no goal
        };

    // cashFlow: compute 4 weekly buckets from last 4 Mondays
    const weeks: string[] = []; // monday ISO date keys
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i * 7);
      // normalize to Monday of that week
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      weeks.push(monday.toISOString().slice(0, 10));
    }

    const weeklyMap: Record<string, { inflow: number; outflow: number }> = {};
    weeks.forEach((w) => (weeklyMap[w] = { inflow: 0, outflow: 0 }));

    incomes.forEach((inc) => {
      const wk = weekKeyFromDateString(inc.date);
      if (!wk || !weeklyMap[wk]) return;
      weeklyMap[wk].inflow += parseNumber(inc.amount);
    });

    expenses.forEach((exp) => {
      const wk = weekKeyFromDateString(exp.date);
      if (!wk || !weeklyMap[wk]) return;
      weeklyMap[wk].outflow += parseNumber(exp.amount);
    });

    const cashFlow = weeks.map((w) => {
      const inflow = Math.round(weeklyMap[w].inflow);
      const outflow = Math.round(weeklyMap[w].outflow);
      return { date: w, inflow, outflow, balance: inflow - outflow };
    });

    const totalTransactions = Math.max(
      0,
      parseInt(String(dash.receiptCount || 0)) + (incStats.pendingInvoices ? parseInt(String(incStats.pendingInvoices)) : 0)
    );

    return {
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      netPosition: Math.round(netPosition),
      weeklyIncome: Math.round(weeklyIncome),
      weeklyExpenses: Math.round(weeklyExpenses),
      totalTransactions,
      chartData,
      expenseBreakdown,
      savingsGoal,
      cashFlow,
    };
  }, [
    dashboardQuery.data,
    incomeStatsQuery.data,
    expensesListQuery.data,
    incomeListQuery.data,
    settingsQuery.data,
    selectedYear, // Add selectedYear to dependency array
  ]);

  const { data: savings, isLoading: isSavingsLoading } = useQuery({
      queryKey: ["/api/savings"],
      queryFn: async () => {
        const res = await fetch("/api/savings");
        if (!res.ok) throw new Error("Failed to fetch savings");
        return res.json();
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });

  const { data: netWorthHistory, isLoading: isNetWorthLoading } = useQuery({
      queryKey: ["/api/user/net-worth"],
      queryFn: async () => {
        const res = await fetch("/api/user/net-worth");
        if (!res.ok) throw new Error("Failed to fetch net worth history");
        return res.json();
      }
    }); 

  const refreshSavings = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
  };

  const totalSavings =
      savings?.reduce(
        (sum: number, r: { amount: number }) => sum + Number(r.amount),
        0
      ) ?? 0;

  // Get the total net worth from all records (same calculation as Net Worth Records table)
  const totalNetWorth = netWorthHistory && netWorthHistory.length > 0
    ? netWorthHistory.reduce((sum: number, record: any) => {
        const assets = record.assets || {};
        const cashValue = parseFloat(String(assets.cash || '0').replace(/,/g, ''));
        const inventoryValue = parseFloat(String(assets.inventory || '0').replace(/,/g, ''));
        const equipmentValue = parseFloat(String(assets.equipment || '0').replace(/,/g, ''));
        const investmentsValue = parseFloat(String(assets.investments || '0').replace(/,/g, ''));
        const propertyValue = parseFloat(String(assets.property || '0').replace(/,/g, ''));
        const otherAssetsValue = parseFloat(String(assets.otherAssets || '0').replace(/,/g, ''));
        const assetsTotal = cashValue + inventoryValue + equipmentValue + investmentsValue + propertyValue + otherAssetsValue;
        
        const liabilities = record.liabilities || {};
        const accountsPayableValue = parseFloat(String(liabilities.accountsPayable || '0').replace(/,/g, ''));
        const loansValue = parseFloat(String(liabilities.loans || '0').replace(/,/g, ''));
        const creditCardsValue = parseFloat(String(liabilities.creditCards || '0').replace(/,/g, ''));
        const mortgagesValue = parseFloat(String(liabilities.mortgages || '0').replace(/,/g, ''));
        const otherLiabilitiesValue = parseFloat(String(liabilities.otherLiabilities || '0').replace(/,/g, ''));
        const liabilitiesTotal = accountsPayableValue + loansValue + creditCardsValue + mortgagesValue + otherLiabilitiesValue;
        
        return sum + (assetsTotal - liabilitiesTotal);
      }, 0)
    : 0;

  

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header
          title={
            <span>
              <span style={{ color: "#29A378" }}>Grwo</span>
              <span style={{ color: "#FFFFFF" }}>Finance</span>
            </span>
          }
        />
        <main className="pb-20 px-4 py-4">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-28 bg-muted rounded" />
              <div className="h-28 bg-muted rounded" />
            </div>
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (isError || !currentStats) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header
          title={
            <span>
              <span style={{ color: "#29A378" }}>Grwo</span>
              <span style={{ color: "#FFFFFF" }}>Finance</span>
            </span>
          }
        />
        <main className="pb-20 px-4 py-4">
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2">Please check your connection or try again later.</p>
            <div className="mt-4">
              <Button onClick={() => {
                // Refetch all dashboard queries
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
                queryClient.invalidateQueries({ queryKey: ["income-stats"] });
                queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
                queryClient.invalidateQueries({ queryKey: ["income-list"] });
                queryClient.invalidateQueries({ queryKey: ["user-settings"] });
                queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
                queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
                queryClient.invalidateQueries({ queryKey: ["/api/user/net-worth"] });
              }}>Retry</Button>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  const isProfit = currentStats.netPosition > 0;

  /* ---------- Render: preserved UI with real data ---------- */
  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header
        title={
          <span>
            <span style={{ color: "#29A378" }}>Grwo</span>
            <span style={{ color: "#FFFFFF" }}>Finance</span>
          </span>
        }
      />

      <main className="pb-20 px-4 py-4">
        {/* Welcome Section */}
        <section className="mb-6">
          <h1 className="text-lg font-regular text-foreground mb-2">Welcome back, {user?.firstName || "SME"}</h1>
        </section>

        {/* Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link href="/income-manager">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Income</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-monthly-income">
                      {formatNaira(currentStats.monthlyIncome)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">This month</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/expense-manager">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expense</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-monthly-expenses">
                      {formatNaira(currentStats.monthlyExpenses ?? 0)}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">This month</p>
                  </div>
                  <TrendingDown className="w-6 h-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Net Position, Savings, and Net Worth */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Net Position */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className={`p-4 rounded-lg ${currentStats.netPosition >= 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${currentStats.netPosition >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    Net Position
                  </p>
                  <p className={`text-3xl font-bold ${currentStats.netPosition >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`} style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-net-position">
                    {formatNaira(currentStats.netPosition)}
                  </p>
                  <p className={`text-xs ${currentStats.netPosition >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    ({isProfit ? "Profit" : "Loss"})
                  </p>
                </div>
                <span className={`w-6 h-6 flex items-center justify-center text-lg font-bold ${currentStats.netPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₦</span>
              </div>
            </CardContent>
          </Card>

          {/* Savings Card */}
          <Link href="/income-manager">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: "#10B981" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                    <p className="text-3xl font-bold" style={{ color: "#10B981", fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-total-savings">
                      {isSavingsLoading ? "—" : formatNaira(totalSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">Across all goals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <div className="h-8 w-8 flex items-center justify-center" style={{ color: "#29A378" }}>
                      <Wallet className="h-6 w-6" />
                    </div> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        refreshSavings();
                      }}
                      className="h-8 w-8 p-0 hover:bg-green-100"
                      title="Refresh savings data"
                    >
                      {/* <RefreshCw className="h-4 w-4" /> */}
                      <div className="h-8 w-8 flex items-center justify-center" style={{ color: "#10B981" }}>
                        <Wallet className="h-6 w-6" />
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Net Worth Card */}
          <Card className="border-l-4" style={{ borderLeftColor: "#8B5CF6" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                  <p className="text-3xl font-bold" style={{ color: "#8B5CF6", fontFamily: '"Share Tech Mono", monospace' }} data-testid="text-net-worth">
                    {isNetWorthLoading ? "—" : formatNaira(totalNetWorth)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total net worth</p>
                </div>
                <div className="h-8 w-8 flex items-center justify-center" style={{ color: "#8B5CF6" }}>
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Charts */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Income vs Expenses
                </CardTitle>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    console.log('Year selector changed to:', e.target.value);
                    setSelectedYear(Number(e.target.value));
                  }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors"
                >
                  {getAvailableYears(incomeListQuery.data || [], expensesListQuery.data || []).map(year => (
                    <option key={year} value={year} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full overflow-hidden">
                <style>{`
                  .recharts-bar-rectangle:hover {
                    filter: none !important;
                    opacity: 1 !important;
                    fill-opacity: 1 !important;
                    stroke-opacity: 1 !important;
                  }
                  .recharts-bar-rectangle {
                    transition: none !important;
                  }
                  .recharts-bar-rectangle:focus {
                    filter: none !important;
                    opacity: 1 !important;
                    fill-opacity: 1 !important;
                    stroke-opacity: 1 !important;
                  }
                  .recharts-wrapper .recharts-tooltip-wrapper {
                    display: none !important;
                  }
                `}</style>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={currentStats.chartData} 
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }} 
                    barCategoryGap="20%"
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        setSelectedMonth(prev => prev === data.activeLabel ? null : data.activeLabel!);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#666" }} axisLine={{ stroke: "#ccc" }} />
                    <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: "#666" }} axisLine={{ stroke: "#ccc" }} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar 
                      dataKey="income" 
                      fill="#29A378" 
                      name="Income" 
                      radius={[4, 4, 0, 0]} 
                      stroke="#1f8661" 
                      strokeWidth={1} 
                      isAnimationActive={false}
                    >
                      {selectedMonth && (
                        <LabelList 
                          dataKey="income" 
                          position="top" 
                          fill="#29A378" 
                          fontSize={10}
                          fontWeight="bold"
                          formatter={(value: number) => {
                            if (value >= 1000000) {
                              return `₦${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                              return `₦${(value / 1000).toFixed(1)}K`;
                            }
                            return `₦${value.toFixed(2)}`;
                          }}
                        />
                      )}
                    </Bar>
                    <Bar 
                      dataKey="expenses" 
                      fill="#EA580C" 
                      name="Expenses" 
                      radius={[4, 4, 0, 0]} 
                      stroke="#C2410C" 
                      strokeWidth={1} 
                      isAnimationActive={false}
                    >
                      {selectedMonth && (
                        <LabelList 
                          dataKey="expenses" 
                          position="top" 
                          fill="#EA580C" 
                          fontSize={10}
                          fontWeight="bold"
                          formatter={(value: number) => {
                            if (value >= 1000000) {
                              return `₦${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                              return `₦${(value / 1000).toFixed(1)}K`;
                            }
                            return `₦${value.toFixed(2)}`;
                          }}
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Expense Breakdown Pie Chart */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={currentStats.expenseBreakdown} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={120} 
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
                        {currentStats.expenseBreakdown.map((entry, index) => (
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
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg mb-4">Category Breakdown</h4>
                  {currentStats.expenseBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: item.color, fontFamily: '"Share Tech Mono", monospace' }}>
                          {formatNaira(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{((item.amount / Math.max(1, currentStats.monthlyExpenses)) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Goals & Performance Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Savings Goal Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: "#29A378" }} />
                Savings Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(currentStats.savingsGoal.target)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-bold" style={{ color: "#29A378", fontFamily: '"Share Tech Mono", monospace' }}>
                    {isSavingsLoading ? "—" : formatNaira(totalSavings)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium">{currentStats.savingsGoal.targetDate || "No deadline set"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{isSavingsLoading ? "0.0%" : (currentStats.savingsGoal.target > 0 ? ((totalSavings / currentStats.savingsGoal.target) * 100).toFixed(1) : "0.0%")}</span>
                </div>
                {currentStats.savingsGoal.target > 0 && (
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${isSavingsLoading ? "0" : Math.min((totalSavings / currentStats.savingsGoal.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
                {currentStats.savingsGoal.target > 0 && (
                  <p className="text-xs text-muted-foreground">To reach goal by {currentStats.savingsGoal.targetDate}</p>
                )}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Required:</p>
                {/*<p className="text-lg font-bold" style={{ color: "#29A378" }}>
                  {isSavingsLoading ? "—" : formatNaira(Math.max(0, (currentStats.savingsGoal.target - totalSavings) / 10))}
                </p>*/}
                <p className="text-lg font-bold" style={{ color: "#29A378", fontFamily: '"Share Tech Mono", monospace' }}>
                  {isSavingsLoading ? "—" : formatNaira(Math.max(0, (currentStats.savingsGoal.target - totalSavings)))}
                </p>
                <p className="text-xs text-muted-foreground">To reach goal by {currentStats.savingsGoal.targetDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: "#16A085" }} />
                Cash Flow Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentStats.cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#666" }} axisLine={{ stroke: "#ccc" }} />
                    <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: "#666" } as any} axisLine={{ stroke: "#ccc" }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [<span style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(value)}</span>, name]}
                      labelStyle={{ color: "#333", fontWeight: "bold" }}
                      contentStyle={{
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area type="monotone" dataKey="inflow" stackId="1" stroke="#29A378" fill="#29A378" fillOpacity={0.6} name="Income" />
                    <Area type="monotone" dataKey="outflow" stackId="2" stroke="#EA580C" fill="#EA580C" fillOpacity={0.6} name="Expenses" />
                    <Line type="monotone" dataKey="balance" stroke="#16A085" strokeWidth={3} dot={{ fill: "#16A085", strokeWidth: 2, r: 4 }} name="Net Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Manager Buttons */}
        {/*}
        <section className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/income-manager">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" style={{ background: "linear-gradient(to right, rgba(41, 163, 120, 0.05), rgba(41, 163, 120, 0.1))" }}>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(41, 163, 120, 0.1)" }}>
                    <TrendingUp className="h-8 w-8" style={{ color: "#29A378" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: "#29A378" }}>Manage Income</h3>
                    <p className="text-sm" style={{ color: "#29A378", opacity: 0.8 }}>Invoices, payments, reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/expense-manager">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" style={{ background: "linear-gradient(to right, rgba(234, 88, 12, 0.05), rgba(234, 88, 12, 0.1))" }}>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(234, 88, 12, 0.1)" }}>
                    <div className="h-8 w-8 flex items-center justify-center font-bold text-2xl" style={{ color: "#EA580C" }}>₦</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: "#EA580C" }}>Manage Expense</h3>
                    <p className="text-sm" style={{ color: "#EA580C", opacity: 0.8 }}>OCR scanning, tracking, reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>-
        </section>
        */}
      </main>

      <BottomNavigation />
    </div>
  );
}