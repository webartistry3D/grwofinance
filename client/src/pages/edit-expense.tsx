import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Save, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatAmountInput, parseAmount } from "@/lib/currency";

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  imageUrl?: string;
}

export default function EditExpense() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch expense data
  const { data: expense, isLoading } = useQuery({
    queryKey: [`/api/expenses/${id}`],
    retry: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    category: "",
    date: "",
    notes: ""
  });

  // Update form when expense data is loaded
  useEffect(() => {
    if (expense) {
      setFormData({
        merchant: expense.merchant || "",
        amount: String(expense.amount || ""),
        category: expense.category || "",
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : "",
        notes: expense.notes || ""
      });
    }
  }, [expense]);

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/expenses/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Expense Updated",
        description: "Expense has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/expense-history");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to update expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      merchant: formData.merchant,
      amount: parseAmount(formData.amount),
      category: formData.category,
      date: formData.date,
      notes: formData.notes
    };

    await updateExpenseMutation.mutateAsync(expenseData);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'amount') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Edit Expense" showBack={true} backHref="/expense-history" />
        <main className="pb-20 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Loading expense data...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Edit Expense" showBack={true} backHref="/expense-history" />
        <main className="pb-20 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Expense Not Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  The expense you're trying to edit could not be found.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Edit Expense" showBack={true} backHref="/expense-history" />
      <main className="pb-20 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Merchant Field */}
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant Name *</Label>
                  <Input
                    id="merchant"
                    name="merchant"
                    placeholder="e.g., Shoprite, GTBank, Uber, etc."
                    value={formData.merchant}
                    onChange={(e) => handleInputChange("merchant", e.target.value)}
                    required
                    data-testid="input-merchant"
                  />
                </div>

                {/* Amount Field */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formatAmountInput(formData.amount)}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    required
                    data-testid="input-amount"
                  />
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select expense category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                    data-testid="input-date"
                  />
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes about this expense..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full min-h-20 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    data-testid="textarea-notes"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setLocation("/expense-history")} data-testid="button-cancel">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updateExpenseMutation.isPending} data-testid="button-save-expense">
                    <Save className="w-4 h-4 mr-2" />
                    {updateExpenseMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
