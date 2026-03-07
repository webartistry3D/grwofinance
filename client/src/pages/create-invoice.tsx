import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { CalendarIcon, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatNaira, formatAmountInput, parseAmount } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [issueDate, setIssueDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    notes: "",
    paymentTerms: "Due on receipt",
    taxRate: "7.5" // VAT rate in Nigeria
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/invoices", "POST", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Invoice Created Successfully",
        description: `Invoice ${formData.invoiceNumber} for ${formatNaira(calculateTotal())} has been created`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income/stats"] });
      setLocation("/income-manager");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Invoice",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          console.log('Item updated:', { id, field, value, updatedItem }); // Debug log
          return updatedItem;
        }
        return item;
      });
      return newItems;
    });
    
    // Clear items field error when user updates an item
    if (fieldErrors.items && field === 'description' && value.toString().trim()) {
      setFieldErrors(prev => ({ ...prev, items: false }));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (Number(formData.taxRate) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const validateForm = () => {
    const errors: string[] = [];
    const fields: Record<string, boolean> = {};
    
    // Only check for validation errors, don't modify any form data
    if (!formData.clientName.trim()) {
      errors.push("Client name is required");
      fields.clientName = true;
    }
    if (!issueDate) {
      errors.push("Issue date is required");
      fields.issueDate = true;
    }
    if (!dueDate) {
      errors.push("Due date is required");
      fields.dueDate = true;
    }
    if (items.some(item => !item.description.trim())) {
      errors.push("All items must have a description");
      fields.items = true;
    }
    if (calculateTotal() <= 0) {
      errors.push("Invoice total must be greater than zero");
      fields.total = true;
    }
    
    // Only update error states, preserve all form data
    setValidationErrors(errors);
    setFieldErrors(fields);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all fields marked with *",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const vatAmount = calculateTax();
    const totalAmount = calculateTotal();

    const invoiceData = {
      invoiceNumber: formData.invoiceNumber,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail || null,
      clientPhone: null, // Will be added later if needed
      clientAddress: formData.clientAddress || null,
      amount: totalAmount.toString(),
      netAmount: subtotal.toString(), // Amount before VAT
      vatAmount: vatAmount.toString(), // VAT collected
      vatRate: formData.taxRate, // VAT rate
      vatPaid: "0", // VAT not yet paid to authority
      description: items.map(item => `${item.quantity}x ${item.description} @ ${formatNaira(item.rate)}`).join('; '),
      dueDate: dueDate,
      issueDate: issueDate,
      status: "draft",
      paymentTerms: formData.paymentTerms
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const handleInputChange = (field: string, value: string) => {
    // Preserve all existing form data, only update the specific field
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Form data updated:', { field, value, newData }); // Debug log
      return newData;
    });
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Create Invoice" showBack={true} backHref="/income-manager" />
      
      <main className="pb-20 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              New Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                    data-testid="input-invoice-number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={fieldErrors.issueDate ? "text-red-500" : ""}>
                    Issue Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          fieldErrors.issueDate ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        data-testid="button-issue-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate}
                        onSelect={(date) => {
                          setIssueDate(date);
                          if (fieldErrors.issueDate) {
                            setFieldErrors(prev => ({ ...prev, issueDate: false }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.issueDate && (
                    <p className="text-sm text-red-500">Issue date is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={fieldErrors.dueDate ? "text-red-500" : ""}>
                    Due Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          fieldErrors.dueDate ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        data-testid="button-due-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          if (fieldErrors.dueDate) {
                            setFieldErrors(prev => ({ ...prev, dueDate: false }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.dueDate && (
                    <p className="text-sm text-red-500">Due date is required</p>
                  )}
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className={fieldErrors.clientName ? "text-red-500" : ""}>
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      placeholder="ABC Company Ltd"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
                      data-testid="input-client-name"
                      className={fieldErrors.clientName ? "border-red-500 focus:ring-red-500" : ""}
                    />
                    {fieldErrors.clientName && (
                      <p className="text-sm text-red-500">Client name is required</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@company.com"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                      data-testid="input-client-email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    placeholder="Client address..."
                    value={formData.clientAddress}
                    onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                    data-testid="textarea-client-address"
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Items/Services</h3>
                  <Button type="button" onClick={addItem} size="sm" data-testid="button-add-item">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5">
                          <Label className={fieldErrors.items && !item.description.trim() ? "text-red-500" : ""}>
                            Description *
                          </Label>
                          <Input
                            placeholder="Service/item description"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            data-testid={`input-item-description-${index}`}
                            className={fieldErrors.items && !item.description.trim() ? "border-red-500 focus:ring-red-500" : ""}
                          />
                          {fieldErrors.items && !item.description.trim() && (
                            <p className="text-sm text-red-500">Description is required</p>
                          )}
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                            data-testid={`input-item-quantity-${index}`}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Rate (₦)</Label>
                          <Input
                            placeholder="0.00"
                            value={item.rate > 0 ? formatAmountInput(item.rate.toString()) : ""}
                            onChange={(e) => {
                              const formatted = formatAmountInput(e.target.value);
                              const cleaned = parseAmount(formatted);
                              updateItem(item.id, "rate", cleaned);
                            }}
                            data-testid={`input-item-rate-${index}`}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Amount</Label>
                          <Input
                            value={formatNaira(item.amount)}
                            disabled
                            data-testid={`text-item-amount-${index}`}
                          />
                        </div>
                        
                        <div className="md:col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span data-testid="text-subtotal">{formatNaira(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({formData.taxRate}%):</span>
                    <span data-testid="text-tax">{formatNaira(calculateTax())}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600" data-testid="text-total">{formatNaira(calculateTotal())}</span>
                  </div>
                </div>
              </Card>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange("paymentTerms", value)}>
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
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  data-testid="textarea-notes"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/income-manager")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#29A378] hover:bg-[#238c68]"
                  data-testid="button-create"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}