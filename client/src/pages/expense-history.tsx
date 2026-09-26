import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ExpenseCard } from "@/components/expense-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, Search, Filter, Download, TrendingDown, Trash2, Eye, FileText, Crown } from "lucide-react";
import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { type Expense } from "@shared/schema";
import PaginationControls from "@/components/pagination-controls";
import { generateReceiptPDF } from "@/lib/pdf-generator";
import { Edit3 } from "lucide-react";

export default function ExpenseHistory() {
  const { user } = useAuth();
  const isPremium = (user as any)?.subscriptionPlan === "premium";
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [visibleReceipts, setVisibleReceipts] = useState<Set<string>>(new Set());
  
  // Pagination state - show only 10 most recent records by default
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show max 10 records by default

  // Fetch expenses from API
  const { data: expensesData, isLoading, error } = useQuery({
    queryKey: ["/api/expenses"],
    retry: false,
    staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
    refetchInterval: false, // Disable automatic refetching to prevent unwanted refreshes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Removed automatic visibility refresh to prevent unwanted page refreshes

  // Use API data only - no mock data fallback
  const expenses: Expense[] = expensesData && Array.isArray(expensesData) ? expensesData : [];

  console.log("🔍 Expense History Debug:");
  console.log("🔍 isLoading:", isLoading);
  console.log("🔍 error:", error);
  console.log("🔍 expensesData:", expensesData);
  console.log("🔍 expenses:", expenses);
  console.log("🔍 expensesData type:", typeof expensesData);
  console.log("🔍 expensesData isArray:", Array.isArray(expensesData));
  
  // Check for imageUrl in expenses
  if (expenses.length > 0) {
    console.log("🔍 Checking expenses for imageUrl:");
    expenses.forEach((expense, index) => {
      console.log(`🔍 Expense ${index + 1}:`, {
        id: expense.id,
        merchant: expense.merchant,
        imageUrl: expense.imageUrl ? `exists (${expense.imageUrl.length} chars)` : "none",
        imageUrlStart: expense.imageUrl?.substring(0, 50)
      });
    });
  }

  const filteredExpenses = expenses.filter((expense) => {
    const merchant = expense.merchant?.toLowerCase() ?? "";
    const cat = expense.category?.toLowerCase() ?? "";
    const notes = expense.notes?.toLowerCase() ?? "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = merchant.includes(search) || cat.includes(search) || notes.includes(search);
    const matchesCategory =
      filterCategory === "all" || expense.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  console.log('Filter results:', {
    totalExpenses: expenses.length,
    filteredExpenses: filteredExpenses.length,
    currentPage,
    totalPages,
    paginatedExpenses: paginatedExpenses.length
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount) + parseFloat(e.vatAmount || '0'),
    0
  );

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      return apiRequest(`/api/expenses/${expenseId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Expense Deleted",
        description: "Expense record has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats"] });
    },
    onError: () => {
      toast({
        title: "Failed to Delete",
        description: "Unable to delete expense record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpenseMutation.mutate(expenseId);
  };

  // Helper function to convert relative image URLs to absolute backend URLs
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '';
    
    // If it's already an absolute URL, return as-is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Always use port 5000 for backend (hardcoded for development)
    const origin = window.location.origin;
    const backendUrl = origin.includes('5173') || origin.includes('5174') 
      ? origin.replace(/:517[34]/, ':5000')
      : 'http://localhost:5000';
    
    return `${backendUrl}${imageUrl}`;
  };

  const toggleReceiptVisibility = (expenseId: string) => {
    setVisibleReceipts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const exportData = () => {
    const csvContent = [
      "Date,Merchant,Category,Amount,VAT Amount,Total Cost (Amount + VAT),Notes",
      ...filteredExpenses.map(
        (e) => {
          const amount = parseFloat(e.amount);
          const vatAmount = parseFloat(e.vatAmount || '0');
          const totalCost = amount + vatAmount;
          return `${e.date},${e.merchant},${e.category},${amount},${vatAmount},${totalCost},${e.notes || ''}`;
        }
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Expenses" showBack={true} backHref="/expense-manager" />

      <main className="pb-20 px-4 py-6">
        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses (incl. VAT)</p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "#EA580C" }}
                    data-testid="text-total-expenses"
                  >
                    {formatNaira(totalExpenses)}
                  </p>
                </div>
                <TrendingDown 
                  className="h-8 w-8"
                  style={{ color: "#EA580C" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <span>Recent Expenses ({paginatedExpenses.length} of {filteredExpenses.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Link href="/expense-manager">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-expenses">View All ({filteredExpenses.length})</Button>
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="overflow-y-auto" style={{ maxHeight: '276px' }}> {/* Show 3 entries at a time, scrollable to see all 10 */}
                <div className="min-w-[800px] space-y-3">
                  {paginatedExpenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {filteredExpenses.length === 0 ? 
                        "No expenses found matching your criteria." : 
                        "No recent expenses to display."
                      }
                    </div>
                  ) : (
                    paginatedExpenses.map((expense) => (
                      <Card key={expense.id} className="p-4 w-full">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="col-span-2">
                            <div className="font-medium" data-testid={`text-merchant-${expense.id}`}>
                              {expense.merchant}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {expense.category}
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="font-medium">{expense.category}</div>
                            {expense.notes && (
                              <div className="text-muted-foreground text-xs truncate max-w-[150px]" title={expense.notes}>
                                {expense.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "MMM dd, yyyy")}
                          </div>
                          
                          <div className="font-bold text-red-600" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-amount-${expense.id}`}>
                            {formatNaira(
                              (parseFloat(expense.amount) || 0) + (parseFloat(expense.vatAmount) || 0)
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Base: {formatNaira(expense.amount)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => toggleReceiptVisibility(expense.id)}
                              data-testid={`button-view-receipt-${expense.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              {visibleReceipts.has(expense.id) ? 'Hide' : 'View'} Receipt
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteExpense(expense.id)}
                              data-testid={`button-delete-${expense.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {/* Show VAT and WHT details if available */}
                        {(expense.vatAmount && parseFloat(expense.vatAmount) > 0) && (
                          <div className="col-span-6 grid grid-cols-3 gap-4 mt-2 pt-2 border-t">
                            <div className="text-xs text-blue-600" data-testid={`text-vat-amount-${expense.id}`}>
                              VAT: {formatNaira(expense.vatAmount)} ({expense.vatRate}%)
                            </div>
                            
                            {(expense.whtAmount && parseFloat(expense.whtAmount) > 0) && (
                              <div className="text-xs text-purple-600" data-testid={`text-wht-amount-${expense.id}`}>
                                WHT: {formatNaira(expense.whtAmount)} ({expense.whtRate}%)
                              </div>
                            )}
                            
                            {(expense.netAmount && parseFloat(expense.netAmount) !== parseFloat(expense.amount)) && (
                              <div className="text-xs text-green-600 font-medium" data-testid={`text-net-amount-${expense.id}`}>
                                Net: {formatNaira(expense.netAmount)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Receipt PDF Preview */}
                        {visibleReceipts.has(expense.id) && (
                          <div className="col-span-6 mt-4 pt-4 border-t">
                            <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <span className="font-medium">Receipt PDF</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {expense.imageUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const imageUrl = getImageUrl(expense.imageUrl);
                                        window.open(imageUrl, '_blank');
                                      }}
                                      className="text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View Receipt
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (!isPremium) {
                                        toast({
                                          title: "Premium Feature",
                                          description: "PDF downloads are available for Premium subscribers only.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      const link = document.createElement('a');
                                      link.href = generateReceiptPDF(expense);
                                      link.download = `receipt-${expense.merchant.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(expense.date), 'yyyy-MM-dd')}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      
                                      toast({
                                        title: "PDF Downloaded",
                                        description: "Receipt PDF has been downloaded successfully.",
                                      });
                                    }}
                                    className="text-xs"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    {isPremium ? "Download PDF" : "Premium"}
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Full Receipt Summary */}
                              <div className="bg-white rounded border border-gray-200 p-6">
                                <h4 className="font-medium text-lg mb-4 text-center">Receipt Summary</h4>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Merchant:</span>
                                        <span className="font-medium">{expense.merchant}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Category:</span>
                                        <span>{expense.category}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Expense ID:</span>
                                        <span className="text-xs font-mono">{expense.id.substring(0, 8).toUpperCase()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Generated:</span>
                                        <span>{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-4">
                                    <h5 className="font-medium mb-3">Financial Details</h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Base Amount:</span>
                                        <span className="font-medium">{formatNaira(expense.amount)}</span>
                                      </div>
                                      {expense.vatAmount && parseFloat(expense.vatAmount) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">VAT:</span>
                                          <span>{formatNaira(expense.vatAmount)} ({expense.vatRate}%)</span>
                                        </div>
                                      )}
                                      {expense.whtAmount && parseFloat(expense.whtAmount) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">WHT:</span>
                                          <span>{formatNaira(expense.whtAmount)} ({expense.whtRate}%)</span>
                                        </div>
                                      )}
                                      {expense.netAmount && parseFloat(expense.netAmount) !== parseFloat(expense.amount) && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Net Amount:</span>
                                          <span className="font-medium">{formatNaira(expense.netAmount)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                        <span>Total:</span>
                                        <span className="text-blue-600">
                                          {formatNaira((parseFloat(expense.amount) || 0) + (parseFloat(expense.vatAmount) || 0))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {expense.notes && (
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium mb-2">Notes:</h5>
                                      <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">{expense.notes}</p>
                                    </div>
                                  )}
                                  
                                  {expense.items && expense.items.length > 0 && (
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium mb-2">Items:</h5>
                                      <div className="space-y-1">
                                        {expense.items.slice(0, 5).map((item, index) => (
                                          <div key={index} className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                                            {index + 1}. {item}
                                          </div>
                                        ))}
                                        {expense.items.length > 5 && (
                                          <p className="text-xs text-muted-foreground italic">
                                            ... and {expense.items.length - 5} more items
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-6 pt-4 border-t text-center">
                                  <p className="text-xs text-muted-foreground">
                                    Computer-generated receipt | GRWO Finance Expense Management
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Pagination Controls - only show if there are more than 3 records */}
            {totalPages > 1 && (
              <div className="mt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={filteredExpenses.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
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
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
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

      <BottomNavigation />
    </div>
  );
}


{/*import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ExpenseCard } from "@/components/expense-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { type Expense } from "@shared/schema";

export default function Transactions() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses']
  });

  const filteredExpenses = expenses.filter(expense => {
    if (selectedCategory !== "all" && expense.category !== selectedCategory) {
      return false;
    }
    
    if (dateFilter !== "all") {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          return expenseDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo;
        case "month":
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    }
    
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount), 0
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Transactions" />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Transactions" />
      
      <main className="pb-20">
        {/* Summary Card /}
        <section className="p-4">
          <Card className="bg-primary text-white border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-sm">
                  {selectedCategory === "all" ? "Total" : 
                   EXPENSE_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || selectedCategory} 
                  {" "}Expense
                </p>
                <h2 className="text-2xl font-bold mt-1" data-testid="text-filtered-total">
                  {formatNaira(totalFiltered)}
                </h2>
                <p className="text-green-100 text-xs mt-1">
                  {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filters /}
        <section className="px-4 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Time Period
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Transactions List /}
        <section className="px-4">
          {filteredExpenses.length > 0 ? (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="p-8 text-center">
                <i className="fas fa-receipt text-4xl text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No transactions found</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory !== "all" || dateFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Scan your first receipt to get started"
                  }
                </p>
                {(selectedCategory !== "all" || dateFilter !== "all") && (
                  <Button 
                    onClick={() => {
                      setSelectedCategory("all");
                      setDateFilter("all");
                    }}
                    variant="outline"
                    className="mt-4"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}*/}
