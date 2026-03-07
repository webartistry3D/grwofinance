import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Plus, Upload, Tag, Calendar, Search, Filter, Download, Eye } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";

interface TaxReceipt {
  id: string;
  expenseId?: string;
  invoiceId?: string;
  receiptType: string;
  title: string;
  description?: string;
  amount: number;
  taxAmount?: number;
  date: string;
  category: string;
  imageUrl?: string;
  fileUrl?: string;
  tags?: string[];
  isDeductible: boolean;
  taxYear: string;
}

export default function TaxReceipts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [formData, setFormData] = useState({
    receiptType: "vat_invoice",
    title: "",
    description: "",
    amount: "",
    taxAmount: "",
    date: new Date().toISOString().split('T')[0],
    category: "input_vat",
    tags: "",
    isDeductible: true,
    taxYear: new Date().getFullYear().toString()
  });

  // Fetch tax receipts using React Query
  const { data: taxReceipts = [], isLoading, error } = useQuery<TaxReceipt[]>({
    queryKey: ['/api/tax/receipts'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/receipts", "GET");
      return response.json();
    },
    retry: false,
  });

  // Create tax receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (receiptData: any) => {
      const response = await apiRequest("/api/tax/receipts", "POST", receiptData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tax receipt added",
        description: "Your tax receipt has been organized successfully",
      });
      setShowAddModal(false);
      setFormData({
        receiptType: "vat_invoice",
        title: "",
        description: "",
        amount: "",
        taxAmount: "",
        date: new Date().toISOString().split('T')[0],
        category: "input_vat",
        tags: "",
        isDeductible: true,
        taxYear: new Date().getFullYear().toString()
      });
      // Invalidate and refetch receipts
      queryClient.invalidateQueries({ queryKey: ['/api/tax/receipts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add tax receipt",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const receiptData = {
      receiptType: formData.receiptType,
      title: formData.title,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : null,
      date: formData.date,
      category: formData.category,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      isDeductible: formData.isDeductible,
      taxYear: formData.taxYear
    };

    createReceiptMutation.mutate(receiptData);
  };

  const getReceiptTypeColor = (receiptType: string) => {
    switch (receiptType) {
      case "vat_invoice":
        return "bg-blue-100 text-blue-800";
      case "wht_certificate":
        return "bg-purple-100 text-purple-800";
      case "tax_payment":
        return "bg-green-100 text-green-800";
      case "deductible_expense":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "input_vat":
        return "bg-blue-50 text-blue-700";
      case "output_vat":
        return "bg-green-50 text-green-700";
      case "wht_deducted":
        return "bg-purple-50 text-purple-700";
      case "wht_paid":
        return "bg-indigo-50 text-indigo-700";
      case "deductible":
        return "bg-orange-50 text-orange-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getReceiptTypeLabel = (receiptType: string) => {
    switch (receiptType) {
      case "vat_invoice":
        return "VAT Invoice";
      case "wht_certificate":
        return "WHT Certificate";
      case "tax_payment":
        return "Tax Payment";
      case "deductible_expense":
        return "Deductible Expense";
      default:
        return receiptType;
    }
  };

  // Filter receipts
  const filteredReceipts = taxReceipts.filter(receipt => {
    const matchesSearch = receipt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.description && receipt.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (receipt.tags && receipt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesCategory = filterCategory === "all" || receipt.category === filterCategory;
    const matchesYear = filterYear === "all" || receipt.taxYear === filterYear;
    
    return matchesSearch && matchesCategory && matchesYear;
  });

  // Show skeleton while auth is loading or data is loading
  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <div className="text-center py-20">
          <Receipt className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error instanceof Error ? error.message : "Failed to load tax receipts"}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tax/receipts'] })}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalDeductible = taxReceipts
    .filter(receipt => receipt.isDeductible)
    .reduce((sum, receipt) => sum + receipt.amount, 0);

  const totalTaxAmount = taxReceipts
    .reduce((sum, receipt) => sum + (receipt.taxAmount || 0), 0);

  const receiptTypes = [
    { value: "vat_invoice", label: "VAT Invoice" },
    { value: "wht_certificate", label: "WHT Certificate" },
    { value: "tax_payment", label: "Tax Payment Receipt" },
    { value: "deductible_expense", label: "Deductible Expense" }
  ];

  const categories = [
    { value: "input_vat", label: "Input VAT" },
    { value: "output_vat", label: "Output VAT" },
    { value: "wht_deducted", label: "WHT Deducted" },
    { value: "wht_paid", label: "WHT Paid" },
    { value: "deductible", label: "Deductible" }
  ];

  const currentYear = new Date().getFullYear();
  const years = ["all", ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Tax Receipts" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Receipts</p>
                  <p className="text-2xl font-bold text-primary">{taxReceipts.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deductible Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatNaira(totalDeductible)}</p>
                </div>
                <Tag className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tax</p>
                  <p className="text-2xl font-bold text-blue-600">{formatNaira(totalTaxAmount)}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Receipt Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Organize Receipts
              </div>
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Tax Receipt</DialogTitle>
                    <DialogDescription>
                      Organize a receipt for tax purposes
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="receiptType">Receipt Type</Label>
                        <Select value={formData.receiptType} onValueChange={(value) => setFormData({ ...formData, receiptType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {receiptTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Receipt title or description"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Additional details"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="taxAmount">Tax Amount</Label>
                        <Input
                          id="taxAmount"
                          type="number"
                          placeholder="0.00"
                          value={formData.taxAmount}
                          onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxYear">Tax Year</Label>
                        <Select value={formData.taxYear} onValueChange={(value) => setFormData({ ...formData, taxYear: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year === "all" ? "All Years" : year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        placeholder="business, travel, supplies"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isDeductible"
                        checked={formData.isDeductible}
                        onCheckedChange={(checked) => setFormData({ ...formData, isDeductible: checked as boolean })}
                      />
                      <Label htmlFor="isDeductible">Tax deductible expense</Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createReceiptMutation.isPending} className="flex-1">
                        {createReceiptMutation.isPending ? "Adding..." : "Add Receipt"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Upload and organize receipts for tax deductions and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {receiptTypes.map((type) => (
                <div key={type.value} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-sm">{type.label}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type.value === "vat_invoice" && "VAT invoices for input tax claims"}
                    {type.value === "wht_deducted" && "WHT deduction certificates"}
                    {type.value === "wht_paid" && "WHT payment receipts"}
                    {type.value === "deductible" && "General deductible expenses"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search receipts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year === "all" ? "All Years" : year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Organized Tax Receipts
            </CardTitle>
            <CardDescription>
              Manage your tax-deductible receipts and documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>{taxReceipts.length === 0 ? "No tax receipts organized yet" : "No receipts match your filters"}</p>
                <p className="text-sm mt-2">
                  {taxReceipts.length === 0 ? "Add your first tax receipt to get started" : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
                <div key={receipt.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getReceiptTypeColor(receipt.receiptType)}>
                          {getReceiptTypeLabel(receipt.receiptType)}
                        </Badge>
                        <Badge className={getCategoryColor(receipt.category)}>
                          {receipt.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {receipt.isDeductible && (
                          <Badge variant="outline">Deductible</Badge>
                        )}
                        <Badge variant="secondary">{receipt.taxYear}</Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-1">{receipt.title}</h3>
                      {receipt.description && (
                        <p className="text-sm text-muted-foreground mb-2">{receipt.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-medium">{formatNaira(receipt.amount)}</p>
                        </div>
                        {receipt.taxAmount && (
                          <div>
                            <span className="text-muted-foreground">Tax Amount:</span>
                            <p className="font-medium text-primary">{formatNaira(receipt.taxAmount)}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{new Date(receipt.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {receipt.tags && receipt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {receipt.tags.map((tag, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {receipt.imageUrl && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      {receipt.fileUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
