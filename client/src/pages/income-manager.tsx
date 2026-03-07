import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira, parseAmount } from "@/lib/currency";
import { Plus, ChevronLeft, ChevronRight, TrendingUp, FileText, History, BarChart3, Settings, ArrowLeft, Wallet, Calendar, Trash2, Edit, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface IncomeStats {
  totalIncome: number;
  monthlyTotal: number;
  weeklyTotal: number;
  pendingInvoices: number;
  invoicesCreated: number;
  recentPayments: Array<{
    id: string;
    source: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

interface SavingsRecord {
  id: string;
  amount: number;
  date: string;
  time: string;
  createdAt: string;
}

export default function IncomeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);
  const [totalAssetValue, setTotalAssetValue] = useState('');
  const [assets, setAssets] = useState({
    cash: '',
    inventory: '',
    equipment: '',
    investments: '',
    property: '',
    otherAssets: ''
  });
  const [liabilities, setLiabilities] = useState({
    accountsPayable: '',
    loans: '',
    creditCards: '',
    mortgages: '',
    otherLiabilities: ''
  });
  const [savingsAmount, setSavingsAmount] = useState('');
  
  // Add Income modal state
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [incomeFormData, setIncomeFormData] = useState({
    source: '',
    description: '',
    amount: 0,
    category: 'salary',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0]
  });

  // VAT rate constant
  const VAT_RATE = 0.075;
  const [savingsDate, setSavingsDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingSavings, setEditingSavings] = useState<string | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Fetch real income data from API (same as income-history.tsx)
  const { data: allIncomeData, isLoading } = useQuery({
    queryKey: ["/api/income"],
    queryFn: async () => {
      try {
        console.log('📊 Fetching income data for Recent History...');
        const response = await fetch('/api/income');
        if (!response.ok) throw new Error('Failed to fetch income data');
        const data = await response.json();
        console.log('📊 Income data received:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error fetching income data:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 0, // No caching - always fresh data
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });

  // Fetch income stats from API (for overview stats only)
  const { data: incomeStats, isLoading: statsLoading } = useQuery<IncomeStats>({
    queryKey: ["/api/income/stats"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/income/stats');
        if (!response.ok) throw new Error('Failed to fetch income stats');
        return response.json();
      } catch (error) {
        console.error('Error fetching income stats:', error);
        return {
          totalIncome: 0,
          monthlyTotal: 0,
          weeklyTotal: 0,
          pendingInvoices: 0,
          invoicesCreated: 0,
          recentPayments: []
        };
      }
    },
    retry: false,
  });

  // Fetch net worth history
  const { data: netWorthHistory, isLoading: isNetWorthLoading } = useQuery({
    queryKey: ["/api/user/net-worth"],
    queryFn: async () => {
      const res = await fetch("/api/user/net-worth");
      if (!res.ok) throw new Error("Failed to fetch net worth history");
      return res.json();
    }
  });

  // Fetch savings records
  const { data: savings, isLoading: isSavingsLoading } = useQuery({
    queryKey: ["/api/savings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/savings");
        if (!res.ok) throw new Error("Failed to fetch savings");
        return res.json();
      } catch (error) {
        console.error('Error fetching savings:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Fetch invoices data
  const { data: invoices, isLoading: isInvoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) throw new Error('Failed to fetch invoices');
        const invoicesData = await response.json();
        console.log('📋 Invoices data received:', invoicesData);
        return invoicesData;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refresh when window gains focus
    refetchOnMount: true, // Force refetch on mount
  });

  // Force immediate refetch on component mount
  useEffect(() => {
    // Invalidate and refetch to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    refetchInvoices();
  }, [refetchInvoices, queryClient]);

  // Fetch expenses for net worth calculation
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/expenses");
        if (!res.ok) throw new Error("Failed to fetch expenses");
        return res.json();
      } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }
    }
  });

  // Fetch user settings for total asset value
  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (!res.ok) throw new Error("Failed to fetch user settings");
        return res.json();
      } catch (error) {
        console.error('Error fetching user settings:', error);
        return { totalAssetValue: 0 };
      }
    }
  });

  // Calculate net worth
  const totalSavings = savings?.reduce(
    (sum: number, record: { amount: number }) => sum + Number(record.amount),
    0
  ) ?? 0;

  const totalExpenses = expenses?.reduce(
    (sum: number, expense: { amount: number }) => sum + Number(expense.amount),
    0
  ) ?? 0;

  const savedAssetValue = userSettings?.totalAssetValue || 0;

  // Calculate detailed net worth
  const calculateTotalAssets = () => {
    // Only include savings if user has entered a cash amount
    const userCashValue = parseFloat(String(assets.cash || '0').replace(/,/g, ''));
    const cashValue = userCashValue > 0 ? userCashValue + totalSavings : userCashValue;
    const otherAssetValues = Object.entries(assets)
      .filter(([key]) => key !== 'cash') // Exclude cash from other assets
      .map(([_, val]) => parseFloat(String(val).replace(/,/g, '')) || 0);
    
    return cashValue + otherAssetValues.reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalLiabilities = () => {
    const liabilityValues = Object.values(liabilities).map(val => parseFloat(String(val).replace(/,/g, '')) || 0);
    return liabilityValues.reduce((sum, val) => sum + val, 0);
  };

  const totalAssets = calculateTotalAssets();
  const totalLiabilities = calculateTotalLiabilities();
  const detailedNetWorth = totalAssets - totalLiabilities;
  const netWorth = detailedNetWorth; // Use the same calculation

  // Update total asset value mutation
  const updateAssetValueMutation = useMutation({
    mutationFn: async (assetValue: number) => {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAssetValue: assetValue })
      });
      if (!response.ok) throw new Error('Failed to update asset value');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({ title: "Success", description: "Total asset value updated successfully" });
      setTotalAssetValue('');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update asset value", variant: "destructive" });
    }
  });

  // Save net worth data mutation
  const saveNetWorthMutation = useMutation({
    mutationFn: async (data: { assets: typeof assets; liabilities: typeof liabilities; netWorth: number }) => {
      const response = await fetch('/api/user/net-worth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save net worth data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/net-worth"] });
      toast({ title: "Success", description: "Net worth data saved successfully" });
      setShowNetWorthModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save net worth data", variant: "destructive" });
    }
  });

  const handleSaveNetWorth = () => {
    // Store the actual cash amount entered by user (without savings)
    const userCashValue = parseFloat(String(assets.cash || '0').replace(/,/g, ''));
    const netWorthData = {
      assets: {
        ...assets,
        cash: userCashValue.toString() // Save only user-entered cash amount
      },
      liabilities,
      netWorth: detailedNetWorth
    };
    saveNetWorthMutation.mutate(netWorthData);
  };

  // Format amount with thousand separators
  const formatAmountInput = (value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';
    
    // Limit decimal part to 2 digits for kobo
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
    
    // Add thousand separators to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with decimal part if exists
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  };

  const handleAssetChange = (field: string, value: string) => {
    const formattedValue = formatAmountInput(value);
    setAssets({...assets, [field]: formattedValue});
  };

  const handleLiabilityChange = (field: string, value: string) => {
    const formattedValue = formatAmountInput(value);
    setLiabilities({...liabilities, [field]: formattedValue});
  };

  // Add savings mutation
  const addSavingsMutation = useMutation({
    mutationFn: async (data: { amount: number; date: string; time: string }) => {
      console.log("🚀 Client: Starting savings mutation with data:", data);
      
      const response = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      console.log("📡 Client: Response status:", response.status);
      console.log("📡 Client: Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Client: Error response body:", errorText);
        throw new Error('Failed to add savings');
      }
      
      const result = await response.json();
      console.log("✅ Client: Success response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
      toast({ title: "Success", description: "Savings record added successfully" });
      setSavingsAmount('');
      setSavingsDate(new Date().toISOString().split('T')[0]);
      setShowSavingsForm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add savings record", variant: "destructive" });
    }
  });

  // Delete savings mutation
  const deleteSavingsMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/savings/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete savings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
      toast({ title: "Success", description: "Savings record deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete savings record", variant: "destructive" });
    }
  });

  // Add income mutation
  const addIncomeMutation = useMutation({
    mutationFn: async (data: typeof incomeFormData) => {
      // Calculate WHT breakdown based on category
      let whtRate = 0;
      let grossAmount = data.amount;
      let whtAmount = 0;
      let netAmount = data.amount;

      // Apply WHT for specific categories (Nigeria rates)
      if (data.category === 'Contract Services' || data.category === 'Consulting') {
        whtRate = 0.10; // 10% WHT
        grossAmount = data.amount / (1 - whtRate);
        whtAmount = grossAmount * whtRate;
        netAmount = grossAmount - whtAmount;
      } else if (data.category === 'Rent' || data.category === 'Interest') {
        whtRate = 0.10; // 10% WHT
        grossAmount = data.amount / (1 - whtRate);
        whtAmount = grossAmount * whtRate;
        netAmount = grossAmount - whtAmount;
      } else if (data.category === 'Director Fees') {
        whtRate = 0.10; // 10% WHT
        grossAmount = data.amount / (1 - whtRate);
        whtAmount = grossAmount * whtRate;
        netAmount = grossAmount - whtAmount;
      }

      return apiRequest("/api/income", "POST", {
        source: data.source,
        description: data.description,
        amount: netAmount.toString(), // Net amount after WHT
        grossAmount: grossAmount.toString(), // Amount before WHT
        whtAmount: whtAmount.toString(), // WHT deducted
        whtRate: (whtRate * 100).toString(), // WHT rate as percentage
        netAmount: netAmount.toString(), // Final amount
        category: data.category,
        frequency: data.frequency,
        date: data.date,
        status: "received",
        paymentMethod: "cash"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      toast({ title: "Income Added", description: "Manual income added successfully" });
      setShowAddIncomeModal(false);
      // Reset form
      setIncomeFormData({
        source: '',
        description: '',
        amount: 0,
        category: 'salary',
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: any) => {
      console.error("Add income error:", error);
      const message = error?.response?.data?.message || error?.message || "Failed to add income";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  const handleAddSavings = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNumber = parseFloat(savingsAmount.replace(/,/g, ''));
    if (!amountNumber || amountNumber <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const now = new Date();
    addSavingsMutation.mutate({
      amount: amountNumber,
      date: new Date(savingsDate).toISOString(),  // ✅ convert to full ISO
      time: now.toLocaleTimeString('en-US', { hour12: false }) // ✅ add time field
    });
  };


  const formatAmount = (value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1].slice(0, 2) : '';
    
    // Add thousand separators to integer part
    if (integerPart) {
      integerPart = parseInt(integerPart).toLocaleString();
    }
    
    return integerPart + decimalPart;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatAmount(value);
    setSavingsAmount(formattedValue);
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incomeFormData.source || incomeFormData.amount <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    addIncomeMutation.mutate(incomeFormData);
  };

  const handleDeleteSavings = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings record?')) {
      deleteSavingsMutation.mutate(id);
    }
  };

  // Use income stats data but override invoicesCreated with actual invoices data
  const stats = {
    totalIncome: incomeStats?.totalIncome || 0,
    monthlyTotal: incomeStats?.monthlyTotal || 0,
    weeklyTotal: incomeStats?.weeklyTotal || 0,
    pendingInvoices: incomeStats?.pendingInvoices || 0,
    invoicesCreated: invoices?.length || 0, // Always use invoices data for total count
    recentPayments: incomeStats?.recentPayments || []
  };

  // Debug: Log invoice data in income-manager
  console.log('🏦 Income Manager - Invoices:', invoices);
  console.log('🏦 Income Manager - Invoice count:', invoices?.length);
  console.log('🏦 Income Manager - Invoice details:', invoices?.map((inv: any) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    clientName: inv.clientName
  })));

  // Sort recent payments by date (most recent first) - using same data as income-history.tsx
  const sortedRecentPayments = [...(allIncomeData || [])].sort((a, b) => {
    try {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // Check if dates are valid
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.warn('Invalid date format in recent payments:', { a: a.date, b: b.date });
        return 0; // Keep original order if dates are invalid
      }
      
      // Sort by most recent first (newest date first)
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      console.error('Error sorting recent payments:', error);
      return 0; // Keep original order if sorting fails
    }
  });

  // Get only the last 3 records for Recent History
  const recentPayments = sortedRecentPayments.slice(0, 3);

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Income Manager" showBack={true} backHref="/" />
      
      <main className="pb-20 px-4 py-4">
        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Income */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 rounded" /> // ✅ skeleton instead of "..."
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-total-income"
                    >
                      {formatNaira(stats.totalIncome)}
                    </p>
                  )}
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
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
                    <Skeleton className="h-8 w-24 rounded" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-weekly-income"
                    >
                      {formatNaira(stats.weeklyTotal)}
                    </p>
                  )}
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
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
                    <Skeleton className="h-8 w-24 rounded" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-monthly-income"
                    >
                      {formatNaira(stats.monthlyTotal)}
                    </p>
                  )}
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
              </div>
            </CardContent>
          </Card>

          {/* Invoices Created */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoices Created</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 rounded" />
                  ) : (
                    <p
                      className="text-3xl font-bold"
                      style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                      data-testid="text-invoices-created"
                    >
                      {stats.invoicesCreated}
                    </p>
                  )}
                </div>
                <FileText className="h-8 w-8" style={{ color: '#059669' }} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-add-income"
                onClick={() => setShowAddIncomeModal(true)}
              >
                <Plus className="h-5 w-5 text-green-600" />
                <span className="text-xs">Add Income</span>
              </Button>
            
            <Link href="/create-invoice" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-create-invoice"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Create Invoice</span>
              </Button>
            </Link>
            
            <Link href="/income-history" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-view-history"
              >
                <History className="h-5 w-5 text-orange-600" />
                <span className="text-xs">View History</span>
              </Button>
            </Link>
            
            <Link href="/income-reports" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-view-reports"
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Reports</span>
              </Button>
            </Link>

            {/* Added from Income Management */}
            <Link href="/invoice-list" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-invoices"
              >
                <FileText className="h-5 w-5 text-cyan-600" />
                <span className="text-xs">Invoices</span>
              </Button>
            </Link>

            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
              data-testid="button-savings"
              onClick={() => setShowSavingsForm(true)}
            >
              <Wallet className="h-5 w-5 text-emerald-600" />
              <span className="text-xs">Savings</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
              data-testid="button-net-worth"
              onClick={() => setShowNetWorthModal(true)}
            >
              <TrendingUp className="h-5 w-5 text-rose-600" />
              <span className="text-xs">Net Worth</span>
            </Button>

            <Link href="/income-source-manager" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5 text-slate-600" />
                <span className="text-xs">Settings</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Main Content - Two 50% Sections Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left 50% - Recent History */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent History</h2>
              <div className="flex items-center gap-2">
                <Link href="/income-history">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-payments">View All</Button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-3">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(41, 163, 120, 0.1)'}}>
                            <TrendingUp className="h-5 w-5" style={{color: '#29A378'}} />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-payment-source-${payment.id}`}>{payment.source}</p>
                            <p className="text-sm text-muted-foreground">{payment.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" style={{color: '#29A378', fontFamily: '"Share Tech Mono", monospace'}} data-testid={`text-payment-amount-${payment.id}`}>
                            {formatNaira(payment.amount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === 'received' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No recent payments to display</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add Income Modal */}
      <AlertDialog open={showAddIncomeModal} onOpenChange={setShowAddIncomeModal}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Add Manual Income</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new manual income source to track your earnings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <form onSubmit={handleAddIncome} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Income Source *</Label>
                <Input
                  id="source"
                  value={incomeFormData.source}
                  onChange={(e) => setIncomeFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., Monthly Salary, Freelance Work"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={incomeFormData.category}
                  onValueChange={(value) => setIncomeFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="Contract Services">Contract Services (10% WHT)</SelectItem>
                    <SelectItem value="Consulting">Consulting (10% WHT)</SelectItem>
                    <SelectItem value="Rent">Rent (10% WHT)</SelectItem>
                    <SelectItem value="Interest">Interest (10% WHT)</SelectItem>
                    <SelectItem value="Director Fees">Director Fees (10% WHT)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={incomeFormData.description}
                onChange={(e) => setIncomeFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of this income source"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  type="text"
                  value={incomeFormData.amount.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    const parsed = parseFloat(value);
                    setIncomeFormData(prev => ({ ...prev, amount: isNaN(parsed) ? 0 : parsed }));
                  }}
                  placeholder="0.00"
                  required
                />
                {incomeFormData.amount > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {(() => {
                      let whtRate = 0;
                      let whtAmount = 0;
                      let grossAmount = incomeFormData.amount;

                      // Calculate WHT based on category
                      if (incomeFormData.category === 'Contract Services' || incomeFormData.category === 'Consulting') {
                        whtRate = 0.10;
                        grossAmount = incomeFormData.amount / (1 - whtRate);
                        whtAmount = grossAmount * whtRate;
                      } else if (incomeFormData.category === 'Rent' || incomeFormData.category === 'Interest') {
                        whtRate = 0.10;
                        grossAmount = incomeFormData.amount / (1 - whtRate);
                        whtAmount = grossAmount * whtRate;
                      } else if (incomeFormData.category === 'Director Fees') {
                        whtRate = 0.10;
                        grossAmount = incomeFormData.amount / (1 - whtRate);
                        whtAmount = grossAmount * whtRate;
                      }

                      return (
                        <>
                          {whtRate > 0 && (
                            <>
                              <div>Gross Amount: {formatNaira(grossAmount)}</div>
                              <div>WHT ({(whtRate * 100).toFixed(0)}%): -{formatNaira(whtAmount)}</div>
                              <div>Net Amount: {formatNaira(incomeFormData.amount)}</div>
                            </>
                          )}
                          {whtRate === 0 && (
                            <div>No WHT applicable for this category</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={incomeFormData.frequency}
                  onValueChange={(value) => setIncomeFormData(prev => ({ ...prev, frequency: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={incomeFormData.date}
                onChange={(e) => setIncomeFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </form>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAddIncomeModal(false);
                setIncomeFormData({
                  source: '',
                  description: '',
                  amount: 0,
                  category: 'salary',
                  frequency: 'monthly',
                  date: new Date().toISOString().split('T')[0]
                });
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddIncome}
              disabled={addIncomeMutation.isPending}
              className="bg-[#29A378] hover:bg-[#29A378]/90"
            >
              {addIncomeMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : null}
              {addIncomeMutation.isPending ? "Adding..." : "Add Income"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Savings Modal */}
      <AlertDialog open={showSavingsForm} onOpenChange={setShowSavingsForm}>
        <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Add Savings</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new savings record to track your savings progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <form onSubmit={handleAddSavings} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={savingsDate}
                onChange={(e) => setSavingsDate(e.target.value)}
                required
              />
            </div>
          </form>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowSavingsForm(false);
                setSavingsAmount('');
                setSavingsDate(new Date().toISOString().split('T')[0]);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddSavings}
              disabled={addSavingsMutation.isPending}
              className="bg-[#29A378] hover:bg-[#29A378]/90"
            >
              {addSavingsMutation.isPending && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              )}
              {addSavingsMutation.isPending ? "Adding..." : "Add Savings"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Net Worth Modal */}
      <AlertDialog open={showNetWorthModal} onOpenChange={setShowNetWorthModal}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Update Net Worth</AlertDialogTitle>
            <AlertDialogDescription>
              Update your net worth by entering your total asset value and individual assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <form onSubmit={handleSaveNetWorth} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Asset Value</label>
              <Input
                type="number"
                value={totalAssetValue}
                onChange={(e) => setTotalAssetValue(e.target.value)}
                placeholder="Enter total asset value"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cash</label>
                <Input
                  type="number"
                  value={assets.cash}
                  onChange={(e) => setAssets({...assets, cash: e.target.value})}
                  placeholder="Cash amount"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Inventory</label>
                <Input
                  type="number"
                  value={assets.inventory}
                  onChange={(e) => setAssets({...assets, inventory: e.target.value})}
                  placeholder="Inventory value"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Equipment</label>
                <Input
                  type="number"
                  value={assets.equipment}
                  onChange={(e) => setAssets({...assets, equipment: e.target.value})}
                  placeholder="Equipment value"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Investments</label>
                <Input
                  type="number"
                  value={assets.investments}
                  onChange={(e) => setAssets({...assets, investments: e.target.value})}
                  placeholder="Investments total"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <Input
                  type="number"
                  value={assets.property}
                  onChange={(e) => setAssets({...assets, property: e.target.value})}
                  placeholder="Property value"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Other Assets</label>
                <Input
                  type="number"
                  value={assets.otherAssets}
                  onChange={(e) => setAssets({...assets, otherAssets: e.target.value})}
                  placeholder="Other assets value"
                />
              </div>
            </div>
          </form>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowNetWorthModal(false);
                setTotalAssetValue('');
                setAssets({
                  cash: '',
                  inventory: '',
                  equipment: '',
                  investments: '',
                  property: '',
                  otherAssets: ''
                });
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveNetWorth}
              disabled={saveNetWorthMutation.isPending}
              className="bg-[#29A378] hover:bg-[#29A378]/90"
            >
              {saveNetWorthMutation.isPending && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              )}
              {saveNetWorthMutation.isPending ? "Updating..." : "Update Net Worth"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}