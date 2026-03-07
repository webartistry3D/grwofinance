import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Calendar, TrendingUp, DollarSign, BarChart3, Plus } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";

interface TaxReport {
  id: string;
  reportType: string;
  title: string;
  description?: string;
  reportPeriod: string;
  generatedDate: string;
  fileUrl?: string;
  status: string;
  data?: any;
}

export default function TaxReports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    reportType: "",
    reportPeriod: ""
  });

  // Fetch tax reports using React Query
  const { data: taxReports = [], isLoading, error } = useQuery<TaxReport[]>({
    queryKey: ['/api/tax/reports'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/reports", "GET");
      return response.json();
    },
    retry: false,
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest("/api/tax/reports/generate", "POST", reportData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Your tax report has been generated successfully",
      });
      setShowGenerateModal(false);
      setGenerateForm({ reportType: "", reportPeriod: "" });
      // Invalidate and refetch reports
      queryClient.invalidateQueries({ queryKey: ['/api/tax/reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate tax report",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = async () => {
    if (!generateForm.reportType || !generateForm.reportPeriod) {
      toast({
        title: "Error",
        description: "Please select report type and period",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate({
      reportType: generateForm.reportType,
      reportPeriod: generateForm.reportPeriod
    });
  };

  const handleDownloadReport = async (reportId: string, fileUrl?: string) => {
    try {
      if (fileUrl) {
        // Download existing file
        window.open(fileUrl, '_blank');
      } else {
        // Generate and download
        const response = await fetch(`/api/tax/reports/${reportId}/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const getReportTypeColor = (reportType: string) => {
    switch (reportType) {
      case "VAT_monthly":
        return "bg-blue-100 text-blue-800";
      case "WHT_monthly":
        return "bg-purple-100 text-purple-800";
      case "CIT_annual":
        return "bg-green-100 text-green-800";
      case "tax_summary":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReportTypeIcon = (reportType: string) => {
    switch (reportType) {
      case "VAT_monthly":
        return <DollarSign className="w-4 h-4" />;
      case "WHT_monthly":
        return <TrendingUp className="w-4 h-4" />;
      case "CIT_annual":
        return <BarChart3 className="w-4 h-4" />;
      case "tax_summary":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getReportTypeLabel = (reportType: string) => {
    switch (reportType) {
      case "VAT_monthly":
        return "Monthly VAT Report";
      case "WHT_monthly":
        return "Monthly WHT Report";
      case "CIT_annual":
        return "Annual Company Income Tax";
      case "tax_summary":
        return "Tax Summary Report";
      default:
        return reportType;
    }
  };

  // Show skeleton while auth is loading or data is loading
  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error instanceof Error ? error.message : "Failed to load tax reports"}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tax/reports'] })}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const reportTypes = [
    { value: "VAT_monthly", label: "Monthly VAT Report" },
    { value: "WHT_monthly", label: "Monthly WHT Report" },
    { value: "CIT_annual", label: "Annual Company Income Tax" },
    { value: "tax_summary", label: "Tax Summary Report" }
  ];

  const currentYear = new Date().getFullYear();
  const reportPeriods = [
    { value: `${currentYear}-01`, label: "January 2024" },
    { value: `${currentYear}-02`, label: "February 2024" },
    { value: `${currentYear}-03`, label: "March 2024" },
    { value: `Q1-${currentYear}`, label: "Q1 2024" },
    { value: `${currentYear}-04`, label: "April 2024" },
    { value: `${currentYear}-05`, label: "May 2024" },
    { value: `${currentYear}-06`, label: "June 2024" },
    { value: `Q2-${currentYear}`, label: "Q2 2024" },
    { value: `${currentYear}-07`, label: "July 2024" },
    { value: `${currentYear}-08`, label: "August 2024" },
    { value: `${currentYear}-09`, label: "September 2024" },
    { value: `Q3-${currentYear}`, label: "Q3 2024" },
    { value: `${currentYear}-10`, label: "October 2024" },
    { value: `${currentYear}-11`, label: "November 2024" },
    { value: `${currentYear}-12`, label: "December 2024" },
    { value: `Q4-${currentYear}`, label: "Q4 2024" },
    { value: `${currentYear}`, label: `Annual ${currentYear}` }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Tax Reports" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold text-primary">
                    {taxReports.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generated This Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {taxReports.filter(report => {
                      const reportDate = new Date(report.generatedDate);
                      const currentDate = new Date();
                      return reportDate.getMonth() === currentDate.getMonth() && 
                             reportDate.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready to Download</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {taxReports.filter(report => report.fileUrl).length}
                  </p>
                </div>
                <Download className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Report Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Generate New Report
              </div>
              <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Generate Tax Report</DialogTitle>
                    <DialogDescription>
                      Create a new tax compliance report
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Report Type</label>
                      <Select value={generateForm.reportType} onValueChange={(value) => setGenerateForm({ ...generateForm, reportType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Report Period</label>
                      <Select value={generateForm.reportPeriod} onValueChange={(value) => setGenerateForm({ ...generateForm, reportPeriod: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={generateReportMutation.isPending || !generateForm.reportType || !generateForm.reportPeriod} 
                        className="flex-1"
                      >
                        {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Create comprehensive tax reports for compliance and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map((type) => (
                <div key={type.value} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    {getReportTypeIcon(type.value)}
                    <h3 className="font-medium text-sm">{type.label}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type.value === "VAT_monthly" && "Monthly VAT report"}
                    {type.value === "WHT_monthly" && "Monthly WHT report"}
                    {type.value === "CIT_annual" && "Annual CIT report"}
                    {type.value === "tax_summary" && "Tax summary report"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generated Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generated Reports
            </CardTitle>
            <CardDescription>
              Download and manage your tax compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {taxReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tax reports generated yet</p>
                <p className="text-sm mt-2">Generate your first tax report to get started</p>
              </div>
            ) : (
              taxReports.map((report) => (
                <div key={report.id} className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getReportTypeColor(report.reportType)}>
                          {getReportTypeIcon(report.reportType)}
                          <span className="ml-1">{getReportTypeLabel(report.reportType)}</span>
                        </Badge>
                        <Badge variant="outline">{report.reportPeriod}</Badge>
                        <Badge variant={report.status === "downloaded" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Generated: {new Date(report.generatedDate).toLocaleDateString()}</span>
                        </div>
                        {report.fileUrl && (
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span>Ready for download</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadReport(report.id, report.fileUrl)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Available Report Types
            </CardTitle>
            <CardDescription>
              Learn about the different tax reports you can generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportTypes.map((type) => (
              <div key={type.value} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {getReportTypeIcon(type.value)}
                  <h3 className="font-semibold">{type.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {type.value === "VAT_monthly" && "Monthly Value Added Tax report showing input/output VAT calculations and net VAT liability."}
                  {type.value === "WHT_monthly" && "Monthly Withholding Tax report tracking all WHT deductions, payments, and certificates."}
                  {type.value === "CIT_annual" && "Annual Company Income Tax report with profit/loss statements and tax calculations."}
                  {type.value === "tax_summary" && "Comprehensive tax summary including all tax types for the selected period."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
