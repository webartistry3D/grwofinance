import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  CreditCard,
  Edit,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Calculator,
  Settings,
  Crown
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { Header } from "@/components/header";

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
    totalWHTCredits: number;
    totalDeductibleExpenses: number;
    netTaxPosition: number;
  };
}

// Compliance Status Component with Live Data Indicator
const ComplianceStatusCard = ({ compliance, isLoading, lastUpdated }: { 
  compliance: TaxComplianceData['firsCompliance']; 
  isLoading?: boolean;
  lastUpdated?: Date;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(compliance);
  const { toast } = useToast();

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
        return <ArrowLeft className="w-5 h-5 text-green-600" />;
    }
  };

  const handleSave = async () => {
    try {
      const response = await apiRequest("/api/tax/firs-compliance", "POST", editForm);
      const updatedCompliance = await response.json();
      setIsEditing(false);
      
      toast({
        title: "FIRS Compliance Updated",
        description: "Your compliance information has been updated successfully.",
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update compliance information. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card data-testid="firs-compliance-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            FIRS Compliance Status
            {isLoading ? (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Your tax registration and filing compliance status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, businessName: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax ID</label>
                <input
                  type="text"
                  value={editForm.taxId || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, taxId: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                  placeholder="Enter tax ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Registration Number</label>
                <input
                  type="text"
                  value={editForm.registrationNumber || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, registrationNumber: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                  placeholder="Enter registration number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Office</label>
                <input
                  type="text"
                  value={editForm.taxOffice || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, taxOffice: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                  placeholder="Enter tax office"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Category</label>
                <select
                  value={editForm.taxCategory || 'individual'}
                  onChange={(e) => setEditForm(prev => ({...prev, taxCategory: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filing Frequency</label>
                <select
                  value={editForm.filingFrequency || 'monthly'}
                  onChange={(e) => setEditForm(prev => ({...prev, filingFrequency: e.target.value}))}
                  className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(compliance);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                {getComplianceStatusIcon(compliance.complianceStatus)}
                <div>
                  <h3 className="font-semibold">{compliance.businessName}</h3>
                  <p className="text-sm text-muted-foreground">Tax ID: {compliance.taxId}</p>
                </div>
              </div>
              <Badge className={getComplianceStatusColor(compliance.complianceStatus)} data-testid="compliance-status">
                {compliance.complianceStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="font-medium">{compliance.registrationNumber}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tax Office</p>
                <p className="font-medium">{compliance.taxOffice}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Filing Frequency</p>
                <p className="font-medium">{compliance.filingFrequency}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tax Category</p>
                <p className="font-medium">{compliance.taxCategory}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-destructive">Outstanding Returns</span>
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-destructive">{compliance.outstandingReturns}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">Next Filing</span>
                  <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {new Date(compliance.nextFilingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Total Liability</span>
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatNaira(compliance.totalTaxLiability)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Tax Summary Component
const TaxSummaryCard = ({ summary }: { summary: TaxComplianceData['taxSummary'] }) => {
  return (
    <Card data-testid="tax-summary-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-lg sm:text-xl">Tax Position Summary</span>
        </CardTitle>
        <CardDescription>
          Overview of your tax obligations and positions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="vat-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">VAT Collected</span>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="vat-collected-amount">{formatNaira(summary.totalVATCollected)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800" data-testid="vat-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">VAT Paid</span>
              <Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400" data-testid="vat-paid-amount">{formatNaira(summary.totalVATPaid)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800" data-testid="wht-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">WHT Deducted</span>
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="wht-deducted-amount">{formatNaira(summary.totalWHTDeducted)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800" data-testid="wht-credits-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">WHT Credits</span>
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400" data-testid="wht-credits-amount">{formatNaira(summary.totalWHTCredits)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-red-700 dark:text-red-300">Deductible Expenses</span>
              <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400" data-testid="deductible-expenses-amount">{formatNaira(summary.totalDeductibleExpenses)}</p>
          </div>

          <div className={`p-3 sm:p-4 rounded-lg border ${summary.netTaxPosition >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm ${summary.netTaxPosition >= 0 ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>Net Tax Position</span>
              <TrendingUp className={`w-4 h-4 ${summary.netTaxPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${summary.netTaxPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} data-testid="net-tax-position-amount">
              {formatNaira(summary.netTaxPosition)}
            </p>
            <p className={`text-xs font-medium ${summary.netTaxPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {summary.netTaxPosition >= 0 ? 'Payable' : 'Refundable'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UpcomingDeadlinesCard = ({ deadlines }: { deadlines: TaxComplianceData['upcomingDeadlines'] }) => {
  const getPriorityColor = (daysUntilDue: number) => {
    if (daysUntilDue <= 7) return 'bg-red-500';
    if (daysUntilDue <= 14) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityVariant = (daysUntilDue: number) => {
    if (daysUntilDue <= 7) return 'destructive';
    if (daysUntilDue <= 14) return 'default';
    return 'secondary';
  };

  return (
    <Card data-testid="upcoming-deadlines">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg sm:text-xl">Upcoming Tax Deadlines</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Tax filing deadlines and payment due dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deadlines.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base">No upcoming deadlines</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">All tax obligations are up to date</p>
          </div>
        ) : (
          deadlines.map((deadline) => (
            <div key={deadline.id} className="p-3 sm:p-4 rounded-lg border bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.daysUntilDue)}`} />
                    <span className="font-medium text-sm sm:text-base">{deadline.taxType}</span>
                    <Badge variant={getPriorityVariant(deadline.daysUntilDue)} className="text-xs">
                      {deadline.daysUntilDue <= 7 ? 'High' : deadline.daysUntilDue <= 14 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Due: {new Date(deadline.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {deadline.daysUntilDue <= 0 ? 'Overdue' : `${deadline.daysUntilDue} days left`}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Recent Reports Component
const RecentReportsCard = ({ reports }: { reports: TaxComplianceData['recentReports'] }) => {
  return (
    <Card data-testid="recent-reports">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="text-lg sm:text-xl">Recent Tax Reports</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Recently generated tax compliance reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base">No reports generated yet</p>
            <Button 
              className="mt-3 sm:mt-4 text-sm sm:text-base" 
              onClick={() => window.location.href = "/tax-reports"}
              data-testid="btn-generate-first-report"
            >
              Generate First Report
            </Button>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="p-3 sm:p-4 rounded-lg border bg-white" data-testid="report-item">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{report.reportType}</Badge>
                    <Badge variant={report.status === "downloaded" ? "default" : "secondary"} className="text-xs">
                      {report.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{report.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Generated: {new Date(report.generatedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 sm:ml-4">
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm" data-testid={`btn-download-report-${report.id}`}>
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActionsCard = ({ setLocation }: { setLocation: (path: string) => void }) => {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/tax-calendar" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-view-calendar"
          >
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-xs">View Calendar</span>
          </Button>
        </Link>

        <Link href="/vat-tracking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-track-vat"
          >
            <Receipt className="h-5 w-5 text-green-600" />
            <span className="text-xs">Track VAT</span>
          </Button>
        </Link>

        <Link href="/wht-tracking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-track-wht"
          >
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="text-xs">Track WHT</span>
          </Button>
        </Link>

        <Link href="/tax-receipts" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-organize-receipts"
          >
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="text-xs">Organize Receipts</span>
          </Button>
        </Link>

        <Link href="/tax-reports" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-generate-reports"
          >
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <span className="text-xs">Generate Reports</span>
          </Button>
        </Link>

        <Link href="/file-tax" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-file-tax"
          >
            <FileText className="h-5 w-5 text-red-600" />
            <span className="text-xs">File Tax</span>
          </Button>
        </Link>

        <Link href="/tax-calculator" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-tax-calculator"
          >
            <Calculator className="h-5 w-5 text-indigo-600" />
            <span className="text-xs">Tax Calculator</span>
          </Button>
        </Link>

        <Link href="/tax-settings" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center space-y-1 w-full hover:bg-[#29A378] hover:text-white hover:border-[#29A378]" 
            data-testid="button-tax-settings"
          >
            <Settings className="h-5 w-5 text-slate-600" />
            <span className="text-xs">Settings</span>
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default function TaxCompliance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Use React Query for data fetching with real-time updates
  const { data: taxData, isLoading, error, refetch } = useQuery<TaxComplianceData>({
    queryKey: ['/api/tax/compliance/dashboard'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/compliance/dashboard", "GET");
      return response.json();
    },
    retry: false, // Disable automatic retries to show error state
    refetchInterval: false, // Disable automatic refetching to prevent unwanted refreshes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Fetch expense WHT data (WHT deducted from suppliers)
  const { data: expenseWHT = [] } = useQuery<any[]>({
    queryKey: ['/api/expenses'],
    enabled: !!user,
  });

  // Fetch invoice WHT data (WHT deducted by clients from your invoices)
  const { data: invoiceWHT = [] } = useQuery<any[]>({
    queryKey: ['/api/income'],
    enabled: !!user,
  });

  // Calculate correct WHT amounts
  const totalWHTDeducted = expenseWHT.reduce((sum: number, expense: any) => {
    const whtAmount = parseFloat(expense.whtAmount) || 0;
    return sum + whtAmount;
  }, 0);

  const totalWHTCredits = invoiceWHT.reduce((sum: number, income: any) => {
    const whtAmount = parseFloat(income.whtAmount) || 0;
    return sum + whtAmount;
  }, 0);

  // Meticulous fix: Calculate total deductible expenses from expense data
  const totalDeductibleExpenses = expenseWHT.reduce((sum: number, expense: any) => {
    const expenseAmount = parseFloat(expense.amount) || 0;
    return sum + expenseAmount;
  }, 0);

  // Update tax summary with correct WHT calculations
  const summary = taxData ? {
    ...taxData.taxSummary,
    totalWHTDeducted,
    totalWHTCredits,
    totalDeductibleExpenses, // ✅ Use calculated value from expense data
    netTaxPosition: (taxData.taxSummary.totalVATCollected - taxData.taxSummary.totalVATPaid) + (totalWHTCredits - totalWHTDeducted) - totalDeductibleExpenses
  } : {
    totalVATCollected: 0,
    totalVATPaid: 0,
    totalWHTDeducted: 0,
    totalWHTCredits: 0,
    totalDeductibleExpenses: 0, // ✅ Use calculated value
    netTaxPosition: 0
  };

  // Show skeleton while auth is loading
  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  // Check if user has premium access for tax compliance tools
  const isPremium = (user as any)?.subscriptionPlan === "premium";
  if (!isPremium) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <Header title="Tax Compliance Center" showBack={true} backHref="/expense-manager" />
        <div className="text-center py-20">
          <Shield className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Tax compliance tools are available for Premium subscribers only. Upgrade to access comprehensive tax tracking, compliance monitoring, and reporting features.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/subscription")} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/expense-manager")}
            >
              Back to Dashboard
            </Button>
          </div>
          
          {/* Feature comparison */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Premium Tax Features</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-red-600 mb-2">Freemium</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Basic expense tracking</li>
                  <li>• Simple reporting</li>
                  <li>• Manual tax calculations</li>
                </ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-600 mb-2">Premium</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• ✅ Tax compliance monitoring</li>
                  <li>• ✅ WHT tracking & management</li>
                  <li>• ✅ Automated tax calculations</li>
                  <li>• ✅ Tax deadline reminders</li>
                  <li>• ✅ Professional tax reports</li>
                  <li>• ✅ VAT & WHT optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <Header title="Tax Compliance Center" showBack={true} backHref="/expense-manager" />
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" data-testid="error-message">
            Error Loading Tax Compliance Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error instanceof Error ? error.message : "Failed to load tax compliance data"}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="retry-button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="ml-3"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <div className="text-center py-20">
          <ArrowLeft className="w-16 h-16 mx-auto text-green-600 dark:text-green-400 mb-4" />
          <p className="text-gray-500">Loading tax compliance data...</p>
        </div>
      </div>
    );
  }

  const { firsCompliance, upcomingDeadlines, recentReports, taxSummary } = taxData;

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Tax Compliance Center" showBack={true} backHref="/expense-manager" />
      
      <main className="pb-20 px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Live Tax Dashboard</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
        
        <TaxSummaryCard summary={summary} />
        <QuickActionsCard setLocation={setLocation} />
        <ComplianceStatusCard 
          compliance={firsCompliance} 
          isLoading={isLoading}
          lastUpdated={new Date()}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <UpcomingDeadlinesCard deadlines={upcomingDeadlines} />
          <RecentReportsCard reports={recentReports} />
        </div>
      </main>
    </div>
  );
};
