import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CalendarIcon, History, Search, Filter, Download, TrendingUp, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";
import PaginationControls from "@/components/pagination-controls";

interface IncomeRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft" | "sent";
  reference: string;
}

const statusColors = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800", 
  overdue: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800"
};

export default function IncomeHistory() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Debug viewport information
  useEffect(() => {
    console.log('🖥️ Viewport Debug:', {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent
    });
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Force refetch when page becomes visible (fixes cache invalidation issues)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, forcing refetch...');
        // More aggressive refetching
        queryClient.invalidateQueries({ queryKey: ["/api/income"] });
        queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        
        // Force refetch after a short delay
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["/api/income"] });
          queryClient.refetchQueries({ queryKey: ["/api/income/stats"] });
          queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  // Fetch real income data from API
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ["/api/income"],
    queryFn: async () => {
      try {
        console.log('📊 Fetching income data...');
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

  // Fetch income stats from API
  const { data: incomeStats } = useQuery({
    queryKey: ["/api/income/stats"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/income/stats');
        if (!response.ok) throw new Error('Failed to fetch income stats');
        return response.json();
      } catch (error) {
        console.error('Error fetching income stats:', error);
        return { totalIncome: 0, monthlyTotal: 0, weeklyTotal: 0 };
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });

  // Fetch invoices data to include pending amounts
  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      try {
        console.log('📊 Fetching invoices data...');
        const response = await fetch('/api/invoices');
        if (!response.ok) throw new Error('Failed to fetch invoices');
        const data = await response.json();
        console.log('📊 Invoices data received:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });

  // Find invoice by number and navigate to document
  const handleViewInvoice = async (invoiceNumber: string) => {
    try {
      // Find invoice by number
      const response = await fetch('/api/invoices');
      const invoices = await response.json();
      const invoice = invoices.find((inv: any) => inv.invoiceNumber === invoiceNumber);
      
      if (invoice) {
        // Navigate to invoice document with ID
        window.location.href = `/invoice/${invoice.id}`;
      } else {
        toast({
          title: "Invoice Not Found",
          description: `Invoice ${invoiceNumber} could not be found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error finding invoice:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice details.",
        variant: "destructive",
      });
    }
  };
  const deleteAllIncomeMutation = useMutation({
    mutationFn: async () => {
      console.log('🗑️ Deleting all income records...');
      try {
        const response = await apiRequest('/api/income/delete-all', 'DELETE');
        console.log('📋 Delete all income response:', response);
        return response;
      } catch (error) {
        console.error('❌ Error deleting all income records:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ All income records deleted successfully');
      toast({
        title: "All Records Deleted",
        description: "All income records have been deleted successfully.",
      });
      setDeleteAllDialogOpen(false);
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/income"] });
        queryClient.refetchQueries({ queryKey: ["/api/income/stats"] });
        queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
      }, 200);
    },
    onError: (error) => {
      console.error('❌ Delete all income error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete all income records. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transform API data to match the interface
  console.log('Raw income data:', incomeData);
  console.log('Raw invoices data:', invoices);
  
  // Combine income records and invoices to show all transactions
  const allTransactions: IncomeRecord[] = [];
  
  // Add income records (paid invoices converted to income)
  if (incomeData && Array.isArray(incomeData)) {
    const processedIncomeIds = new Set<string>();
    
    // Valid IDs from database - filter out stale records
    // Get current income IDs to include all existing records
    const currentIncomeIds = incomeData && Array.isArray(incomeData) 
      ? incomeData.map((income: any) => income.id) 
      : [];
    
    const validIds = currentIncomeIds; // Use all current income records as valid
    
    incomeData.forEach((income: any) => {
      // Check if this is a WHT income record that needs correction
      const isWHTIncome = income.description && income.description.includes('WHT deduction');
      const correspondingInvoice = invoices && Array.isArray(invoices) && 
        invoices.find((invoice: any) => invoice.invoiceNumber === income.invoiceNumber);
      
      let correctedAmount = parseFloat(income.amount) || 0;
      
      // Auto-correct WHT income records with wrong amounts
      if (isWHTIncome && correspondingInvoice && correspondingInvoice.status === "partially_paid") {
        const remainingBalance = parseFloat(correspondingInvoice.amount) - parseFloat(correspondingInvoice.amountPaid || '0');
        const baseAmount = parseFloat(correspondingInvoice.amount) - (parseFloat(correspondingInvoice.amount) - (parseFloat(correspondingInvoice.amount) / 1.075));
        const whtAmount = baseAmount * 0.10;
        const correctAmount = remainingBalance - whtAmount;
        
        // Only correct if the current amount is wrong
        if (Math.abs(correctedAmount - correctAmount) > 1) { // Allow for small rounding differences
          correctedAmount = correctAmount;
        }
      }
      
      // Skip income records that have corresponding WHT balance payments (same invoice number, WHT deduction, and partially paid status)
      const hasWHTBalance = invoices && Array.isArray(invoices) && 
        invoices.some((invoice: any) => 
          invoice.invoiceNumber === income.invoiceNumber && 
          invoice.status === "partially_paid" &&
          income.description && income.description.includes('WHT deduction')
        );
      
      // Skip stale records and duplicates
      // Only check for WHT balance (skip validIds check when incomeData is empty)
      const shouldSkipForWHT = incomeData && Array.isArray(incomeData) && incomeData.length > 0 && hasWHTBalance;
      
      if (!shouldSkipForWHT && !processedIncomeIds.has(income.id)) {
        processedIncomeIds.add(income.id);
        allTransactions.push({
          id: income.id || '',
          date: income.date || '',
          description: income.description || income.source || 'Unknown',
          category: income.category || "Service Income",
          client: income.source || "Unknown",
          amount: correctedAmount, // Use corrected amount if applicable
          status: "paid", // Income records are always paid
          reference: income.invoiceNumber || (income.id ? `INC-${income.id.slice(-6)}` : 'REF-UNKNOWN')
        });
      }
    });
  }
  
  // Add all invoices (draft, sent, paid, overdue)
  if (invoices && Array.isArray(invoices)) {
    invoices.forEach((invoice: any) => {
      // Skip if this invoice was already converted to income (to avoid duplicates)
      const isAlreadyInIncome = incomeData && Array.isArray(incomeData) && 
        incomeData.some((income: any) => income.invoiceNumber === invoice.invoiceNumber);
      
      if (!isAlreadyInIncome) {
        // Only add invoice record if it's not partially paid (partially paid will have balance payment record)
        if (invoice.status !== "partially_paid") {
          // Only add if invoice ID is valid (filter out stale invoices)
          if (!["2acfaf03-ce49-4b12-9388-fc2a57bc31c8", "67a51e83-3972-4613-9e08-b09a1661b10a", "04dbcb2c-8ecb-4f18-8746-8bcf90eb9351", "49bd9745-c45f-4deb-a292-75ff31299263", "068dd5a7-268f-456f-b89d-3bb85b227b8b"].includes(invoice.id)) {
            allTransactions.push({
              id: invoice.id || '',
              date: invoice.issueDate || invoice.createdAt || '',
              description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
              category: "Service Income",
              client: invoice.clientName || "Unknown",
              amount: parseFloat(invoice.amount) || 0,
              status: invoice.status === "received" ? "paid" : (invoice.status || "draft"),
              reference: invoice.invoiceNumber || (invoice.id ? `INV-${invoice.id.slice(-6)}` : 'REF-UNKNOWN')
            });
          }
        }
      } else if (isAlreadyInIncome && invoice.status === "partially_paid") {
        // Add balance payment record for partially paid invoices
        const existingRecord = allTransactions.find(t => t.reference === invoice.invoiceNumber);
        if (existingRecord && invoice.amountPaid) {
          // Check if this is a WHT payment by looking for WHT transaction
          const isWHTPayment = existingRecord.description && existingRecord.description.includes('WHT deduction');
          
          if (isWHTPayment) {
            // For WHT payments, calculate based on full base amount (Total Amount - VAT Amount)
            const remainingBalance = parseFloat(invoice.amount) - parseFloat(invoice.amountPaid || '0');
            const baseAmount = parseFloat(invoice.amount) - (parseFloat(invoice.amount) - (parseFloat(invoice.amount) / 1.075)); // Total Amount - VAT Amount
            const whtAmount = baseAmount * 0.10; // 10% WHT on full base amount
            const netAmount = remainingBalance - whtAmount; // Net amount = remaining balance - WHT
            
            allTransactions.push({
              id: `${invoice.id}-balance`,
              date: invoice.updatedAt || invoice.issueDate || invoice.createdAt || '',
              description: `Balance payment for Invoice ${invoice.invoiceNumber}`,
              category: "Service Income",
              client: invoice.clientName || "Unknown",
              amount: netAmount, // Use net amount after WHT deduction
              status: "paid",
              reference: `${invoice.invoiceNumber}-BAL`
            });
          } else {
            // For regular partial payments, use partial payment amount
            allTransactions.push({
              id: `${invoice.id}-balance`,
              date: invoice.updatedAt || invoice.issueDate || invoice.createdAt || '',
              description: `Balance payment for Invoice ${invoice.invoiceNumber}`,
              category: "Service Income",
              client: invoice.clientName || "Unknown",
              amount: parseFloat(invoice.amountPaid) || 0,
              status: "paid",
              reference: `${invoice.invoiceNumber}-BAL`
            });
          }
        }
      }
    });
  }
  
  // Sort by date (newest first)
  const incomeHistory = allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Debug logging
  console.log('📊 Income History Debug:', {
    totalRecords: incomeHistory.length,
    searchTerm,
    filterCategory,
    filterStatus,
    records: incomeHistory.map(r => ({ 
      id: r.id, 
      description: r.description, 
      category: r.category, 
      status: r.status,
      reference: r.reference
    }))
  });

  const filteredHistory = incomeHistory.filter((record) => {
    // Handle empty search term properly
    const matchesSearch = !searchTerm || searchTerm.trim() === "" || 
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || record.category === filterCategory;
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const isNotNullStatus = record.status !== null; // Exclude partially paid invoices
    
    return matchesSearch && matchesCategory && matchesStatus && isNotNullStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  console.log('Filter results:', {
    totalIncomeHistory: incomeHistory.length,
    totalFiltered: filteredHistory.length,
    searchTerm,
    filterCategory,
    filterStatus
  });

  const totalIncome = incomeStats?.totalIncome || 0;
  const paidIncome = paginatedHistory.filter((r) => r.status === "paid").reduce((sum, record) => sum + record.amount, 0);
  const pendingIncome = paginatedHistory.filter((r) => r.status === "pending" || r.status === "overdue" || r.status === "draft" || r.status === "sent").reduce((sum, record) => sum + record.amount, 0);

  const exportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvContent = [
      "Date,Description,Category,Client,Amount,Status,Reference",
      ...filteredHistory.map(record => 
        `${record.date},${record.description},${record.category},${record.client},${record.amount},${record.status},${record.reference}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'income-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Income History" showBack={true} backHref="/income-manager" />
      
      <main className="pb-20 px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: '#059669', fontFamily: '"Share Tech Mono", monospace' }}
                    data-testid="text-total-income"
                  >
                    {formatNaira(totalIncome)}
                  </p>
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p
                    className="text-3xl font-bold text-green-600"
                    style={{ fontFamily: '"Share Tech Mono", monospace' }}
                    data-testid="text-paid-income"
                  >
                    {formatNaira(paidIncome)}
                  </p>
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p
                    className="text-3xl font-bold text-yellow-600"
                    style={{ fontFamily: '"Share Tech Mono", monospace' }}
                    data-testid="text-pending-income"
                  >
                    {formatNaira(pendingIncome)}
                  </p>
                </div>
                {/*<TrendingUp className="h-8 w-8" style={{ color: '#059669' }} />*/}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <span>{filteredHistory.length} records</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                {/*<Button 
                  onClick={() => setDeleteAllDialogOpen(true)}
                  variant="destructive" 
                  size="sm"
                  disabled={filteredHistory.length === 0}
                  data-testid="button-delete-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>*/}
                <Link href="/income-manager">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-payments">View All</Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Combined scroll container - horizontal for mobile/tablet layout, vertical for 4-entry limit */}
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="overflow-y-auto" style={{ maxHeight: '368px' }}> {/* 4 entries × (80px card + 12px gap) = 368px */}
                <div className="min-w-[800px] space-y-3">
                  {paginatedHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No income records found matching your criteria.
                    </div>
                  ) : (
                    paginatedHistory.map((record) => (
                      <Card key={record.id} className="p-4 w-full">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="col-span-2">
                            <div className="font-medium" data-testid={`text-description-${record.id}`}>
                              {record.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.client}
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="font-medium">{record.category}</div>
                            <div className="text-muted-foreground">{record.reference}</div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </div>
                          
                          <div className="font-bold text-green-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-amount-${record.id}`}>
                            {formatNaira(record.amount)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {record.reference && record.reference.startsWith('INV-') ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => handleViewInvoice(record.reference)}
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            ) : (
                              <Badge 
                                className={statusColors[record.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
                                data-testid={`badge-status-${record.id}`}
                              >
                                {record.status ? (record.status.charAt(0).toUpperCase() + record.status.slice(1)) : 'HIDDEN'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredHistory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          className="mt-6"
        />

        {/* Filters */}
        <Card className="mt-6 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Service Income">Service Income</SelectItem>
                  <SelectItem value="Sales Revenue">Sales Revenue</SelectItem>
                  <SelectItem value="Consulting Fees">Consulting Fees</SelectItem>
                  <SelectItem value="Investment Income">Investment Income</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button onClick={exportData} variant="outline" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Income Records</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all income records? This action cannot be undone and will permanently remove all {filteredHistory.length} income records from your transaction history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAllDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAllIncomeMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAllIncomeMutation.isPending ? 'Deleting...' : 'Delete All Records'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}