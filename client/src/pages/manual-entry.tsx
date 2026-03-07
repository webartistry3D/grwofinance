import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft, Edit3, ShoppingCart, Home, Car, Utensils, Heart, Briefcase, Gamepad2, Shirt, Coffee, Zap, Package, Plane, Train, Film, Music, Book, Dumbbell, Stethoscope, GraduationCap, Wrench, Gift } from "lucide-react";
import { formatNaira, parseAmount, formatAmountInput } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Icon mapping function
const getCategoryIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    '🛒': ShoppingCart,
    '🏠': Home,
    '🚗': Car,
    '🍽️': Utensils,
    '❤️': Heart,
    '💼': Briefcase,
    '🎮': Gamepad2,
    '👕': Shirt,
    '☕': Coffee,
    '⚡': Zap,
    '📦': Package,
    '✈️': Plane,
    '🚆': Train,
    '🎬': Film,
    '🎵': Music,
    '📚': Book,
    '💪': Dumbbell,
    '🩺': Stethoscope,
    '🎓': GraduationCap,
    '🔧': Wrench,
    '🎁': Gift,
  };
  
  return iconMap[iconName] || Briefcase; // Default icon
};

// Form validation schema
const expenseSchema = z.object({
  merchant: z.string().min(1, "Merchant name is required"),
  categoryId: z.string().min(1, "Please select a category"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const cleanVal = val.replace(/[₦,\s]/g, '');
      return parseFloat(cleanVal) > 0;
    },
    "Amount must be greater than 0"
  ),
  vatRate: z.string().optional(),
  vatAmount: z.string().optional(),
  whtRate: z.string().optional(),
  whtAmount: z.string().optional(),
  netAmount: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional()
});

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.string().min(1, "Price is required").refine(
    (val) => parseAmount(val) > 0,
    "Price must be greater than 0"
  )
});

