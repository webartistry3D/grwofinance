import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, DollarSign, Edit, Trash2, Settings } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatNaira, formatAmountInput, parseAmount } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// -----------------------------
// Types
// -----------------------------
interface ManualIncome {
  id: string;
  source: string;
  description: string;
  amount: number;
  category: string;
  frequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ManualIncomeForm {
  description: string;
  amount: number;
  category: string;
  frequency: string;
}

// VAT rate constant
const VAT_RATE = 0.075;

// -----------------------------
// Main Component
// -----------------------------
export default function ManualIncomeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<ManualIncome | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<ManualIncome | null>(null);

  const [formData, setFormData] = useState<ManualIncomeForm>({
    description: "",
    amount: 0,
    category: "",
    frequency: "monthly"
  });

  // Fetch manual income records (exclude invoice-derived income)
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ["/api/income"],
    queryFn: async () => {
      try {
        console.log('📊 Fetching manual income records...');
        const response = await fetch('/api/income');
        if (!response.ok) throw new Error('Failed to fetch manual income records');
        const data = await response.json();
        console.log('📊 Manual income records received:', data.length, 'records');
        return data;
      } catch (error) {
        console.error('Error fetching manual income records:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 0, // No caching - always fresh data
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });

  // Transform API data to ManualIncome[] (exclude invoice-derived)
  const manualIncomes: ManualIncome[] =
    incomeData && Array.isArray(incomeData)
      ? incomeData
          .filter((income: any) => {
            // Only include income records that DON'T have an invoiceNumber
            const hasInvoiceNumber = income.invoiceNumber && income.invoiceNumber.trim() !== "";
            console.log(`🔍 Filtering manual income: ${income.source || income.description} - hasInvoiceNumber: ${hasInvoiceNumber}`);
            return !hasInvoiceNumber;
          })
          .map((income: any) => ({
            id: income.id,
            source: income.source || income.description,
            description: income.description,
            amount: Number(income.amount),
            category: income.category?.toLowerCase() || "other",
            frequency: income.frequency || "monthly",
            status: income.status === "received" ? "active" : "pending",
            createdAt: income.createdAt || new Date().toISOString(),
            updatedAt: income.updatedAt || new Date().toISOString()
          }))
      : [];

  // -----------------------------
  // API Mutations
  // -----------------------------
  // Add new manual income
  const addManualIncomeMutation = useMutation({
    mutationFn: async (data: ManualIncomeForm) => {
      const totalWithVAT = data.amount * (1 - VAT_RATE);
      return apiRequest("/api/income", "POST", {
        source: data.description,
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
      console.log('✅ Manual income added successfully - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      toast({ title: "Manual Income Added", description: "Added successfully" });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Add manual income error:", error);
      handleMutationError(error);
    }
  });

  // Edit existing manual income
  const editManualIncomeMutation = useMutation({
    mutationFn: async (data: { id: string; formData: ManualIncomeForm }) => {
      const totalWithVAT = data.formData.amount * (1 - VAT_RATE);
      return apiRequest(`/api/income/${data.id}`, "PUT", {
        source: data.formData.description,
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
      console.log('✅ Manual income updated successfully - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      toast({ title: "Manual Income Updated", description: "Updated successfully" });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Edit manual income error:", error);
      handleMutationError(error);
    }
  });

  // Delete manual income
  const deleteManualIncomeMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/income/${id}`, "DELETE"),
    onSuccess: () => {
      console.log('✅ Manual income deleted successfully - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      toast({ title: "Manual Income Deleted", description: "Deleted successfully" });
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    },
    onError: (error: any) => {
      console.error("Delete manual income error:", error);
      const message = error?.response?.data?.message || error?.message || "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

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
      description: "",
      amount: 0,
      category: "",
      frequency: "monthly"
    });
    setEditingIncome(null);
    setIsFormOpen(false);
  };

  const handleEdit = (income: ManualIncome) => {
    // Reverse VAT to show base amount
    const baseAmount = income.amount / (1 - VAT_RATE);
    setFormData({
      description: income.source,
      amount: baseAmount,
      category: income.category,
      frequency: income.frequency
    });
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (income: ManualIncome) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (incomeToDelete) deleteManualIncomeMutation.mutate(incomeToDelete.id);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  // -----------------------------
  // Submit Form Handler
  // -----------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIncome) {
      editManualIncomeMutation.mutate({ id: editingIncome.id, formData });
    } else {
      addManualIncomeMutation.mutate(formData);
    }
  };

  return (
    <div className="w-full max-w-none md:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Manual Income Manager" showBack={true} backHref="/income-manager" />
      
      <main className="pb-20 px-4 py-6">
        {/* Overview Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Monthly</p>
                <p className="text-2xl font-bold" style={{ color: "#29A378" }} data-testid="text-monthly-income">
                  {formatNaira(manualIncomes.reduce((total, income) => {
                    if (income.status !== "active") return total;
                    switch (income.frequency) {
                      case "monthly": return total + income.amount;
                      case "weekly": return total + income.amount * 4.33;
                      case "yearly": return total + income.amount / 12;
                      case "one-time": return total;
                      default: return total;
                    }
                  }, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Active sources</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(41, 163, 120, 0.1)" }}>
                <DollarSign className="w-6 h-6" style={{ color: "#29A378" }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sources</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-sources">
                  {manualIncomes.filter((s) => s.status === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Manual income streams</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Add Manual Income Button */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="w-full md:w-auto"
              style={{ backgroundColor: "#29A378" }}
              data-testid="button-add-manual-income"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Income
            </Button>
            
            <Link href="/income-settings">
              <Button
                variant="outline"
                className="w-full md:w-auto"
                data-testid="button-income-settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                Income Settings
              </Button>
            </Link>
          </div>
        </section>

        {/* Manual Income Table */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Manual Income Sources</h2>
          {manualIncomes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Manual Income Sources</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first manual income source to track your earnings.
                </p>
                <Button onClick={() => setIsFormOpen(true)} style={{ backgroundColor: "#29A378" }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Manual Income
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount (After Tax)</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell className="font-medium">{income.source}</TableCell>
                        <TableCell>{income.description}</TableCell>
                        <TableCell>{income.category}</TableCell>
                        <TableCell>{income.frequency}</TableCell>
                        <TableCell>
                          <Badge 
                            style={{ 
                              backgroundColor: income.status === "active" ? "#29A378" : "#F59E0B", 
                              color: "white" 
                            }}
                          >
                            {income.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono" style={{ color: "#29A378" }}>
                          {formatNaira(income.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(income.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(income)}
                            >
                              <Edit className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              style={{ borderColor: "#EA580C", color: "#EA580C" }} 
                              onClick={() => handleDeleteClick(income)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Add/Edit Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingIncome ? "Edit Manual Income" : "Add Manual Income"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Source Name</Label>
                    <Input 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="e.g., Monthly Salary" 
                      required 
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="text"
                      value={formData.amount.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value === '') {
                          setFormData({ ...formData, amount: 0 });
                        } else {
                          const parsed = parseAmount(value);
                          if (!isNaN(parsed)) setFormData({ ...formData, amount: parsed });
                        }
                      }}
                      placeholder="0.00"
                      required
                      min="0"
                    />
                    {formData.amount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        VAT (7.5%): -{formatNaira(formData.amount * VAT_RATE)}
                      </div>
                    )}
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
                      required
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

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      style={{ backgroundColor: "#29A378" }}
                      disabled={addManualIncomeMutation.isPending || editManualIncomeMutation.isPending}
                    >
                      {editingIncome
                        ? editManualIncomeMutation.isPending
                          ? "Updating..."
                          : "Update"
                        : addManualIncomeMutation.isPending
                        ? "Adding..."
                        : "Add"}{" "}
                      Manual Income
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Manual Income</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{incomeToDelete?.source}"? This action cannot be undone.
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
      </main>

      <BottomNavigation />
    </div>
  );
}