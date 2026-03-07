import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FileText, Download, Send, Edit, Upload, ArrowLeft, Calendar, Mail, Phone, Building2, ChevronDown, MessageCircle, X, History } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
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
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  isDefault: boolean;
  includeInInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDocument() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const invoiceId = params.id;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Get bank accounts to find default for invoice
  const { data: bankAccountsData } = useQuery<BankAccount[]>({
    queryKey: ['/api', 'bank-accounts'],
  });

  // Find default bank account
  const defaultBankAccount = bankAccountsData?.find(account => account.isDefault);

  // Get user settings for business info
  const { data: userSettings } = useQuery({
    queryKey: ['/api/user/settings'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const handleEdit = () => {
    setLocation(`/edit-invoice/${invoiceId}`);
  };

  const handleSave = async () => {
    if (!editedInvoice) return;
    
    try {
      // Save invoice logic would go here
      setIsEditing(false);
      // Refetch invoice data
    } catch (error) {
      console.error("Failed to save invoice:", error);
    }
  };

  const handleCancel = () => {
    setEditedInvoice(null);
    setIsEditing(false);
  };

  // Send functions
  const handleSendEmail = () => {
    if (!invoice?.clientEmail) {
      alert('No email address available for this client');
      return;
    }
    
    // Generate PDF first
    window.print();
    
    // Wait a moment for PDF to be ready, then open Gmail
    setTimeout(() => {
      // Create email content
      const subject = `Invoice ${invoice.invoiceNumber} from ${(userSettings as any)?.businessName || 'Your Business'}`;
      const body = `Dear ${invoice.clientName},

Please find attached invoice ${invoice.invoiceNumber} for the amount of ${formatNaira(parseFloat(invoice.amount))}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ${formatNaira(parseFloat(invoice.amount))}
- Due Date: ${format(new Date(invoice.dueDate), "MMMM dd, yyyy")}
- Description: ${invoice.description}

📎 Please attach the invoice PDF that was just generated to this email.

You can also view the full invoice online at: ${window.location.href}

Best regards,
${(userSettings as any)?.businessName || 'Your Business'}
${(userSettings as any)?.email || 'your-email@example.com'}
${(userSettings as any)?.phone || 'your-phone-number'}`;
      
      // Create Gmail link
      const gmailLink = `https://mail.google.com/mail/?view=cm&to=${invoice.clientEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open Gmail
      window.open(gmailLink, '_blank');
    }, 500); // Wait 500ms for print dialog to be ready
  };

  const handleSendWhatsApp = () => {
    // Open WhatsApp modal
    setWhatsappModalOpen(true);
    // Pre-fill with client phone if available
    if (invoice?.clientPhone) {
      setWhatsappNumber(invoice.clientPhone);
    }
  };

  const handleWhatsAppSend = () => {
    if (!whatsappNumber.trim()) {
      alert('Please enter a WhatsApp number');
      return;
    }
    
    // Generate PDF first
    window.print();
    
    // Wait for PDF to be ready, then open WhatsApp
    setTimeout(() => {
      // Create WhatsApp message
      const message = `Hello ${invoice?.clientName},\n\nPlease find invoice ${invoice?.invoiceNumber} for ${formatNaira(parseFloat(invoice?.amount || "0"))}.\n\nDue: ${format(new Date(invoice?.dueDate || new Date()), "MMMM dd, yyyy")}.\n\n📎 Please attach the invoice PDF that was just generated to this message.\n\nYou can also view the full invoice online at: ${window.location.href}\n\nThank you!`;
      
      // Clean phone number (remove non-digits and country code if present)
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      
      // Create WhatsApp link
      const whatsappLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappLink, '_blank');
    }, 500); // Wait 500ms for print dialog to be ready
    
    // Close modal
    setWhatsappModalOpen(false);
    setWhatsappNumber("");
  };

  const handleMarkAsSent = async () => {
    try {
      const response = await apiRequest(`/api/invoices/${invoiceId}`, "PUT", {
        status: "sent"
      });
      
      if (response.ok) {
        // Invalidate and refetches invoice data
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
        
        // Show success modal instead of alert
        setLocation('/invoice-list?message=Invoice marked as sent successfully!');
      } else {
        alert('Failed to mark invoice as sent');
      }
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      alert('Failed to mark invoice as sent');
    }
  };

  const calculateSubtotal = () => {
    // The invoice.amount includes VAT, so extract the base amount
    const totalWithVAT = parseFloat(invoice?.amount || "0");
    return totalWithVAT / 1.075; // Remove 7.5% VAT to get base amount
  };

  const calculateVAT = (subtotal: number) => {
    return subtotal * 0.075; // 7.5% VAT for Nigeria
  };

  const calculateTotal = () => {
    // Return the stored invoice amount (which includes VAT)
    return parseFloat(invoice?.amount || "0");
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Invoice Document" showBack={true} backHref="/invoice-list" />
        <main className="pb-20 px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Invoice Document" showBack={true} backHref="/invoice-list" />
        <main className="pb-20 px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Invoice Not Found</h3>
              <p className="text-muted-foreground">This invoice could not be found or you don't have access to it.</p>
              <Link href="/invoice-list">
                <Button variant="outline" className="mt-4">
                  Back to Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      {/* Header - Hidden in print */}
      <div className="print:hidden">
        <Header title="Invoice Document" showBack={true} backHref="/invoice-list" />
      </div>
      
      <main className="pb-20 px-4 py-6 print:pb-0 print:px-0 print:py-0">
        {/* Action Buttons - Hidden in print */}
        <div className="flex flex-wrap gap-2 mb-6 print:hidden">
          <Link href="/invoice-list">
            <Button variant="outline" size="sm" className="flex-1 min-w-[100px]">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          
          <Link href="/income-history">
            <Button variant="outline" size="sm" className="flex-1 min-w-[100px]">
              <History className="h-4 w-4 mr-1" />
              Income History
            </Button>
          </Link>
          
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 min-w-[100px]">
            <Upload className="h-4 w-4 mr-1" />
            Logo
          </Button>
          
          <Button variant="outline" size="sm" onClick={printInvoice} className="flex-1 min-w-[100px]">
            <Download className="h-4 w-4 mr-1" />
            Print
          </Button>
          
          {invoice.status === "draft" && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1 min-w-[100px]">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button style={{backgroundColor: '#29A378'}} size="sm" className="flex-1 min-w-[100px]">
                    <Send className="h-4 w-4 mr-1" />
                    Send
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 print:hidden">
                  <DropdownMenuItem onClick={handleSendEmail} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendWhatsApp} className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkAsSent} className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950">
                    <Send className="h-4 w-4 mr-2" />
                    Mark as Sent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {invoice.status === "sent" && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1 min-w-[100px]" disabled>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 min-w-[100px]">
                Cancel
              </Button>
              <Button onClick={handleSave} style={{backgroundColor: '#29A378'}}>
                Save Changes
              </Button>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {/* Invoice Document - Always light mode */}
        <Card className="max-w-4xl mx-auto print:shadow-none print:border-none bg-white text-black">
          <CardContent className="p-8 print:p-6 bg-white text-black">
            {/* Header Section */}
            <div className="mb-8">
              {/* Single Row - Logo, Invoice Info, and Dates */}
              <div className="flex flex-col md:flex-row md:justify-between print:flex-row print:justify-between items-start gap-4">
                {/* Left Side - Invoice Number & Status */}
                <div className="text-left">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{color: '#29A378'}}>
                    {(userSettings as any)?.businessName || "INVOICE"}
                  </h1>
                  <p className="text-base md:text-lg font-semibold text-black mb-2">{invoice.invoiceNumber}</p>
                  <Badge className={`${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Center - Logo */}
                <div className="flex justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="h-24 md:h-32 w-auto" />
                  ) : (
                    <div className="print:hidden">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-24 w-48 md:h-32 md:w-64 border-dashed border-2 text-xs md:text-sm"
                      >
                        <Upload className="h-6 w-6 md:h-8 md:w-8 mr-2" />
                        Add Logo
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Right Side - Dates */}
                <div className="text-left md:text-right print:text-right">
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Created:</strong> {format(new Date(invoice.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    <p><strong>Issue Date:</strong> {format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
                    <p><strong>Due Date:</strong> {format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company & Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-8">
              {/* Bill To Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{color: '#29A378'}}>Bill To:</h3>
                <div className="space-y-2">
                  <p className="font-semibold flex items-center gap-2 text-black">
                    <Building2 className="h-4 w-4" />
                    {invoice.clientName}
                  </p>
                  
                  {invoice.clientAddress && (
                    <p className="text-sm text-gray-600">
                      {invoice.clientAddress}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {invoice.clientEmail && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {invoice.clientEmail}
                      </p>
                    )}
                    
                    {invoice.clientPhone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {invoice.clientPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* From Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{color: '#29A378'}}>From:</h3>
                <div className="space-y-2">
                  <p className="font-semibold text-black">Your Business Name</p>
                  <p className="text-sm text-gray-600">
                    Your Business Address<br />
                    City, State ZIP<br />
                    Country
                  </p>
                  <div className="text-sm text-gray-600">
                    <p>Email: your@business.com</p>
                    <p>Phone: +234 XXX XXX XXXX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{color: '#29A378'}}>Services/Items:</h3>
              
              {/* Mobile View - Card Layout */}
              <div className="md:hidden print:hidden space-y-4">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="font-semibold text-black">{item.description}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Qty: {item.quantity}</div>
                        <div className="text-right">Rate: {formatNaira(item.rate)}</div>
                      </div>
                      <div className="text-right font-semibold text-black">
                        Amount: {formatNaira(item.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold text-black">{invoice.description}</div>
                    <div className="text-right font-semibold text-black">
                      Amount: {formatNaira(parseFloat(invoice.amount))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop View - Table Layout */}
              <div className="hidden md:block print:block border rounded-lg overflow-hidden border-gray-300">
                <div className="bg-gray-100 grid grid-cols-12 gap-4 p-4 font-semibold text-sm text-black">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                
                <Separator />
                
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <div key={index}>
                      <div className="grid grid-cols-12 gap-4 p-4 text-sm text-black">
                        <div className="col-span-6">{item.description}</div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-right">{formatNaira(item.rate)}</div>
                        <div className="col-span-2 text-right font-semibold">{formatNaira(item.amount)}</div>
                      </div>
                      {invoice.items && index < invoice.items.length - 1 && <Separator />}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-black">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">{invoice.description}</div>
                      <div className="col-span-2 text-center">1</div>
                      <div className="col-span-2 text-right">{formatNaira(calculateSubtotal())}</div>
                      <div className="col-span-2 text-right font-semibold">{formatNaira(calculateSubtotal())}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8 mt-2">
              <div className="w-full md:w-1/2 space-y-1">
                <div className="flex justify-between py-1 text-black">
                  <span>Subtotal:</span>
                  <span>{formatNaira(calculateSubtotal())}</span>
                </div>
                
                <div className="flex justify-between py-1 text-black">
                  <span>VAT (7.5%):</span>
                  <span>{formatNaira(calculateVAT(calculateSubtotal()))}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between py-2 text-xl font-bold text-black">
                  <span>Total:</span>
                  <span>{formatNaira(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-3 mt-2">
              <h3 className="text-lg font-semibold mb-1" style={{color: '#29A378'}}>Payment Terms:</h3>
              <p className="text-sm text-gray-600">{invoice.paymentTerms}</p>
            </div>

            {/* Bank Details */}
            {defaultBankAccount && defaultBankAccount.includeInInvoice && (
              <div className="mb-3">
                <div className="border-t pt-3 border-gray-300"></div>
                <h3 className="text-lg font-semibold mb-1" style={{color: '#29A378'}}>Bank Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Bank:</strong> {defaultBankAccount.bankName}</p>
                  <p><strong>Account Name:</strong> {defaultBankAccount.accountName}</p>
                  <p><strong>Account Number:</strong> {defaultBankAccount.accountNumber}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border-t pt-1 border-gray-300">
              <h3 className="text-lg font-semibold mb-1" style={{color: '#29A378'}}>Notes:</h3>
              <p className="text-sm text-gray-600">
                Thank you for your business! Please ensure payment is made by the due date above.
                For any questions regarding this invoice, please contact us at the information provided above.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-xs text-gray-500 border-gray-300">
              <p>Generated by GrwoFinance • Invoice created on {format(new Date(invoice.createdAt), "MMM dd, yyyy")}</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="print:hidden">
        <BottomNavigation />
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-none {
            border: none !important;
          }
          
          .print\\:pb-0 {
            padding-bottom: 0 !important;
          }
          
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
        }
      `}</style>

      {/* WhatsApp Modal */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md print:hidden">
          <DialogHeader>
            <DialogTitle>Send Invoice via WhatsApp</DialogTitle>
            <DialogDescription>
              Enter the WhatsApp number to send this invoice to. The invoice PDF will be generated first, then WhatsApp will open for you to attach the file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="whatsapp-number" className="text-sm font-medium">
                WhatsApp Number
              </label>
              <Input
                id="whatsapp-number"
                type="tel"
                placeholder="+234 800 000 0000"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +234 for Nigeria)
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Process:</strong> PDF will be generated first, then WhatsApp opens. Attach the PDF to your message manually.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setWhatsappModalOpen(false);
                setWhatsappNumber("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWhatsAppSend}
              style={{ backgroundColor: '#25D366' }}
              className="text-white hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}