interface ExpenseItem {
  name: string;
  quantity: number;
  price: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function ManualEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [items, setItems] = useState<ExpenseItem[]>([
    { name: "", quantity: 1, price: "" }
  ]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle input focus to prevent keyboard blocking
  const handleInputFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      const scrollIntoView = () => {
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      };
      setTimeout(scrollIntoView, 100);
    }
  };

  useEffect(() => {
    document.addEventListener('focusin', handleInputFocus);
    return () => document.removeEventListener('focusin', handleInputFocus);
  }, []);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      merchant: "",
      categoryId: "",
      amount: "",
      vatRate: "7.5%",
      vatAmount: "",
      whtRate: "10%",
      whtAmount: "",
      netAmount: "",
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: ""
    }
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const response = await apiRequest('/api/expenses', 'POST', expenseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success!",
        description: "Manual expense entry saved successfully"
      });
      // Reset form and items
      form.reset();
      setItems([{ name: "", quantity: 1, price: "" }]);
      // Navigate back to expense manager
      setLocation('/expense-manager');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save expense entry",
        variant: "destructive"
      });
    }
  });

  // Add new item row
  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: "" }]);
  };

  // Remove item row
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculate total from items
  const calculateItemsTotal = () => {
    return items.reduce((total, item) => {
      if (item.name && item.price) {
        const itemPrice = parseAmount(item.price);
        return total + (itemPrice * item.quantity);
      }
      return total;
    }, 0);
  };

  // Auto-calculate amount when items change
  useEffect(() => {
    const itemsTotal = calculateItemsTotal();
    if (itemsTotal > 0) {
      form.setValue('amount', formatNaira(itemsTotal));
    }
  }, [items, form]);

  // Calculate WHT when amount or rate changes
  const calculateWHT = (amount: number, rate: string) => {
    const rateValue = parseFloat(rate.replace('%', '')) / 100;
    return amount * rateValue;
  };

  // Auto-calculate VAT and WHT when amount or rates change
  useEffect(() => {
    // Get the raw amount value and parse it correctly
    const rawAmount = form.watch('amount') || '0';
    const amount = parseAmount(rawAmount);
    const vatRate = form.watch('vatRate') || '7.5%';
    const whtRate = form.watch('whtRate') || '10%';
    
    // Calculate VAT
    const vatRateValue = parseFloat(vatRate.replace('%', '')) / 100;
    const vatAmount = amount * vatRateValue;
    
    // Calculate WHT
    const whtRateValue = parseFloat(whtRate.replace('%', '')) / 100;
    const whtAmount = amount * whtRateValue;
    
    // Calculate net amount (amount - WHT - VAT)
    const netAmount = amount - whtAmount + vatAmount;
    
    // Update form values
    if (amount > 0) {
      form.setValue('vatAmount', formatNaira(vatAmount));
      if (whtRate !== '0%') {
        form.setValue('whtAmount', formatNaira(whtAmount));
        form.setValue('netAmount', formatNaira(netAmount));
        
        // Force form to re-render and validate
        form.trigger(['whtAmount', 'netAmount', 'vatAmount']);
      } else {
        // Clear WHT fields when "No WHT" is selected
        form.setValue('whtAmount', '');
        form.setValue('netAmount', formatNaira(amount - vatAmount));
        form.trigger(['whtAmount', 'netAmount']);
      }
    } else {
      // Clear fields when amount is 0
      form.setValue('vatAmount', '');
      form.setValue('whtAmount', '');
      form.setValue('netAmount', '');
      form.trigger(['vatAmount', 'whtAmount', 'netAmount']);
    }
  }, [form.watch('amount'), form.watch('vatRate'), form.watch('whtRate')]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    // Filter out empty items
    const validItems = items.filter(item => item.name && item.price);
    
    // Find the selected category name
    const selectedCategory = categories.find(cat => cat.id === data.categoryId);
    
    const expenseData = {
      merchant: data.merchant,
      category: selectedCategory?.name || "Uncategorized",
      amount: parseAmount(data.amount).toString(),
      date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
      notes: data.notes || "",
      items: validItems.map(item => 
        `${item.name} (Qty: ${item.quantity}, Price: ${item.price})`
      ),
      // Add WHT and VAT details - parse currency values to plain numbers and convert percentages to decimals
      vatRate: (parseFloat(data.vatRate?.replace('%', '') || '0') / 100).toFixed(4),
      vatAmount: parseAmount(data.vatAmount || "0").toString(),
      whtRate: (parseFloat(data.whtRate?.replace('%', '') || '0') / 100).toFixed(4),
      whtAmount: parseAmount(data.whtAmount || "0").toString(),
      netAmount: parseAmount(data.netAmount || data.amount).toString()
    };

    await createExpenseMutation.mutateAsync(expenseData);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Manual Entry" showBack={true} backHref="/expense-manager" />
      
      <main className="pb-24 px-4 py-4" style={{ minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto">


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="merchant"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="merchant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Merchant Name
                        </label>
                        <FormControl>
                          <Input 
                            id="merchant"
                            placeholder="e.g., Shoprite, GTBank, Uber, etc."
                            {...field}
                            data-testid="input-merchant"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Category
                          </label>
                          <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger id="category" data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => {
                                const IconComponent = getCategoryIcon(category.icon);
                                return (
                                  <SelectItem key={category.id} value={category.id}>
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4" />
                                      <span>{category.name}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Date
                          </label>
                          <FormControl>
                            <Input 
                              id="date"
                              type="date"
                              {...field}
                              data-testid="input-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Total Amount (₦)
                        </label>
                        <FormControl>
                          <Input 
                            id="amount"
                            placeholder="Enter amount"
                            value={field.value ? formatAmountInput(field.value) : ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^0-9]/g, '');
                              if (rawValue === '') {
                                field.onChange("");
                              } else {
                                field.onChange(rawValue);
                              }
                            }}
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="vatRate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          VAT Rate
                        </label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="vatRate">
                            <SelectValue placeholder="Select VAT rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0%">No VAT</SelectItem>
                            <SelectItem value="7.5%">7.5%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vatAmount"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="vatAmount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          VAT Amount (₦)
                        </label>
                        <FormControl>
                          <Input 
                            id="vatAmount"
                            placeholder="VAT amount"
                            value={field.value || ""}
                            readOnly
                            data-testid="input-vat-amount"
                            onFocus={() => {
                              console.log('VAT Amount field focused. Current value:', field.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whtRate"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="whtRate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          WHT Rate
                        </label>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="whtRate">
                              <SelectValue placeholder="Select WHT rate" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0%">No WHT</SelectItem>
                              <SelectItem value="5%">5%</SelectItem>
                              <SelectItem value="10%">10%</SelectItem>
                              <SelectItem value="15%">15%</SelectItem>
                              <SelectItem value="20%">20%</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whtAmount"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="whtAmount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          WHT Amount (₦)
                        </label>
                        <FormControl>
                          <Input 
                            id="whtAmount"
                            placeholder="WHT amount"
                            value={field.value || ""}
                            readOnly
                            data-testid="input-wht-amount"
                            onChange={(e) => {
                              console.log('WHT Amount field onChange triggered:', e.target.value);
                              console.log('WHT Amount field value:', field.value);
                            }}
                            onFocus={() => {
                              console.log('WHT Amount field focused. Current value:', field.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="netAmount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Net Amount (₦)
                        </label>
                        <FormControl>
                          <Input 
                            id="netAmount"
                            placeholder="Net amount"
                            value={field.value || ""}
                            readOnly
                            data-testid="input-net-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Notes (Optional)
                        </label>
                        <FormControl>
                          <Textarea
                            id="notes"
                            placeholder="Add any additional notes about this expense..."
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Items Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Item Details (Optional)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          id={`item-name-${index}`}
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          data-testid={`input-item-name-${index}`}
                        />
                        <Input
                          id={`item-price-${index}`}
                          placeholder="₦Price"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value)}
                          data-testid={`input-item-price-${index}`}
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <Input
                            id={`item-quantity-${index}`}
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            data-testid={`input-item-quantity-${index}`}
                          />
                          <Input
                            placeholder="₦Price"
                            value={item.price}
                            onChange={(e) => {
                              // Store raw input during typing
                              updateItem(index, 'price', e.target.value);
                            }}
                            onBlur={(e) => {
                              // Format when user leaves the field
                              const value = e.target.value.replace(/[^\d.]/g, '');
                              if (value && parseFloat(value) > 0) {
                                updateItem(index, 'price', formatNaira(parseFloat(value)));
                              } else if (!value) {
                                updateItem(index, 'price', '');
                              }
                            }}
                            onFocus={(e) => {
                              // Remove formatting when user focuses
                              const value = parseAmount(e.target.value);
                              if (value > 0) {
                                updateItem(index, 'price', value.toString());
                              }
                            }}
                            data-testid={`input-item-price-${index}`}
                          />
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {calculateItemsTotal() > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Calculated Total:</span>
                        <span className="font-semibold">₦{calculateItemsTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation('/expense-manager')}
                  data-testid="button-cancel"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-save-expense"
                >
                  {createExpenseMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Expense
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}