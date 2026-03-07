import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FileText, Download, Send, Edit, Calendar, Mail, Phone } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  amount: string;
  description: string;
  dueDate: string;
  issueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  paymentTerms: string;
  createdAt: string;
}

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id;

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
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

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Invoice Details" showBack={true} backHref="/invoice-list" />
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
        <Header title="Invoice Details" showBack={true} backHref="/invoice-list" />
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
      <Header title="Invoice Details" showBack={true} backHref="/invoice-list" />
      
      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  {invoice.invoiceNumber}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600" data-testid="text-invoice-amount">
                  {formatNaira(parseFloat(invoice.amount))}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Client Name</label>
              <p className="font-semibold" data-testid="text-client-name">{invoice.clientName}</p>
            </div>
            
            {invoice.clientEmail && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p data-testid="text-client-email">{invoice.clientEmail}</p>
                </div>
              </div>
            )}
            
            {invoice.clientPhone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p data-testid="text-client-phone">{invoice.clientPhone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p data-testid="text-invoice-description">{invoice.description}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p data-testid="text-issue-date">{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p data-testid="text-due-date">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                <p data-testid="text-payment-terms">{invoice.paymentTerms}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-right">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600" data-testid="text-total-amount">
                    {formatNaira(parseFloat(invoice.amount))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            data-testid="button-edit-invoice"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Invoice
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            data-testid="button-download-invoice"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          {invoice.status === "draft" && (
            <Button 
              style={{backgroundColor: '#29A378'}} 
              className="flex-1"
              data-testid="button-send-invoice"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}