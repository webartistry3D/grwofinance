import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceWithWHT } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Eye, Plus, FileText, Calendar, DollarSign, CheckCircle, Trash2, Send } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  amount: string;
  description: string;
  dueDate: string;
  issueDate: string;
  status: "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "received";
  amountPaid?: string;
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceList() {
  const { data: invoices, isLoading, error } = useQuery<InvoiceWithWHT[]>({
    queryKey: ["/api/invoices"],
  });

  // Sort invoices by creation date (newest first) as backup
  const sortedInvoices = invoices ? [...invoices].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }) : [];

  // Fix invoices that are marked as paid but have amountPaid = 0
  useEffect(() => {
    if (invoices) {
      const fixInvoices = async () => {
        for (const invoice of invoices) {
          if (invoice.status === 'paid' && (!invoice.amountPaid || parseFloat(invoice.amountPaid) === 0)) {
            console.log(`Fixing invoice ${invoice.invoiceNumber}: setting amountPaid from ${invoice.amountPaid} to ${invoice.amount}`);
            try {
              await apiRequest(`/api/invoices/${invoice.id}`, "PATCH", {
                status: 'paid',
                amountPaid: invoice.amount
              });
            } catch (error) {
              console.error(`Failed to fix invoice ${invoice.invoiceNumber}:`, error);
            }
          }
        }
        // Refresh data after fixing
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      };
      
      fixInvoices();
    }
  }, [invoices]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithWHT | null>(null);
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'payment_with_wht'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [showWHTPreview, setShowWHTPreview] = useState(false);
  
  // Update WHT preview when payment type changes
  useEffect(() => {
    setShowWHTPreview(paymentType === 'payment_with_wht');
  }, [paymentType]);

  // Payment modal handlers
  const openPaymentModal = (invoice: InvoiceWithWHT) => {
    setSelectedInvoice(invoice);
    setPaymentType('full');
    setPartialAmount('');
    setShowWHTPreview(false);
    setPaymentModalOpen(true);
  };

  // Format number with thousand separators
  const formatNumber = (value: string) => {
    // Return empty string if input is empty
    if (!value || value.trim() === '') {
      return '';
    }
    
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Return empty if clean value is empty
    if (!cleanValue) {
      return '';
    }
    
    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    let integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    
    // Add thousand separators to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with decimal part if exists
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  };

  // Handle partial amount input with formatting
  const handlePartialAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    setPartialAmount(rawValue);
  };

  // Get formatted display value
  const getDisplayAmount = (value: string) => {
    return formatNumber(value);
  };

  const handlePaymentConfirm = () => {
    if (!selectedInvoice) return;
    
    if (paymentType === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid partial payment amount.",
        variant: "destructive",
      });
      return;
    }
    
    // For partial payments, add to existing amountPaid
    let finalAmountPaid = partialAmount;
    if (paymentType === 'partial' && selectedInvoice.amountPaid) {
      finalAmountPaid = (parseFloat(selectedInvoice.amountPaid) + parseFloat(partialAmount)).toString();
    }
    
    confirmPaymentMutation.mutate({
      invoice: selectedInvoice,
      paymentType,
      partialAmount: paymentType === 'partial' ? finalAmountPaid : undefined
    });
    
    setPaymentModalOpen(false);
  };

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { invoice: InvoiceWithWHT; paymentType: 'full' | 'partial' | 'payment_with_wht'; partialAmount?: string }) => {
      const { invoice, paymentType, partialAmount } = data;
      
      console.log('Payment mutation started:', { invoice, paymentType, partialAmount });
      
      let finalStatus = 'paid';
      let finalAmountPaid = invoice.amount;
      
      if (paymentType === 'partial') {
        finalStatus = 'partially_paid';
        finalAmountPaid = partialAmount || '0';
        
        // Check if this payment completes the invoice
        if (parseFloat(finalAmountPaid) >= parseFloat(invoice.amount)) {
          finalStatus = 'paid';
        }
      } else if (paymentType === 'full') {
        finalStatus = 'paid';
        finalAmountPaid = invoice.amount; // Set amountPaid to full invoice amount
      } else if (paymentType === 'payment_with_wht') {
        // Payment + WHT marks as paid but records WHT deduction
        finalStatus = 'paid';
        // Keep the original partial payment amount (don't overwrite it)
        // The amountPaid field should preserve the original partial payment amount
        finalAmountPaid = invoice.amountPaid || '0'; // Keep original partial amount
      }
      
      console.log('Final payment data:', { finalStatus, finalAmountPaid });
      
      // Update invoice status and amount paid
      const response = await apiRequest(`/api/invoices/${invoice.id}`, "PATCH", {
        status: finalStatus,
        amountPaid: finalAmountPaid
      });
      
      console.log('Update response:', response);

      // Add income record for the payment
      let incomeAmount = finalAmountPaid;
      let grossAmount = finalAmountPaid;
      let whtAmount = "0";
      let whtRate = "0.0000";
      let netAmount = finalAmountPaid;
      let description = `${paymentType === 'full' ? 'Full' : paymentType === 'partial' ? 'Partial' : 'Payment + WHT'} payment for invoice ${invoice.invoiceNumber}`;
      
      if (paymentType === 'payment_with_wht') {
        // Calculate WHT deduction (10% for Nigeria) - EXCLUDING VAT
        const whtRateValue = 0.10; // 10% WHT
        const remainingBalance = parseFloat(invoice.amount) - parseFloat(invoice.amountPaid || '0');
        const baseAmount = parseFloat(invoice.amount) - (parseFloat(invoice.amount) - (parseFloat(invoice.amount) / 1.075)); // Total Amount - VAT Amount
        const whtAmountValue = baseAmount * whtRateValue;
        const netAmountValue = remainingBalance - whtAmountValue;
        
        grossAmount = remainingBalance.toString();
        whtAmount = whtAmountValue.toString();
        whtRate = whtRateValue.toString();
        netAmount = netAmountValue.toString();
        incomeAmount = netAmount; // Net amount = remaining balance - WHT
        description += ` (WHT deduction: ${formatNaira(whtAmountValue)})`;
        
        // Create WHT transaction record
        await apiRequest("/api/wht/transactions", "POST", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          invoiceAmount: parseFloat(invoice.amount),
          whtRate: whtRateValue,
          whtAmount: whtAmountValue,
          netAmount: parseFloat(invoice.amount) - whtAmountValue,
          paymentMethod: "Bank Transfer",
          status: "deducted"
        });
      }
      
      await apiRequest("/api/income", "POST", {
        source: invoice.clientName,
        amount: incomeAmount,
        grossAmount: grossAmount,
        whtAmount: whtAmount,
        whtRate: whtRate,
        netAmount: netAmount,
        category: "Sales",
        description: description,
        date: new Date().toISOString(),
        paymentMethod: "Bank Transfer",
        invoiceNumber: invoice.invoiceNumber,
        status: "received"
      });
    },
    onSuccess: (_, variables) => {
      const { invoice, paymentType } = variables;
      let description = '';
      
      if (paymentType === 'payment_with_wht') {
        const whtRate = 0.10;
        const baseAmount = parseFloat(invoice.amount) / 1.075; // Remove 7.5% VAT
        const whtAmount = baseAmount * whtRate;
        const netAmount = parseFloat(invoice.amount) - whtAmount;
        description = `Payment + WHT for invoice ${invoice.invoiceNumber} recorded. Net income: ${formatNaira(netAmount)} (WHT: ${formatNaira(whtAmount)} on base amount ${formatNaira(baseAmount)})`;
      } else {
        description = `${paymentType === 'full' ? 'Full' : 'Partial'} payment for invoice ${invoice.invoiceNumber} has been recorded.`;
      }
      
      toast({
        title: "Payment Confirmed",
        description: description,
      });
      // Force refresh all invoice and income related queries
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Confirmation Failed",
        description: error.message || "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log('🗑️ Deleting invoice - backend will handle cascade deletion...');
      console.log(`🔍 Invoice ID to delete: ${invoiceId}`);
      
      // Let the backend handle the cascade deletion automatically
      // The backend will delete associated income records based on invoiceNumber
      console.log(`� Calling backend DELETE /api/invoices/${invoiceId} - backend will cascade delete income records`);
      
      return apiRequest(`/api/invoices/${invoiceId}`, "DELETE");
    },
    onSuccess: () => {
      console.log('🗑️ Invoice and associated income records deleted successfully - invalidating all related caches');
      toast({
        title: "Invoice Deleted",
        description: "Invoice and associated income records have been deleted successfully.",
      });
      // Refresh invoices data and income history
      console.log('🔄 Invalidating /api/invoices cache');
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      console.log('🔄 Invalidating /api/income cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      console.log('🔄 Invalidating /api/income/stats cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      
      // Force immediate refetch
      setTimeout(() => {
        console.log('🔄 Force refetching all queries');
        queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
        queryClient.refetchQueries({ queryKey: ["/api/income"] });
        queryClient.refetchQueries({ queryKey: ["/api/income/stats"] });
      }, 100);
    },
    onError: (error: any) => {
      // Handle partial invoice deletion blocked error
      if (error.error === "PARTIAL_INVOICE_DELETE_BLOCKED") {
        toast({
          title: "Partial Invoice Deletion Blocked",
          description: error.message || "Cannot delete partial invoice. Please delete the full payment invoice first.",
          variant: "destructive",
        });
        // You could also show a special dialog here with the related invoice info
        console.log("Related full payment invoice:", error.relatedInvoice);
        return;
      }
      
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cascade delete mutation for full payment invoices
  const cascadeDeleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest(`/api/invoices/${invoiceId}/cascade`, "DELETE");
    },
    onSuccess: () => {
      console.log('🗑️ Cascade delete successful - invalidating all related caches');
      toast({
        title: "Invoices Deleted",
        description: "Full payment invoice and all related partial invoices have been deleted successfully.",
      });
      // Refresh invoices data and income history
      console.log('🔄 Invalidating /api/invoices cache (cascade)');
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      console.log('🔄 Invalidating /api/income cache (cascade)');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      console.log('🔄 Invalidating /api/income/stats cache (cascade)');
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      
      // Force immediate refetch
      setTimeout(() => {
        console.log('🔄 Force refetching all queries (cascade)');
        queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
        queryClient.refetchQueries({ queryKey: ["/api/income"] });
        queryClient.refetchQueries({ queryKey: ["/api/income/stats"] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete invoices. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "received":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Invoices" showBack={true} backHref="/income-manager" />
        <main className="pb-20 px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Invoices" showBack={true} backHref="/income-manager" />
        <main className="pb-20 px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Invoices</h3>
              <p className="text-muted-foreground">Unable to load your invoices. Please try again.</p>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Invoices" showBack={true} backHref="/income-manager" />
      
      <main className="pb-24 px-3 sm:px-4 py-4 sm:py-6">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Your Invoices</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="font-medium">{sortedInvoices?.length || 0} total</span>
              {sortedInvoices && (
                <>
                  <span>•</span>
                  <span className="text-gray-600">{sortedInvoices.filter(inv => inv.status === 'draft').length} Draft</span>
                  <span>•</span>
                  <span className="text-blue-500">{sortedInvoices.filter(inv => inv.status === 'sent').length} Sent</span>
                  <span>•</span>
                  <span className="text-green-600">{sortedInvoices.filter(inv => inv.status === 'paid' || inv.status === 'received').length} Paid</span>
                  <span>•</span>
                  <span className="text-red-600">{sortedInvoices.filter(inv => {
                          if (!inv.dueDate) return false;
                          const dueDate = new Date(inv.dueDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return dueDate < today && 
                                 inv.status !== 'overdue' && 
                                 inv.status !== 'paid' && 
                                 inv.status !== 'received';
                        }).length} Overdue</span>
                </>
              )}
            </div>
          </div>
          <Link href="/create-invoice">
            <Button style={{backgroundColor: '#29A378'}} className="w-full sm:w-auto hover:bg-green-700" data-testid="button-create-invoice">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Invoice List */}
        {!invoices || invoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first invoice to start tracking payments and growing your business.
              </p>
              <Link href="/create-invoice">
                <Button style={{backgroundColor: '#29A378'}} className="hover:bg-green-700" data-testid="button-create-first-invoice">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-24">
            {sortedInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:space-y-0 lg:gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Invoice Number and Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-base sm:text-lg" data-testid={`text-invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {/* Primary Status Badge */}
                          <Badge className={getStatusColor(invoice.status)} data-testid={`badge-status-${invoice.id}`}>
                            {invoice.status ? (invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)) : 'Unknown'}
                          </Badge>
                          
                          {/* Additional Overdue Badge if invoice is overdue and not already marked as overdue or paid */}
                          {(() => {
                            if (!invoice.dueDate) return null;
                            const dueDate = new Date(invoice.dueDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
                            const isOverdue = dueDate < today && 
                                              invoice.status !== 'overdue' && 
                                              invoice.status !== 'paid' && 
                                              invoice.status !== 'received';
                            
                            if (isOverdue) {
                              return (
                                <Badge variant="destructive" className="ml-2">
                                  Overdue
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      
                      {/* Client and Amount Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-muted-foreground">Client:</span>
                          <span className="text-sm break-words font-medium" data-testid={`text-client-${invoice.id}`}>{invoice.clientName}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-foreground text-sm sm:text-base" style={{ fontFamily: '"Share Tech Mono", monospace' }} data-testid={`text-amount-${invoice.id}`}>
                            {formatNaira(parseFloat(invoice.amount))}
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-muted-foreground">Due Date:</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="text-sm">{invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : 'No due date'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Created Date */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Created: {invoice.createdAt ? format(new Date(invoice.createdAt), "MMM dd, yyyy") : 'Unknown'}</span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${invoice.id}`}>
                        {invoice.description}
                      </p>
                      
                      {/* Payment and WHT Details - Show on same row */}
                      {(() => {
                        const showPaymentDetails = invoice.status === "partially_paid" || 
                                                  (invoice.status === "paid" && invoice.amountPaid && parseFloat(invoice.amountPaid) > 0);
                        const showWHTDetails = invoice.status === "paid" || showWHTPreview;
                        
                        // Determine correct invoice status
                        const getCorrectStatus = (invoice: InvoiceWithWHT) => {
                          const amountPaid = parseFloat(invoice.amountPaid || '0');
                          const totalAmount = parseFloat(invoice.amount);
                          
                          if (amountPaid >= totalAmount) {
                            return "paid";
                          } else if (amountPaid > 0) {
                            return "partially_paid";
                          } else {
                            return invoice.status || "draft";
                          }
                        };
                        
                        const correctStatus = getCorrectStatus(invoice);
                        console.log(`Invoice ${invoice.invoiceNumber}: status=${invoice.status}, correctStatus=${correctStatus}, amountPaid=${invoice.amountPaid}, amount=${invoice.amount}`);
                        console.log(`Show payment details:`, showPaymentDetails, `Show WHT details:`, showWHTDetails);
                        
                        return showPaymentDetails || showWHTDetails;
                      })() && (
                        <div className="mt-2 flex flex-col sm:flex-row gap-3">
                          {/* Payment Details */}
                          {(() => {
                            const amountPaid = parseFloat(invoice.amountPaid || '0');
                            const totalAmount = parseFloat(invoice.amount);
                            // Show Payment Details 2 for regular payments (when no WHT transaction exists)
                            const shouldShow = amountPaid > 0 && amountPaid < totalAmount;
                            return shouldShow;
                          })() && (
                            <div className="flex-1 max-w-xs p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                              {/*<div className="font-medium text-xs text-yellow-700 dark:text-yellow-300 mb-2">Payment Details 2:</div>*/}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-yellow-700 dark:text-yellow-300">Partial Payment:</span>
                                  <span className="text-yellow-800 dark:text-yellow-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {invoice.amountPaid && parseFloat(invoice.amountPaid) > 0 ? formatNaira(parseFloat(invoice.amountPaid)) : '₦0.00'}
                                  </span>
                                </div>
                                {(() => {
                                  const amountPaid = parseFloat(invoice.amountPaid || '0');
                                  const totalAmount = parseFloat(invoice.amount);
                                  return amountPaid > 0 && amountPaid < totalAmount;
                                })() && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-yellow-700 dark:text-yellow-300">Balance Payment:</span>
                                    <span className="text-yellow-800 dark:text-yellow-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                      {formatNaira(parseFloat(invoice.amount) - parseFloat(invoice.amountPaid || '0'))}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-yellow-700 dark:text-yellow-300">Date:</span>
                                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                                    {invoice.updatedAt ? format(new Date(invoice.updatedAt), "MMM dd, yyyy") : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Payment Details 3 - Only show when WHT transaction exists */}
                          {(() => {
                            // Check if this invoice has WHT transactions
                            const hasWHTTransaction = invoice.whtTransactions && invoice.whtTransactions.length > 0;
                            const amountPaid = parseFloat(invoice.amountPaid || '0');
                            return hasWHTTransaction && amountPaid > 0;
                          })() && (
                            <div className="flex-1 max-w-xs p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                              <div className="font-medium text-xs text-green-700 dark:text-green-300 mb-2">Payment minus WHT</div>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-green-700 dark:text-green-300">Total Payment:</span>
                                  <span className="text-green-800 dark:text-green-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {formatNaira(parseFloat(invoice.amount) - parseFloat(invoice.amountPaid || '0'))}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-green-700 dark:text-green-300">WHT (10% of base):</span>
                                  <span className="text-green-800 dark:text-green-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    -{formatNaira((parseFloat(invoice.amount) / 1.075) * 0.10)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-green-700 dark:text-green-300">Date:</span>
                                  <span className="text-green-800 dark:text-green-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {invoice.updatedAt ? format(new Date(invoice.updatedAt), "MMM dd, yyyy") : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Payment Details 1 - Only show for regular full payments (no WHT) */}
                          {(() => {
                            const amountPaid = parseFloat(invoice.amountPaid || '0');
                            const totalAmount = parseFloat(invoice.amount);
                            const hasWHTTransaction = invoice.whtTransactions && invoice.whtTransactions.length > 0;
                            // Show for full payments without WHT
                            const shouldShow = amountPaid >= totalAmount && !hasWHTTransaction;
                            console.log(`Payment Details 1 check for ${invoice.invoiceNumber}:`, {
                              amountPaid,
                              totalAmount,
                              hasWHTTransaction,
                              shouldShow,
                              amountPaidValue: invoice.amountPaid,
                              status: invoice.status
                            });
                            return shouldShow;
                          })() && (
                            <div className="flex-1 max-w-xs p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                              {/*<div className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-2">Payment Details 1:</div>*/}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-blue-700 dark:text-blue-300">Full Payment</span>
                                  {/*<span className="text-blue-800 dark:text-blue-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {formatNaira(parseFloat(invoice.amountPaid || '0'))}
                                  </span>*/}
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-blue-700 dark:text-blue-300">Amount Paid:</span>
                                  <span className="text-blue-800 dark:text-blue-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {formatNaira(parseFloat(invoice.amount))}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-blue-700 dark:text-blue-300">Date:</span>
                                  <span className="text-blue-800 dark:text-blue-200 font-semibold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                                    {invoice.updatedAt ? format(new Date(invoice.updatedAt), "MMM dd, yyyy") : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                                                  </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4 mt-4 lg:mt-0">
                      <Link href={`/invoice/${invoice.id}`} className="flex-1 sm:flex-none">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:text-blue-200"
                          data-testid={`button-view-${invoice.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                      </Link>
                      
                      {/* Delete Button - Always active */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full sm:w-auto text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-200"
                            data-testid={`button-delete-${invoice.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Remove</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {invoice.status === 'partially_paid' ? 'Delete Partial Invoice?' : 'Delete Invoice'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {invoice.status === 'partially_paid' ? (
                                <>
                                  This is a <strong>partial payment invoice</strong>. 
                                  <br /><br />
                                  Partial invoices are linked to full payment invoices. 
                                  Deleting the full payment invoice will automatically remove all related partial invoices.
                                  <br /><br />
                                  <strong>Recommendation:</strong> Find and delete the full payment invoice instead.
                                </>
                              ) : (
                                <>
                                  Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>?
                                  <br /><br />
                                  {invoice.status === 'paid' && (
                                    <>
                                      <strong>⚠️ This is a full payment invoice.</strong>
                                      <br />
                                      Deleting this will also remove any related partial invoices.
                                      <br /><br />
                                    </>
                                  )}
                                  This will permanently remove the invoice and all associated data.
                                  <br />
                                  This action cannot be undone.
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                // Use standard delete - backend handles cascade deletion automatically
                                deleteInvoiceMutation.mutate(invoice.id);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {invoice.status === 'paid' ? 'Delete All Related' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full ${
                          invoice.status === "paid" || invoice.status === "received"
                            ? "text-gray-400 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500" 
                            : invoice.status === "partially_paid"
                            ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-950 dark:hover:text-yellow-200"
                            : "text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950 dark:hover:text-green-200"
                        }`}
                        disabled={invoice.status === "paid" || invoice.status === "received"}
                        onClick={() => openPaymentModal(invoice)}
                        data-testid={`button-confirm-payment-${invoice.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          {invoice.status === "partially_paid" ? "Complete Payment" : "Confirm Payment"}
                        </span>
                        <span className="sm:hidden">
                          {invoice.status === "partially_paid" ? "Complete" : "Pay"}
                        </span>
                      </Button>
                      
                      {/* Sent Button - Grayed out when status is sent */}
                      {invoice.status === "sent" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-gray-400 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                          disabled
                          data-testid={`button-sent-${invoice.id}`}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Sent
                        </Button>
                      )}
                    </div>
                    
                    {/* Paid Icon - Only show if paid */}
                    {(invoice.status === "paid" || invoice.status === "received") && (
                      <div className="flex items-center justify-center p-2 bg-green-50 rounded-md border border-green-200 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="ml-1 text-sm font-medium text-green-700 dark:text-green-300">Paid</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Payment Confirmation Modal */}
      <AlertDialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {selectedInvoice?.status === 'partially_paid' ? 'Complete payment for' : 'Confirm payment for'} invoice <strong>{selectedInvoice?.invoiceNumber}</strong>
                <br /><br />
                <div className="space-y-2">
                  <div><strong>Client:</strong> {selectedInvoice?.clientName}</div>
                  <div><strong>Total Amount:</strong> <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                    {selectedInvoice ? formatNaira(parseFloat(selectedInvoice.amount)) : ''}
                  </span></div>
                  {selectedInvoice && (
                    <div><strong>VAT Amount:</strong> <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                      {formatNaira(parseFloat(selectedInvoice.amount) - (parseFloat(selectedInvoice.amount) / 1.075))}
                    </span></div>
                  )}
                  {selectedInvoice?.status === 'partially_paid' && (
                    <>
                      <div><strong>Already Paid:</strong> <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                        {selectedInvoice.amountPaid ? formatNaira(parseFloat(selectedInvoice.amountPaid)) : '₦0.00'}
                      </span></div>
                      <div><strong>Remaining Balance:</strong> <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                        {formatNaira(parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.amountPaid || '0'))}
                      </span></div>
                    </>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Type</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={(e) => setPaymentType(e.target.value as 'full' | 'partial' | 'payment_with_wht')}
                    className="text-primary"
                  />
                  <span className="text-sm">Full Payment</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={(e) => setPaymentType(e.target.value as 'full' | 'partial' | 'payment_with_wht')}
                    className="text-primary"
                  />
                  <span className="text-sm">Partial Payment</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="paymentType"
                    value="payment_with_wht"
                    checked={paymentType === 'payment_with_wht'}
                    onChange={(e) => setPaymentType(e.target.value as 'full' | 'partial' | 'payment_with_wht')}
                    className="text-primary"
                  />
                  <span className="text-sm">Payment + WHT</span>
                </label>
              </div>
              
              {/* WHT Deduction Info */}
              {paymentType === 'payment_with_wht' && selectedInvoice && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <div className="font-medium mb-2">WHT Deduction Details:</div>
                    <div className="space-y-1 text-xs">
                      {selectedInvoice.status === 'partially_paid' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Remaining Balance:</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              {formatNaira(parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.amountPaid || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>WHT (10% of base):</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              -{formatNaira((parseFloat(selectedInvoice.amount) - (parseFloat(selectedInvoice.amount) - (parseFloat(selectedInvoice.amount) / 1.075))) * 0.10)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Balance:</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              {formatNaira((parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.amountPaid || '0')) - ((parseFloat(selectedInvoice.amount) - (parseFloat(selectedInvoice.amount) - (parseFloat(selectedInvoice.amount) / 1.075))) * 0.10))}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Invoice Amount:</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              {formatNaira(parseFloat(selectedInvoice.amount))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>WHT (10% of base):</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              -{formatNaira((parseFloat(selectedInvoice.amount) / 1.075) * 0.10)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Income:</span>
                            <span style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              {formatNaira(parseFloat(selectedInvoice.amount) * 0.90)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {paymentType === 'partial' && (
              <div className="space-y-2">
                <label htmlFor="partialAmount" className="text-sm font-medium">
                  Amount Paid
                </label>
                <input
                  id="partialAmount"
                  type="text"
                  value={getDisplayAmount(partialAmount)}
                  onChange={handlePartialAmountChange}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary transition-colors"
                  max={selectedInvoice ? parseFloat(selectedInvoice.amount) : undefined}
                />
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePaymentConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}