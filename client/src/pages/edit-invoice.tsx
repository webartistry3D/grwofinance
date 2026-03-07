import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, CalendarDays, User, Mail, Phone, MapPin, Save, Eye } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

// Form validation schema
const editInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
});

type EditInvoiceForm = z.infer<typeof editInvoiceSchema>;

interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: string;
  description: string;
  dueDate: string;
  issueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
}

interface UserSettings {
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
}

export default function EditInvoice() {
  const params = useParams();
  const invoiceId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get invoice data
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Get user settings for business info
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
  });

  const form = useForm<EditInvoiceForm>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      description: "",
      amount: "",
      dueDate: "",
      issueDate: "",
      paymentTerms: "Net 30",
      status: "draft",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (invoice) {
      // Calculate subtotal from amount that includes VAT (remove 7.5% VAT)
      const subtotal = parseFloat(invoice.amount) / 1.075;
      
      form.reset({
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail || "",
        clientPhone: invoice.clientPhone || "",
        clientAddress: invoice.clientAddress || "",
        description: invoice.description,
        amount: subtotal.toString(),
        dueDate: format(new Date(invoice.dueDate), "yyyy-MM-dd"),
        issueDate: format(new Date(invoice.issueDate), "yyyy-MM-dd"),
        paymentTerms: invoice.paymentTerms,
        status: invoice.status,
      });
    }
  }, [invoice, form]);

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: EditInvoiceForm) => {
      // Update invoice only - add VAT back to amount
      const subtotal = parseFloat(data.amount);
      const totalWithVAT = subtotal * 1.075; // Add 7.5% VAT
      
      return apiRequest(`/api/invoices/${invoiceId}`, "PUT", {
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        clientAddress: data.clientAddress || null,
        description: data.description,
        amount: totalWithVAT.toString(),
        dueDate: new Date(data.dueDate).toISOString(),
        issueDate: new Date(data.issueDate).toISOString(),
        paymentTerms: data.paymentTerms,
        status: data.status,
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Updated",
        description: "Your invoice has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      setLocation(`/invoice/${invoiceId}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update invoice.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditInvoiceForm) => {
    updateInvoiceMutation.mutate(data);
  };

  const goToInvoiceView = () => {
    setLocation(`/invoice/${invoiceId}`);
  };

  if (invoiceLoading || !invoice) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Edit Invoice" showBack={true} backHref={`/invoice/${invoiceId}`} />
        <main className="pb-20 px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Edit Invoice" showBack={true} backHref={`/invoice/${invoiceId}`} />
      
      <main className="pb-20 px-4 py-6">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Invoice Header Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoice?.invoiceNumber || ""}
                  disabled
                  placeholder="INV-001"
                  data-testid="input-invoice-number"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Invoice number cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    {...form.register("clientName")}
                    placeholder="Client or Company Name"
                    data-testid="input-client-name"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    {...form.register("clientEmail")}
                    placeholder="client@company.com"
                    data-testid="input-client-email"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-sm text-destructive">{form.formState.errors.clientEmail.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input
                    id="clientPhone"
                    {...form.register("clientPhone")}
                    placeholder="+234 XXX XXX XXXX"
                    data-testid="input-client-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Invoice Status</Label>
                  <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as any)}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientAddress">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  {...form.register("clientAddress")}
                  placeholder="Client address (optional)"
                  rows={2}
                  data-testid="input-client-address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Service/Product Description *</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe the service or product provided..."
                  rows={3}
                  data-testid="input-description"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register("amount")}
                    placeholder="0.00"
                    data-testid="input-amount"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    {...form.register("issueDate")}
                    data-testid="input-issue-date"
                  />
                  {form.formState.errors.issueDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.issueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register("dueDate")}
                    data-testid="input-due-date"
                  />
                  {form.formState.errors.dueDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Select value={form.watch("paymentTerms")} onValueChange={(value) => form.setValue("paymentTerms", value)}>
                  <SelectTrigger data-testid="select-payment-terms">
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15 Days</SelectItem>
                    <SelectItem value="Net 30">Net 30 Days</SelectItem>
                    <SelectItem value="Net 60">Net 60 Days</SelectItem>
                    <SelectItem value="Net 90">Net 90 Days</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentTerms && (
                  <p className="text-sm text-destructive">{form.formState.errors.paymentTerms.message}</p>
                )}
              </div>

              {/* Amount Preview */}
              {form.watch("amount") && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Invoice Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatNaira(parseFloat(form.watch("amount") || "0"))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (7.5%):</span>
                      <span>{formatNaira(parseFloat(form.watch("amount") || "0") * 0.075)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatNaira(parseFloat(form.watch("amount") || "0") + (parseFloat(form.watch("amount") || "0") * 0.075))}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goToInvoiceView}
              className="flex-1"
              data-testid="button-view-invoice"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Invoice
            </Button>
            <Button
              type="submit"
              disabled={updateInvoiceMutation.isPending}
              className="flex-1"
              style={{backgroundColor: '#29A378'}}
              data-testid="button-save-invoice"
            >
              {updateInvoiceMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateInvoiceMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>

      <BottomNavigation />
    </div>
  );
}