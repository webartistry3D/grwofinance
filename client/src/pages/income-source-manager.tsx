import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, DollarSign, Edit, Trash2, Settings, Building2, Save, FileText, Receipt, CreditCard, BanknoteIcon, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatNaira, formatAmountInput, parseAmount } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
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

// -----------------------------
// Types
// -----------------------------
// Form validation schema
const settingsSchema = z.object({
  // Business Information
  businessName: z.string().min(1, "Business name is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessEmail: z.string().email("Valid email is required"),
  businessPhone: z.string().min(1, "Business phone is required"),
  
  // Invoice Settings
  defaultPaymentTerms: z.string().min(1, "Default payment terms are required"),
  invoiceNotes: z.string().optional(),
  taxRate: z.string().default("7.5"),
  nextInvoiceNumber: z.string().min(1, "Next invoice number is required"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface UserSettings {
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  defaultPaymentTerms?: string;
  invoiceNotes?: string;
  taxRate?: string;
  nextInvoiceNumber?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: "savings" | "current" | "domiciliary";
  currency: "NGN" | "USD" | "EUR" | "GBP";
  isDefault: boolean;
  includeInInvoice: boolean;
}

interface IncomeSource {
  id: string;
  name: string;
  description?: string;
  amount: number; // Amount **after VAT deduction**
  frequency: "monthly" | "weekly" | "yearly" | "one-time";
  status: "active" | "inactive" | "pending";
  nextExpected?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface IncomeSourceForm {
  name: string;
  description: string;
  amount: number; // Base amount before VAT
  frequency: "monthly" | "weekly" | "biweekly" | "quarterly" | "yearly" | "one-time";
  category: string;
}

// VAT rate constant
const VAT_RATE = 0.075;

// -----------------------------
// Main Component
// -----------------------------
export default function IncomeSourceManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<'records' | 'settings'>('records');

  // -----------------------------
  // State
  // -----------------------------
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<IncomeSource | null>(null);

  const [formData, setFormData] = useState<IncomeSourceForm>({
    name: "",
    description: "",
    amount: 0,
    frequency: "monthly",
    category: "salary"
  });

  // Settings form and state
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      businessName: "",
      businessAddress: "",
      businessEmail: "",
      businessPhone: "",
      defaultPaymentTerms: "Net 30",
      invoiceNotes: "",
      taxRate: "7.5",
      nextInvoiceNumber: "INV-001",
    },
  });

  // Bank accounts UI state
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState<Partial<BankAccount>>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    accountType: "savings",
    currency: "NGN",
    isDefault: false,
    includeInInvoice: true,
  });

  // -----------------------------
  // Fetch income sources
  // -----------------------------
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ["/api/income"],
    retry: false
  });

  // Get user settings
  const { data: userSettings, isLoading: isLoadingSettings } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
  });

  // Get bank accounts
  const { data: bankAccountsData, isLoading: isLoadingBankAccounts, refetch: refetchBankAccounts, error: bankAccountsError } = useQuery<BankAccount[]>({
    queryKey: ['/api', 'bank-accounts'],
  });

  // Use bankAccountsData directly instead of local state
  const bankAccounts = bankAccountsData || [];

  // Log API response for debugging frequency field
  useEffect(() => {
    if (incomeData) {
      console.log("📊 Income API Response:", incomeData);
      console.log("📊 Filtered Income Sources:", incomeSources.map(s => ({
        id: s.id,
        name: s.name,
        hasInvoiceNumber: !!(s.description?.includes('Invoice')) // Debug check
      })));
    }
  }, [incomeData]);

  // Update form when data loads
  useEffect(() => {
    if (userSettings) {
      form.reset({
        businessName: userSettings.businessName || "",
        businessAddress: userSettings.businessAddress || "",
        businessEmail: userSettings.businessEmail || "",
        businessPhone: userSettings.businessPhone || "",
        defaultPaymentTerms: userSettings.defaultPaymentTerms || "Net 30",
        invoiceNotes: userSettings.invoiceNotes || "",
        taxRate: userSettings.taxRate || "7.5",
        nextInvoiceNumber: userSettings.nextInvoiceNumber || "INV-001",
      });
    }
  }, [userSettings, form]);

  // -----------------------------
  // API Mutations
  // -----------------------------
  // Add new income source
  const addIncomeSourceMutation = useMutation({
    mutationFn: async (data: IncomeSourceForm) => {
      const totalWithVAT = data.amount * (1 - VAT_RATE);
      return apiRequest("/api/income", "POST", {
        source: data.name,
        description: data.description,
        amount: totalWithVAT.toString(),
        category: data.category,
        frequency: data.frequency,
        date: new Date().toISOString().split("T")[0],
        status: "received",
        paymentMethod: "cash"
      });
    },
    onSuccess: () => {
      console.log('✅ Income source added successfully - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      toast({ title: "Income Source Added", description: "Added successfully" });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Add income source error:", error);
      handleMutationError(error);
    }
  });

  // Edit existing income source
  const editIncomeSourceMutation = useMutation({
    mutationFn: async (data: { id: string; formData: IncomeSourceForm }) => {
      const totalWithVAT = data.formData.amount * (1 - VAT_RATE);
      return apiRequest(`/api/income/${data.id}`, "PUT", {
        source: data.formData.name,
        description: data.formData.description,
        amount: totalWithVAT.toString(),
        category: data.formData.category,
        frequency: data.formData.frequency,
        date: new Date().toISOString().split("T")[0],
        status: "received",
        paymentMethod: "cash"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      toast({ title: "Income Source Updated", description: "Updated successfully" });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Edit income source error:", error);
      handleMutationError(error);
    }
  });

  // Delete income source
  const deleteIncomeSourceMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/income/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      toast({ title: "Income Source Deleted", description: "Deleted successfully" });
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    },
    onError: (error: any) => {
      console.error("Delete income source error:", error);
      const message = error?.response?.data?.message || error?.message || "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest("PUT", "/api/user/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your business information and invoice settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  // Bank account management functions
  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountName || !newBankAccount.accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required bank account fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("/api/bank-accounts", "POST", newBankAccount);
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api', 'bank-accounts'] });
      setNewBankAccount({
        bankName: "",
        accountName: "",
        accountNumber: "",
        accountType: "savings",
        currency: "NGN",
        isDefault: false,
        includeInInvoice: true,
      });
      setShowAddBankForm(false);

      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api', 'bank-accounts'] });

      toast({
        title: "Bank Account Added",
        description: "Bank account has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast({
        title: "Error",
        description: "Failed to add bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    try {
      await apiRequest(`/api/bank-accounts/${id}`, "DELETE");
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api', 'bank-accounts'] });

      toast({
        title: "Bank Account Removed",
        description: "Bank account has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast({
        title: "Error",
        description: "Failed to delete bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultBank = async (id: string) => {
    try {
      const account = bankAccounts.find(acc => acc.id === id);
      if (!account) return;

      const response = await apiRequest(`/api/bank-accounts/${id}`, "PUT", {
        isDefault: true
      });
      
      // Invalidate cache and refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['/api', 'bank-accounts'] });
      await refetchBankAccounts();

      toast({
        title: "Default Bank Updated",
        description: `${account.accountName} is now the default bank account.`,
      });
    } catch (error) {
      console.error("Error setting default bank:", error);
      toast({
        title: "Error",
        description: "Failed to update default bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleInvoiceInclude = async (id: string) => {
    try {
      const account = bankAccounts.find(acc => acc.id === id);
      if (!account) return;

      const response = await apiRequest(`/api/bank-accounts/${id}`, "PUT", {
        includeInInvoice: !account.includeInInvoice
      });
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api', 'bank-accounts'] });
    } catch (error) {
      console.error("Error toggling invoice include:", error);
      toast({
        title: "Error",
        description: "Failed to update bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSettingsSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const handleMutationError = (error: any) => {
    const errorMessage = error?.response?.data?.message || error?.message || "Action failed";
    const validationErrors = error?.response?.data?.errors;
    if (validationErrors && Array.isArray(validationErrors)) {
      toast({
        title: "Validation Error",
        description: validationErrors.map((e: any) => e.message || e).join(", "),
        variant: "destructive"
      });
    } else {
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      amount: 0,
      frequency: "monthly",
      category: "salary"
    });
    setEditingSource(null);
    setIsFormOpen(false);
  };

  const handleEdit = (source: IncomeSource) => {
    // Reverse VAT to show base amount
    const baseAmount = source.amount / (1 - VAT_RATE);
    setFormData({
      name: source.name,
      description: source.description || "",
      amount: baseAmount,
      frequency: source.frequency,
      category: source.category
    });
    setEditingSource(source);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (source: IncomeSource) => {
    setSourceToDelete(source);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sourceToDelete) deleteIncomeSourceMutation.mutate(sourceToDelete.id);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSourceToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#29A378";
      case "pending":
        return "#F59E0B";
      case "inactive":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "weekly":
        return "Weekly";
      case "yearly":
        return "Yearly";
      case "one-time":
        return "One-time";
      default:
        return frequency;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "salary":
        return <Building2 className="w-4 h-4" />;
      case "freelance":
        return <TrendingUp className="w-4 h-4" />;
      case "investment":
        return <DollarSign className="w-4 h-4" />;
      case "business":
        return <Building2 className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  // -----------------------------
  // Transform API data to IncomeSource[]
  // -----------------------------
  const incomeSources: IncomeSource[] =
    incomeData && Array.isArray(incomeData)
      ? incomeData
          .filter((income: any) => {
            // Only include income records that DON'T have an invoiceNumber
            // These are manually created income sources, not ones from invoices
            const hasInvoiceNumber = income.invoiceNumber && income.invoiceNumber.trim() !== "";
            console.log(`🔍 Filtering income record: ${income.source || income.description} - hasInvoiceNumber: ${hasInvoiceNumber}`);
            return !hasInvoiceNumber;
          })
          .map((income: any) => ({
            id: income.id,
            name: income.source || income.description,
            description: income.description,
            amount: Number(income.amount),
            frequency: income.frequency || "monthly",
            status: income.status === "received" ? "active" : "pending",
            category: income.category?.toLowerCase() || "other",
            nextExpected: income.nextExpected,
            createdAt: income.createdAt || new Date().toISOString(),
            updatedAt: income.updatedAt || new Date().toISOString()
          }))
      : [];

  // -----------------------------
  // Compute Overview Stats
  // -----------------------------
  const totalMonthlyIncome = incomeSources.reduce((total, source) => {
    if (source.status !== "active") return total;
    switch (source.frequency) {
      case "monthly":
        return total + source.amount;
      case "weekly":
        return total + source.amount * 4.33;
      case "yearly":
        return total + source.amount / 12;
      case "one-time":
        return total;
      default:
        return total;
    }
  }, 0);

  const activeSourcesCount = incomeSources.filter((s) => s.status === "active").length;
  const pendingSourcesCount = incomeSources.filter((s) => s.status === "pending").length;

  // -----------------------------
  // Submit Form Handler
  // -----------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSource) {
      editIncomeSourceMutation.mutate({ id: editingSource.id, formData });
    } else {
      addIncomeSourceMutation.mutate(formData);
    }
  };

  // -----------------------------
  // Loading State
  // -----------------------------
  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Income Manager" showBack={true} backHref="/settings" />
        <main className="pb-20 px-4 py-4">
          <div className="text-center">Loading income sources...</div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  // -----------------------------
  // Render Component
  // -----------------------------
  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Income Manager" showBack={true} backHref="/income-manager" />

      <main className="pb-20 px-4 py-4">
        {/* Overview Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold" style={{ color: "#29A378" }} data-testid="text-monthly-income">
                  {formatNaira(totalMonthlyIncome)}
                </p>
                <p className="text-xs text-muted-foreground">Active sources</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(41, 163, 120, 0.1)" }}>
                <TrendingUp className="w-6 h-6" style={{ color: "#29A378" }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sources</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-sources">
                  {activeSourcesCount}
                </p>
                <p className="text-xs text-muted-foreground">Income streams</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Section commented for now */}
          {/* <Card>...</Card> */}
        </section>

        {/* Add Income Source Button */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setCurrentView('records')}
              className="w-full md:w-auto"
              variant={currentView === 'records' ? 'default' : 'outline'}
              style={{ backgroundColor: currentView === 'records' ? "#29A378" : undefined }}
              data-testid="button-add-income-source"
            >
              {/*<Plus className="w-4 h-4 mr-2" />*/}
              Manual Income Records
            </Button>
            
            <Button
              onClick={() => setCurrentView('settings')}
              className="w-full md:w-auto"
              variant={currentView === 'settings' ? 'default' : 'outline'}
              style={{ backgroundColor: currentView === 'settings' ? "#29A378" : undefined }}
              data-testid="button-income-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Income Settings
            </Button>
          </div>
        </section>

        {/* Content Section - Conditional Render */}
        {currentView === 'records' ? (
          <section className="space-y-4">
            {/*<h2 className="text-lg font-semibold">Records</h2>*/}
            {incomeSources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Manual Income Sources</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomeSources.map((source) => (
                  <Card key={source.id} className="relative">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{source.name}</h3>
                            <p className="text-sm text-muted-foreground">{source.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: getStatusColor(source.status), color: "white" }}>
                            {source.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Amount & Frequency */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount before Tax:</span>
                          <span className="font-bold" style={{ color: "#29A378", fontFamily: '"Share Tech Mono", monospace' }}>
                            {formatNaira(source.amount / (1 - VAT_RATE))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Frequency:</span>
                          <span className="text-sm font-medium">{getFrequencyText(source.frequency)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount after Tax:(-{VAT_RATE * 100}%)</span>
                          <span className="font-bold" style={{ color: "#29A378", fontFamily: '"Share Tech Mono", monospace' }}>
                            {formatNaira(source.amount)}
                          </span>
                        </div>
                        {source.nextExpected && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Next Expected:</span>
                            <span className="text-sm font-medium">
                              {new Date(source.nextExpected).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(source)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" style={{ borderColor: "#EA580C", color: "#EA580C" }} onClick={() => handleDeleteClick(source)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Settings View */
          <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  This information will appear on all your invoices and reports.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      {...form.register("businessName")}
                      placeholder="Your Business Name"
                      data-testid="input-business-name"
                    />
                    {form.formState.errors.businessName && (
                      <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      {...form.register("businessEmail")}
                      placeholder="business@company.com"
                      data-testid="input-business-email"
                    />
                    {form.formState.errors.businessEmail && (
                      <p className="text-sm text-destructive">{form.formState.errors.businessEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone *</Label>
                  <Input
                    id="businessPhone"
                    {...form.register("businessPhone")}
                    placeholder="+234 XXX XXX XXXX"
                    data-testid="input-business-phone"
                  />
                  {form.formState.errors.businessPhone && (
                    <p className="text-sm text-destructive">{form.formState.errors.businessPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Textarea
                    id="businessAddress"
                    {...form.register("businessAddress")}
                    placeholder="Your business address, city, state, country"
                    rows={3}
                    data-testid="input-business-address"
                  />
                  {form.formState.errors.businessAddress && (
                    <p className="text-sm text-destructive">{form.formState.errors.businessAddress.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bank Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BanknoteIcon className="h-5 w-5 text-primary" />
                  Bank Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add and manage multiple bank accounts for invoice payments. Select which accounts to include on your invoices.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Bank Account Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddBankForm(!showAddBankForm)}
                    className="flex-1"
                    data-testid="button-add-bank-account"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bank Account
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => refetchBankAccounts()}
                    className="px-3"
                    data-testid="button-refresh-bank-accounts"
                  >
                    Refresh
                  </Button>
                </div>

                {/* Add Bank Account Form */}
                {showAddBankForm && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                    <h4 className="font-medium">New Bank Account</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          value={newBankAccount.bankName}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="e.g., Access Bank, GTBank"
                          data-testid="input-bank-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          value={newBankAccount.accountName}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountName: e.target.value }))}
                          placeholder="Account holder name"
                          data-testid="input-account-name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          value={newBankAccount.accountNumber}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                          placeholder="1234567890"
                          data-testid="input-account-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountType">Account Type</Label>
                        <select
                          id="accountType"
                          value={newBankAccount.accountType}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountType: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                          data-testid="select-account-type"
                        >
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                          <option value="domiciliary">Domiciliary</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          value={newBankAccount.currency}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, currency: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                          data-testid="select-currency"
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={newBankAccount.isDefault}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded border-gray-300"
                          data-testid="checkbox-is-default"
                        />
                        <Label htmlFor="isDefault" className="text-sm">Set as default</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeInInvoice"
                          checked={newBankAccount.includeInInvoice}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, includeInInvoice: e.target.checked }))}
                          className="rounded border-gray-300"
                          data-testid="checkbox-include-invoice"
                        />
                        <Label htmlFor="includeInInvoice" className="text-sm">Include in invoice</Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddBankAccount}
                        className="flex-1"
                        data-testid="button-save-bank-account"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Bank Account
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddBankForm(false);
                          setNewBankAccount({
                            bankName: "",
                            accountName: "",
                            accountNumber: "",
                            accountType: "savings",
                            currency: "NGN",
                            isDefault: false,
                            includeInInvoice: true,
                          });
                        }}
                        data-testid="button-cancel-bank-account"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bank Accounts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Saved Bank Accounts</h4>
                    <span className="text-xs text-muted-foreground">
                      {bankAccounts.length} accounts • Loading: {isLoadingBankAccounts ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((account) => (
                      <div key={account.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{account.bankName}</span>
                              {account.isDefault && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Default</span>
                              )}
                              {account.includeInInvoice && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">In Invoice</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Account Name: {account.accountName}</p>
                              <p>Account Number: {account.accountNumber}</p>
                              <p>Type: {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} ({account.currency})</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultBank(account.id)}
                              disabled={account.isDefault}
                              data-testid={`button-set-default-${account.id}`}
                            >
                              {account.isDefault ? "Default" : "Set Default"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleInvoiceInclude(account.id)}
                              data-testid={`button-toggle-invoice-${account.id}`}
                            >
                              {account.includeInInvoice ? "Remove from Invoice" : "Add to Invoice"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteBankAccount(account.id)}
                              data-testid={`button-delete-bank-${account.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No bank accounts added yet</p>
                      <p className="text-sm">Add your first bank account to include payment details in invoices</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Invoice Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure default settings for your invoices. These will be pre-filled when creating new invoices.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultPaymentTerms">Default Payment Terms *</Label>
                    <select
                      id="defaultPaymentTerms"
                      {...form.register("defaultPaymentTerms")}
                      className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                      data-testid="select-payment-terms"
                    >
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Custom">Custom Terms</option>
                    </select>
                    {form.formState.errors.defaultPaymentTerms && (
                      <p className="text-sm text-destructive">{form.formState.errors.defaultPaymentTerms.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">VAT Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...form.register("taxRate")}
                      placeholder="7.5"
                      data-testid="input-tax-rate"
                    />
                    <p className="text-xs text-muted-foreground">Nigeria's standard VAT rate is 7.5%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextInvoiceNumber">Next Invoice Number *</Label>
                  <Input
                    id="nextInvoiceNumber"
                    {...form.register("nextInvoiceNumber")}
                    placeholder="INV-001"
                    data-testid="input-next-invoice-number"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used for the next invoice you create. It will auto-increment after each invoice.
                  </p>
                  {form.formState.errors.nextInvoiceNumber && (
                    <p className="text-sm text-destructive">{form.formState.errors.nextInvoiceNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNotes">Default Invoice Notes</Label>
                  <Textarea
                    id="invoiceNotes"
                    {...form.register("invoiceNotes")}
                    placeholder="Thank you for your business! Payment is due according to the terms specified above."
                    rows={3}
                    data-testid="input-invoice-notes"
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes will appear at the bottom of all your invoices
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full"
              style={{backgroundColor: '#29A378'}}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateSettingsMutation.isPending ? "Saving..." : "Save All Settings"}
            </Button>
          </form>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sourceToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
