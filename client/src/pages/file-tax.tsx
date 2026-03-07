import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Upload, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Save,
  Send,
  FileCheck,
  Calculator,
  Receipt,
  Building,
  TrendingUp,
  Edit
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";

interface TaxFiling {
  id: string;
  taxType: string;
  filingPeriod: string;
  filingDate: string;
  dueDate: string;
  status: 'draft' | 'submitted' | 'processed' | 'approved' | 'rejected';
  totalTax: number;
  vatCollected: number;
  vatPaid: number;
  whtDeducted: number;
  whtCredits: number;
  deductibleExpenses: number;
  netTaxPosition: number;
  attachments: string[];
  notes?: string;
  submittedDate?: string;
  processedDate?: string;
  rejectionReason?: string;
}

interface FilingFormData {
  taxType: string;
  filingPeriod: string;
  filingYear: string;
  filingMonth: string;
  vatCollected: string;
  vatPaid: string;
  whtDeducted: string;
  whtCredits: string;
  deductibleExpenses: string;
  attachments: File[];
  notes: string;
  confirmAccuracy: boolean;
}

export default function FileTax() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<TaxFiling | null>(null);
  const [filingForm, setFilingForm] = useState<FilingFormData>({
    taxType: "",
    filingPeriod: "",
    filingYear: new Date().getFullYear().toString(),
    filingMonth: (new Date().getMonth() + 1).toString(),
    vatCollected: "",
    vatPaid: "",
    whtDeducted: "",
    whtCredits: "",
    deductibleExpenses: "",
    attachments: [],
    notes: "",
    confirmAccuracy: false
  });

  // Fetch existing tax filings
  const { data: taxFilings = [], isLoading, error, refetch } = useQuery<TaxFiling[]>({
    queryKey: ['/api/tax/filings'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/filings", "GET");
      return response.json();
    },
    retry: false,
  });

  // Fetch tax summary for auto-population
  const { data: taxSummary } = useQuery({
    queryKey: ['/api/tax/compliance/dashboard'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/compliance/dashboard", "GET");
      return response.json();
    },
    retry: false,
  });

  // Submit tax filing mutation
  const submitFilingMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/tax/filings', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit tax filing');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Tax filing submitted successfully" });
      setShowFilingModal(false);
      setFilingForm({
        taxType: "",
        filingPeriod: "",
        filingYear: new Date().getFullYear().toString(),
        filingMonth: (new Date().getMonth() + 1).toString(),
        vatCollected: "",
        vatPaid: "",
        whtDeducted: "",
        whtCredits: "",
        deductibleExpenses: "",
        attachments: [],
        notes: "",
        confirmAccuracy: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tax/filings'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to submit tax filing", variant: "destructive" });
    },
  });

  // Auto-populate form with tax summary data
  useEffect(() => {
    if (taxSummary?.taxSummary) {
      const summary = taxSummary.taxSummary;
      setFilingForm(prev => ({
        ...prev,
        vatCollected: summary.totalVATCollected.toString(),
        vatPaid: summary.totalVATPaid.toString(),
        whtDeducted: summary.totalWHTDeducted.toString(),
        whtCredits: summary.totalWHTCredits.toString(),
        deductibleExpenses: summary.totalDeductibleExpenses.toString()
      }));
    }
  }, [taxSummary]);

  const handleSubmitFiling = () => {
    if (!filingForm.taxType || !filingForm.filingPeriod || !filingForm.confirmAccuracy) {
      toast({ title: "Error", description: "Please fill all required fields and confirm accuracy", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('taxType', filingForm.taxType);
    formData.append('filingPeriod', filingForm.filingPeriod);
    formData.append('filingYear', filingForm.filingYear);
    formData.append('filingMonth', filingForm.filingMonth);
    formData.append('vatCollected', filingForm.vatCollected);
    formData.append('vatPaid', filingForm.vatPaid);
    formData.append('whtDeducted', filingForm.whtDeducted);
    formData.append('whtCredits', filingForm.whtCredits);
    formData.append('deductibleExpenses', filingForm.deductibleExpenses);
    formData.append('notes', filingForm.notes);
    
    filingForm.attachments.forEach((file, index) => {
      formData.append(`attachment_${index}`, file);
    });

    submitFilingMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'submitted': return <Send className="w-4 h-4" />;
      case 'processed': return <Calculator className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateNetTax = () => {
    const vat = parseFloat(filingForm.vatCollected || '0') - parseFloat(filingForm.vatPaid || '0');
    const wht = parseFloat(filingForm.whtCredits || '0') - parseFloat(filingForm.whtDeducted || '0');
    const expenses = parseFloat(filingForm.deductibleExpenses || '0');
    return vat + wht - expenses;
  };

  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <Header title="File Tax" showBack={true} backHref="/tax-compliance" />
        <div className="text-center py-20">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Tax Filings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Failed to load tax filings. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="File Tax" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-4 py-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tax Filing Center</h1>
            <p className="text-muted-foreground">Manage and submit your tax filings</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showFilingModal} onOpenChange={setShowFilingModal}>
              <DialogTrigger asChild>
                <Button className="bg-[#29A378] hover:bg-[#29A378]/90">
                  <FileText className="w-4 h-4 mr-2" />
                  New Filing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Tax Filing</DialogTitle>
                  <DialogDescription>
                    Fill in the tax filing details and submit to the tax authorities.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Tax Type and Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tax Type</Label>
                      <Select value={filingForm.taxType} onValueChange={(value) => setFilingForm({...filingForm, taxType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vat">VAT Return</SelectItem>
                          <SelectItem value="wht">WHT Return</SelectItem>
                          <SelectItem value="income-tax">Income Tax</SelectItem>
                          <SelectItem value="company-tax">Company Income Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Filing Period</Label>
                      <Select value={filingForm.filingPeriod} onValueChange={(value) => setFilingForm({...filingForm, filingPeriod: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Year and Month */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={filingForm.filingYear} onValueChange={(value) => setFilingForm({...filingForm, filingYear: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select value={filingForm.filingMonth} onValueChange={(value) => setFilingForm({...filingForm, filingMonth: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                            <SelectItem key={month} value={(index + 1).toString()}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tax Figures */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Tax Figures</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>VAT Collected</Label>
                        <Input
                          type="number"
                          value={filingForm.vatCollected}
                          onChange={(e) => setFilingForm({...filingForm, vatCollected: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>VAT Paid</Label>
                        <Input
                          type="number"
                          value={filingForm.vatPaid}
                          onChange={(e) => setFilingForm({...filingForm, vatPaid: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>WHT Deducted</Label>
                        <Input
                          type="number"
                          value={filingForm.whtDeducted}
                          onChange={(e) => setFilingForm({...filingForm, whtDeducted: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>WHT Credits</Label>
                        <Input
                          type="number"
                          value={filingForm.whtCredits}
                          onChange={(e) => setFilingForm({...filingForm, whtCredits: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label>Deductible Expenses</Label>
                        <Input
                          type="number"
                          value={filingForm.deductibleExpenses}
                          onChange={(e) => setFilingForm({...filingForm, deductibleExpenses: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {/* Net Tax Calculation */}
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Net Tax Position:</span>
                        <span className="text-lg font-bold text-[#29A378]">
                          {formatNaira(calculateNetTax())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label>Attachments (Optional)</Label>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => setFilingForm({...filingForm, attachments: Array.from(e.target.files || [])})}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#29A378] file:text-white hover:file:bg-[#29A378]/90"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload supporting documents (PDF, Excel, images)
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={filingForm.notes}
                      onChange={(e) => setFilingForm({...filingForm, notes: e.target.value})}
                      placeholder="Add any additional notes or explanations..."
                      rows={3}
                    />
                  </div>

                  {/* Confirmation */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirm-accuracy"
                      checked={filingForm.confirmAccuracy}
                      onCheckedChange={(checked) => setFilingForm({...filingForm, confirmAccuracy: checked as boolean})}
                    />
                    <Label htmlFor="confirm-accuracy" className="text-sm">
                      I confirm that all information provided is accurate and complete
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowFilingModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitFiling}
                    disabled={submitFilingMutation.isPending || !filingForm.confirmAccuracy}
                    className="bg-[#29A378] hover:bg-[#29A378]/90"
                  >
                    {submitFilingMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Filing
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tax Filings List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Tax Filings</h2>
          
          {taxFilings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tax Filings Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by submitting your first tax filing.
                </p>
                <Button onClick={() => setShowFilingModal(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create First Filing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {taxFilings.map((filing) => (
                <Card key={filing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">{filing.taxType.toUpperCase()}</h3>
                          <Badge className={getStatusColor(filing.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(filing.status)}
                              {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Period:</span>
                            <p className="font-medium">{filing.filingPeriod}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Filing Date:</span>
                            <p className="font-medium">{new Date(filing.filingDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <p className="font-medium">{new Date(filing.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Tax:</span>
                            <p className="font-medium text-[#29A378]">{formatNaira(filing.totalTax)}</p>
                          </div>
                        </div>

                        {filing.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {filing.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFiling(filing)}
                        >
                          <FileCheck className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {filing.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/file-tax/${filing.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Filings</p>
                  <p className="text-2xl font-bold">{taxFilings.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {taxFilings.filter(f => ['draft', 'submitted', 'processed'].includes(f.status)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {taxFilings.filter(f => f.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
