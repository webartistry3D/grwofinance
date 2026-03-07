import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";
import PaginationControls from "@/components/pagination-controls";

interface WithholdingTaxItem {
  id: string;
  invoiceId?: string;
  incomeId?: string;
  amount: number;
  whtRate: string;
  whtAmount: number;
  deducteeName: string;
  deducteeTaxId?: string;
  transactionDate: string;
  paymentDate?: string;
  certificateNumber?: string;
  status: string;
}

export default function WHTTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'expense' | 'invoice'>('all');
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    amount: "",
    whtRate: "10%",
    deducteeName: "",
    deducteeTaxId: "",
    transactionDate: new Date().toISOString().split('T')[0],
    description: ""
  });

  // Fetch WHT transactions from invoices and WHT transactions table
  const { data: whtTransactions = [], isLoading: whtTransactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/wht/transactions"],
    enabled: !!user,
  });

  // Fetch income records with WHT deductions (WHT Credits)
  const { data: incomeWithWHT = [], isLoading: incomeLoading } = useQuery<any[]>({
    queryKey: ["/api/income"],
    enabled: !!user,
  });

  // Fetch expense records with WHT deductions (WHT Deducted)
  const { data: expensesWithWHT = [], isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Separate and process WHT data by type
  const expenseWHTItems = (expensesWithWHT || [])
    .filter((expense: any) => expense.whtAmount && parseFloat(expense.whtAmount) > 0)
    .map((expense: any) => ({
      id: `expense-${expense.id}`,
      type: 'expense',
      invoiceId: null,
      invoiceNumber: null,
      deducteeName: expense.merchant,
      amount: parseFloat(expense.amount) || 0,
      whtRate: expense.whtRate || '0%',
      whtAmount: parseFloat(expense.whtAmount) || 0,
      netAmount: (parseFloat(expense.amount) || 0) - (parseFloat(expense.whtAmount) || 0),
      transactionDate: expense.date,
      paymentMethod: expense.paymentMethod || 'cash',
      status: 'deducted',
      description: `WHT deducted from payment to ${expense.merchant}`,
      deducteeTaxId: null,
      paymentDate: expense.date,
      certificateNumber: null
    }));

  const invoiceWHTItems = (incomeWithWHT || [])
    .filter((income: any) => income.whtAmount && parseFloat(income.whtAmount) > 0)
    .map((income: any) => ({
      id: `invoice-${income.id}`,
      type: 'invoice',
      invoiceId: income.id,
      invoiceNumber: income.invoiceNumber || `INV-${income.id}`,
      deducteeName: income.clientName || 'Unknown Client',
      amount: parseFloat(income.amount) || 0,
      whtRate: income.whtRate || '0%',
      whtAmount: parseFloat(income.whtAmount) || 0,
      netAmount: (parseFloat(income.amount) || 0) - (parseFloat(income.whtAmount) || 0),
      transactionDate: income.date,
      paymentMethod: income.paymentMethod || 'bank_transfer',
      status: income.status || 'received',
      description: `WHT deducted by client on invoice ${income.invoiceNumber || `INV-${income.id}`}`,
      deducteeTaxId: income.clientTaxId || null,
      paymentDate: income.paymentDate,
      certificateNumber: income.certificateNumber || null
    }));

  // Combine all WHT items
  const allWHTItems = [...expenseWHTItems, ...invoiceWHTItems]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  // Filter WHT items based on active filter
  const filteredWHTItems = activeFilter === 'all' 
    ? allWHTItems 
    : activeFilter === 'expense' 
    ? expenseWHTItems 
    : invoiceWHTItems;

  // Pagination logic
  const totalItems = filteredWHTItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredWHTItems.slice(startIndex, endIndex);

  const isLoading = whtTransactionsLoading || incomeLoading || expensesLoading;

  // Create WHT item mutation
  const createWHTMutation = useMutation({
    mutationFn: async (whtData: any) => {
      const response = await apiRequest("/api/tax/wht", "POST", whtData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WHT Record Added",
        description: "Your withholding tax record has been added successfully",
      });
      setShowAddModal(false);
      setFormData({
        amount: "",
        whtRate: "10%",
        deducteeName: "",
        deducteeTaxId: "",
        transactionDate: new Date().toISOString().split('T')[0],
        description: ""
      });
      // Invalidate and refetch WHT items
      queryClient.invalidateQueries({ queryKey: ['/api/tax/wht'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add WHT record",
        variant: "destructive",
      });
    },
  });

  const calculateWHTAmount = (amount: string, rate: string) => {
    const numAmount = parseFloat(amount) || 0;
    const ratePercent = parseFloat(rate.replace('%', '')) || 0;
    return numAmount * (ratePercent / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const whtAmount = calculateWHTAmount(formData.amount, formData.whtRate);
    
    const whtData = {
      amount: parseFloat(formData.amount),
      whtRate: formData.whtRate,
      whtAmount,
      deducteeName: formData.deducteeName,
      deducteeTaxId: formData.deducteeTaxId || null,
      transactionDate: formData.transactionDate,
      description: formData.description || null
    };

    createWHTMutation.mutate(whtData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "certified":
        return "bg-green-100 text-green-800 border-green-200";
      case "remitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deducted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "certified":
        return <CheckCircle className="w-4 h-4" />;
      case "remitted":
        return <FileText className="w-4 h-4" />;
      case "deducted":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  // Show skeleton while auth is loading or data is loading
  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  // Calculate WHT totals by type
  const totalExpenseWHT = expenseWHTItems.reduce((sum: number, item: any) => sum + item.whtAmount, 0);
  const totalInvoiceWHT = invoiceWHTItems.reduce((sum: number, item: any) => sum + item.whtAmount, 0);
  const netWHTPosition = totalInvoiceWHT - totalExpenseWHT;

  const totalWHTDeducted = allWHTItems.reduce((sum: number, item: any) => sum + item.whtAmount, 0);
  const totalWHTCertified = allWHTItems.filter((item: any) => item.status === "certified").reduce((sum: number, item: any) => sum + item.whtAmount, 0);
  const pendingCertification = allWHTItems.filter((item: any) => item.status === "deducted").length;

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="WHT Tracking" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">WHT Deducted (Expenses)</p>
                  <p className="text-2xl font-bold text-purple-600">{formatNaira(totalExpenseWHT)}</p>
                </div>
                <Receipt className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">WHT Credits (Invoices)</p>
                  <p className="text-2xl font-bold text-green-600">{formatNaira(totalInvoiceWHT)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net WHT Position</p>
                  <p className={`text-2xl font-bold ${netWHTPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNaira(Math.abs(netWHTPosition))}
                  </p>
                </div>
                <FileText className={`w-8 h-8 ${netWHTPosition >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <Button 
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            className="text-sm"
          >
            All WHT ({allWHTItems.length})
          </Button>
          <Button 
            variant={activeFilter === 'expense' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('expense');
              setCurrentPage(1);
            }}
            className="text-sm"
          >
            Expense WHT ({expenseWHTItems.length})
          </Button>
          <Button 
            variant={activeFilter === 'invoice' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('invoice');
              setCurrentPage(1);
            }}
            className="text-sm"
          >
            Invoice WHT ({invoiceWHTItems.length})
          </Button>
        </div>

        {/* WHT Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                <span>{totalItems} transactions</span>
              </div>
              <div className="flex items-center gap-2">
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    {allWHTItems.filter((item: any) => item.status === "deducted").length} Deducted
                  </Badge>
                  <Badge variant="outline" className="text-blue-600">
                    {allWHTItems.filter((item: any) => item.status === "paid").length} Paid
                  </Badge>
                </div>
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                  <DialogTrigger asChild>
                    {/*<Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add WHT
                    </Button>*/}
                  </DialogTrigger>
                </Dialog>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Track all withholding tax deductions and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto" style={{ maxHeight: '276px' }}> {/* Show 3 entries visually, but paginate 10 entries per page */}
              {allWHTItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No WHT records yet</p>
                <p className="text-sm mt-2">Add your first WHT record to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status}</span>
                          </Badge>
                          <Badge variant="outline">{item.whtRate}</Badge>
                          <Badge variant={item.type === 'expense' ? 'default' : 'secondary'}>
                            {item.type === 'expense' ? 'Expense' : 'Invoice'}
                          </Badge>
                          {item.type === 'invoice' && item.invoiceNumber && (
                            <span className="text-sm text-muted-foreground">{item.invoiceNumber}</span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-1">{item.deducteeName}</h3>
                        {item.deducteeTaxId && (
                          <p className="text-sm text-muted-foreground mb-2">Tax ID: {item.deducteeTaxId}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">{formatNaira(item.amount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">WHT Amount:</span>
                            <p className="font-medium text-primary">{formatNaira(item.whtAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Transaction Date:</span>
                            <p className="font-medium">{new Date(item.transactionDate).toLocaleDateString()}</p>
                          </div>
                          {item.paymentDate && (
                            <div>
                              <span className="text-muted-foreground">Payment Date:</span>
                              <p className="font-medium">{new Date(item.paymentDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        
                        {item.certificateNumber && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">Certificate #: </span>
                            <span className="font-medium text-sm">{item.certificateNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {item.invoiceId && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/invoice/${item.invoiceId}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add WHT Dialog */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Withholding Tax Record</DialogTitle>
              <DialogDescription>
                Enter the details of the withholding tax deduction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="deducteeName">Deductee Name</Label>
                <Input
                  id="deducteeName"
                  placeholder="Name of deductee"
                  value={formData.deducteeName}
                  onChange={(e) => setFormData({ ...formData, deducteeName: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="deducteeTaxId">Tax ID (Optional)</Label>
                <Input
                  id="deducteeTaxId"
                  placeholder="Tax identification number"
                  value={formData.deducteeTaxId}
                  onChange={(e) => setFormData({ ...formData, deducteeTaxId: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="whtRate">WHT Rate</Label>
                <Select
                  value={formData.whtRate}
                  onValueChange={(value) => setFormData({ ...formData, whtRate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select WHT rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5%">5%</SelectItem>
                    <SelectItem value="10%">10%</SelectItem>
                    <SelectItem value="15%">15%</SelectItem>
                    <SelectItem value="20%">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="transactionDate">Transaction Date</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description of the transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWHTMutation.isPending}>
                  {createWHTMutation.isPending ? "Adding..." : "Add WHT Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </main>
      <BottomNavigation />
    </div>
  );
}
