import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Calendar, 
  FileText, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Building,
  CreditCard
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";

interface TaxComplianceData {
  firsCompliance: {
    taxId: string;
    businessName: string;
    registrationNumber: string;
    taxOffice: string;
    taxCategory: string;
    filingFrequency: string;
    lastFilingDate: string;
    nextFilingDate: string;
    complianceStatus: string;
    outstandingReturns: number;
    totalTaxLiability: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    taxType: string;
    title: string;
    dueDate: string;
    daysUntilDue: number;
    status: string;
  }>;
  recentReports: Array<{
    id: string;
    reportType: string;
    title: string;
    generatedDate: string;
    status: string;
  }>;
  taxSummary: {
    totalVATCollected: number;
    totalVATPaid: number;
    totalWHTDeducted: number;
    totalWHTPaid: number;
    totalDeductibleExpenses: number;
    netTaxPosition: number;
  };
}

export default function TaxCompliance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [complianceData, setComplianceData] = useState<TaxComplianceData | null>(null);

  useEffect(() => {
    fetchComplianceData();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch("/api/tax/compliance/dashboard");
      const data = await response.json();
      setComplianceData(data);
    } catch (error) {
      console.error("Failed to fetch compliance data:", error);
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-200";
      case "non_compliant":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "non_compliant":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDeadlineStatusColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "bg-red-100 text-red-800";
    if (daysUntilDue <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getDeadlineStatusText = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Due Today";
    if (daysUntilDue <= 7) return `${daysUntilDue} days`;
    return `${daysUntilDue} days`;
  };

  // Show skeleton while auth is loading
  if (authLoading) {
    return <FullScreenSkeleton />;
  }

  if (!complianceData) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <div className="text-center py-20">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Loading tax compliance data...</p>
        </div>
      </div>
    );
  }

  const { firsCompliance, upcomingDeadlines, recentReports, taxSummary } = complianceData;

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <Shield className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
              Tax Compliance Center
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/tax-calendar")}>
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button variant="outline" onClick={() => setLocation("/tax-reports")}>
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-20 p-4 space-y-6">
        {/* FIRS Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              FIRS Compliance Status
            </CardTitle>
            <CardDescription>
              Your tax registration and filing compliance status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3">
                {getComplianceStatusIcon(firsCompliance.complianceStatus)}
                <div>
                  <h3 className="font-semibold">{firsCompliance.businessName}</h3>
                  <p className="text-sm text-muted-foreground">Tax ID: {firsCompliance.taxId}</p>
                </div>
              </div>
              <Badge className={getComplianceStatusColor(firsCompliance.complianceStatus)}>
                {firsCompliance.complianceStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="font-medium">{firsCompliance.registrationNumber}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tax Office</p>
                <p className="font-medium">{firsCompliance.taxOffice}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Filing Frequency</p>
                <p className="font-medium">{firsCompliance.filingFrequency}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tax Category</p>
                <p className="font-medium">{firsCompliance.taxCategory}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">Outstanding Returns</span>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{firsCompliance.outstandingReturns}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Next Filing</span>
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-lg font-bold text-yellow-600">
                  {new Date(firsCompliance.nextFilingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Total Liability</span>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-blue-600">{formatNaira(firsCompliance.totalTaxLiability)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Tax Position Summary
            </CardTitle>
            <CardDescription>
              Overview of your tax obligations and positions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-700">VAT Collected</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatNaira(taxSummary.totalVATCollected)}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700">VAT Paid</span>
                  <Receipt className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{formatNaira(taxSummary.totalVATPaid)}</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-700">Net VAT Position</span>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNaira(taxSummary.totalVATCollected - taxSummary.totalVATPaid)}
                </p>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-indigo-700">WHT Deducted</span>
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-indigo-600">{formatNaira(taxSummary.totalWHTDeducted)}</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-orange-700">WHT Paid</span>
                  <CreditCard className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{formatNaira(taxSummary.totalWHTPaid)}</p>
              </div>
              
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-teal-700">Deductible Expenses</span>
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-2xl font-bold text-teal-600">{formatNaira(taxSummary.totalDeductibleExpenses)}</p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Net Tax Position</span>
                <span className={`text-2xl font-bold ${taxSummary.netTaxPosition >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatNaira(Math.abs(taxSummary.netTaxPosition))}
                  {taxSummary.netTaxPosition >= 0 ? ' Payable' : ' Refundable'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Tax Deadlines
            </CardTitle>
            <CardDescription>
              Tax filing deadlines and payment due dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{deadline.taxType}</Badge>
                        <Badge className={getDeadlineStatusColor(deadline.daysUntilDue)}>
                          {getDeadlineStatusText(deadline.daysUntilDue)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{deadline.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Calendar className="w-4 h-4 mr-1" />
                        Remind
                      </Button>
                      <Button size="sm">
                        File Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Tax Reports
            </CardTitle>
            <CardDescription>
              Recently generated tax compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No reports generated yet</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocation("/tax-reports")}
                >
                  Generate First Report
                </Button>
              </div>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{report.reportType}</Badge>
                        <Badge variant={report.status === "downloaded" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Generated: {new Date(report.generatedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tax compliance tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => setLocation("/tax-calendar")}
              >
                <Calendar className="w-6 h-6 mb-2" />
                <span>View Calendar</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => setLocation("/wht-tracking")}
              >
                <Receipt className="w-6 h-6 mb-2" />
                <span>Track WHT</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => setLocation("/tax-receipts")}
              >
                <FileText className="w-6 h-6 mb-2" />
                <span>Organize Receipts</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => setLocation("/tax-reports")}
              >
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>Generate Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    <BottomNavigation />
  );
}
