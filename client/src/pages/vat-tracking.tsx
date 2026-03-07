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
import { Receipt, Plus, Download, CheckCircle, AlertCircle, FileText, TrendingUp, TrendingDown, Calendar, Eye } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";
import PaginationControls from "@/components/pagination-controls";

interface VATItem {
  id: string;
  invoiceId?: string;
  expenseId?: string;
  amount: number;
  vatRate: string;
  vatAmount: number;
  merchantName?: string;
  clientName?: string;
  transactionDate: string;
  paymentDate?: string;
  type: "output" | "input"; // Output VAT from sales, Input VAT from purchases
  status: string;
  description?: string;
}

export default function VATTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'output' | 'input'>('all');
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    amount: "",
    vatRate: "7.5%",
    merchantName: "",
    clientName: "",
    transactionDate: new Date().toISOString().split('T')[0],
    type: "output" as "output" | "input",
    description: ""
  });

  // Fetch VAT items from invoices (output VAT)
  const { data: outputVATData = [], isLoading: outputVATLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  // Fetch VAT items from expenses (input VAT)
  const { data: inputVATData = [], isLoading: inputVATLoading } = useQuery<any[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Combine and process VAT data
  const vatItems: VATItem[] = [
    // Output VAT from invoices
    ...(outputVATData || [])
      .filter((invoice: any) => {
        // Include invoices that either have explicit vatAmount OR can calculate VAT from amount
        const hasExplicitVAT = invoice.vatAmount && parseFloat(invoice.vatAmount) > 0;
        const canCalculateVAT = invoice.amount && parseFloat(invoice.amount) > 0 && 
                               (invoice.status === 'paid' || invoice.status === 'received');
        return hasExplicitVAT || canCalculateVAT;
      })
      .map((invoice: any) => {
        // Calculate VAT if not explicitly provided
        let vatAmount = 0;
        if (invoice.vatAmount && parseFloat(invoice.vatAmount) > 0) {
          vatAmount = parseFloat(invoice.vatAmount);
        } else if (invoice.amount && parseFloat(invoice.amount) > 0) {
          // Calculate VAT as 7.5% of the amount (excluding VAT)
          const totalAmount = parseFloat(invoice.amount);
          const netAmount = totalAmount / 1.075; // Remove 7.5% VAT
          vatAmount = totalAmount - netAmount;
        }
        
        return {
          id: invoice.id,
          invoiceId: invoice.id,
          amount: parseFloat(invoice.amount),
          vatRate: invoice.vatRate || "7.5%",
          vatAmount: vatAmount,
          clientName: invoice.clientName,
          transactionDate: invoice.issueDate || invoice.createdAt,
          type: "output" as const,
          status: invoice.status,
          description: invoice.description
        };
      }),
    // Input VAT from expenses
    ...(inputVATData || [])
      .filter((expense: any) => expense.vatAmount && parseFloat(expense.vatAmount) > 0)
      .map((expense: any) => ({
        id: expense.id,
        expenseId: expense.id,
        amount: parseFloat(expense.amount),
        vatRate: expense.vatRate || "7.5%",
        vatAmount: parseFloat(expense.vatAmount),
        merchantName: expense.merchantName || expense.description || "Unknown",
        transactionDate: expense.date,
        type: "input" as const,
        status: expense.status || "completed",
        description: expense.description
      }))
  ].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  // Filter VAT items based on active filter
  const filteredVATItems = vatItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'output') return item.type === 'output';
    if (activeFilter === 'input') return item.type === 'input';
    return true;
  });

  // Pagination logic
  const totalItems = filteredVATItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredVATItems.slice(startIndex, endIndex);

  // Calculate totals
  const totalOutputVAT = vatItems
    .filter(item => item.type === "output")
    .reduce((sum, item) => sum + item.vatAmount, 0);

  const totalInputVAT = vatItems
    .filter(item => item.type === "input")
    .reduce((sum, item) => sum + item.vatAmount, 0);

  const netVATPosition = totalOutputVAT - totalInputVAT;

  const isLoading = authLoading || outputVATLoading || inputVATLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getTypeIcon = (type: "output" | "input") => {
    return type === "output" ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTypeColor = (type: "output" | "input") => {
    return type === "output" ? 
      "text-green-600 dark:text-green-400" : 
      "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return <FullScreenSkeleton />;
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="VAT Tracking" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-4 py-6">
        {/* VAT Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Output VAT</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatNaira(totalOutputVAT)}
                  </p>
                  <p className="text-xs text-muted-foreground">VAT collected from sales</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Input VAT</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatNaira(totalInputVAT)}
                  </p>
                  <p className="text-xs text-muted-foreground">VAT paid on purchases</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net VAT Position</p>
                  <p className={`text-2xl font-bold ${netVATPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatNaira(netVATPosition)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {netVATPosition >= 0 ? 'VAT payable to authority' : 'VAT refundable'}
                  </p>
                </div>
                <Receipt className={`h-8 w-8 ${netVATPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
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
            All VAT ({vatItems.length})
          </Button>
          <Button 
            variant={activeFilter === 'output' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('output');
              setCurrentPage(1);
            }}
            className="text-sm"
          >
            Output VAT ({vatItems.filter(item => item.type === 'output').length})
          </Button>
          <Button 
            variant={activeFilter === 'input' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('input');
              setCurrentPage(1);
            }}
            className="text-sm"
          >
            Input VAT ({vatItems.filter(item => item.type === 'input').length})
          </Button>
        </div>

        {/* VAT Transactions List */}
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
                    {filteredVATItems.filter(item => item.status === "paid" || item.status === "received").length} Paid
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600">
                    {filteredVATItems.filter(item => item.status === "pending").length} Pending
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Track all VAT transactions from sales and purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto" style={{ maxHeight: '276px' }}> {/* Show 3 entries visually, but paginate 10 entries per page */}
              {filteredVATItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {vatItems.length === 0 ? 
                    "No VAT transactions found" : 
                    `No ${activeFilter === 'all' ? '' : activeFilter === 'output' ? 'Output' : 'Input'} VAT transactions found`
                  }
                </p>
                <p className="text-sm">
                  {vatItems.length === 0 ? 
                    "VAT will be calculated when you create invoices or record expenses with VAT" :
                    "Try changing the filter to see other VAT transactions"
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(item.type)}
                            <span className="font-semibold text-lg">
                              {item.type === "output" ? item.clientName : item.merchantName}
                            </span>
                            <Badge variant="outline" className={getTypeColor(item.type)}>
                              {item.type === "output" ? "Output VAT" : "Input VAT"}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            {item.invoiceId && (
                              <Badge variant="secondary">
                                Invoice: {item.invoiceId.slice(-8)}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description || `VAT ${item.vatRate} transaction`}
                          </p>
                          
                          {/* Transaction Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-muted-foreground">Transaction Amount:</span>
                              <span className="font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                {formatNaira(item.amount)}
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-muted-foreground">VAT Amount:</span>
                              <span className={`font-semibold ${getTypeColor(item.type)}`} style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                {formatNaira(item.vatAmount)}
                              </span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-muted-foreground">VAT Rate:</span>
                              <span className="font-medium">{item.vatRate}</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-muted-foreground">Transaction Date:</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{new Date(item.transactionDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          {item.invoiceId && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/invoice/${item.invoiceId}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                          {item.expenseId && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/edit-expense/${item.expenseId}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
              </>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">VAT Filing</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Monthly VAT returns are due on the 21st of each month
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/tax-calendar')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Filing Calendar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">VAT Reports</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Generate VAT reports for tax compliance
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/tax-reports')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate VAT Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
