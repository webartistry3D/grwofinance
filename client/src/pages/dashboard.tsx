import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Bot, Edit3 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ExpenseCard } from "@/components/expense-card";
import { CategoryChart } from "@/components/category-chart";
import { CameraModal } from "@/components/camera-modal";
import { ProcessingModal } from "@/components/processing-modal";
import { ResultsModal } from "@/components/results-modal";
import { formatNaira } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalExpenses: number;
  monthlyTotal: number;
  weeklyTotal: number;
  categoryTotals: Record<string, number>;
  receiptCount: number;
  categoryCount: number;
  recentTransactions: any[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>();
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  // Scroll to top when component mounts (after login)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats']
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const response = await apiRequest('/api/expenses', 'POST', expenseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success!",
        description: "Expense saved successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive"
      });
    }
  });

  const handleCameraCapture = async (file: File) => {
    setShowCameraModal(false);
    setShowProcessingModal(true);
    setProcessingProgress(0);
    setCurrentImageUrl(URL.createObjectURL(file));

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // ⬇️ Dynamic import of OCR only when needed
      const { processReceipt } = await import("@/lib/ocr");
      const result = await processReceipt(file);
      
      setProcessingProgress(100);
      setTimeout(() => {
        setOcrResult(result);
        setShowProcessingModal(false);
        setShowResultsModal(true);
        clearInterval(progressInterval);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setShowProcessingModal(false);
      toast({
        title: "OCR Failed",
        description: "Could not process receipt image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleCameraCapture(file);
      }
    };
    input.click();
  };

  const handleSaveExpense = async (data: { category: string; notes: string }) => {
    if (!ocrResult) return;

    const expenseData = {
      merchant: ocrResult.merchant,
      category: data.category,
      amount: ocrResult.amount.toString(),
      date: new Date(ocrResult.date),
      notes: data.notes,
      items: ocrResult.items
    };

    await createExpenseMutation.mutateAsync(expenseData);
    setShowResultsModal(false);
    setOcrResult(null);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Dashboard" />
        <div className="p-4 space-y-6">
          <div className="animate-pulse">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
            
            {/* Chart Area */}
            <div className="h-64 bg-muted rounded-lg mb-6"></div>
            
            {/* Recent Transactions */}
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const budgetLimit = 5000000; // Default budget of ₦5,000,000
  const budgetLeft = budgetLimit - (stats?.monthlyTotal || 0);
  const budgetUsagePercent = ((stats?.monthlyTotal || 0) / budgetLimit) * 100;

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen overflow-x-hidden">
      <Header title="Dashboard" />
      
      <main className="pb-20 max-w-full">
        {/* Dashboard Overview Section */}
        <section className="px-4 py-4 max-w-full">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-primary text-white border-0">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4 max-w-full">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-green-100 text-sm font-medium">Total Expenses</p>
                    <h2 className="text-xl lg:text-2xl font-bold truncate" data-testid="text-total-expenses" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                      {formatNaira(stats?.monthlyTotal || 0)}
                    </h2>
                    <p className="text-green-100 text-xs mt-1">This month</p>
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-green-100 text-sm">Budget Left</p>
                    <p className="text-lg lg:text-xl font-semibold truncate" data-testid="text-budget-left" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                      {formatNaira(Math.max(0, budgetLeft))}
                    </p>
                    <div className="h-1 bg-green-800 rounded-full mt-1 mb-1 w-full max-w-[200px] ml-auto">
                      <div 
                        className="h-full bg-green-300 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 lg:gap-4 mt-6 max-w-full">
                  <Card className="bg-white/10 border-0 max-w-full">
                    <CardContent className="p-3 lg:p-4 text-center">
                      <i className="fas fa-receipt text-white/80 mb-1 text-sm lg:text-base" />
                      <p className="text-xs lg:text-sm text-green-100">Receipts</p>
                      <p className="font-semibold text-sm lg:text-base" data-testid="text-receipt-count">
                        {stats?.receiptCount || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-0 max-w-full">
                    <CardContent className="p-3 lg:p-4 text-center">
                      <i className="fas fa-chart-line text-white/80 mb-1 text-sm lg:text-base" />
                      <p className="text-xs lg:text-sm text-green-100">Categories</p>
                      <p className="font-semibold text-sm lg:text-base" data-testid="text-category-count">
                        {stats?.categoryCount || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-0 max-w-full">
                    <CardContent className="p-3 lg:p-4 text-center">
                      <i className="fas fa-calendar-day text-white/80 mb-1 text-sm lg:text-base" />
                      <p className="text-xs lg:text-sm text-green-100">This Week</p>
                      <p className="font-semibold text-sm lg:text-base truncate" data-testid="text-weekly-expenses" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                        {formatNaira(stats?.weeklyTotal || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 py-4 max-w-full">
          <div className="flex justify-center space-x-2 sm:space-x-3 max-w-full overflow-x-auto">
            <Button 
              onClick={() => setShowCameraModal(true)}
              className="flex-shrink-0 min-w-0 bg-primary text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-semibold hover:bg-primary/90 shadow-lg text-sm sm:text-base"
              data-testid="button-scan-receipt"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="whitespace-nowrap">Scan</span>
            </Button>
            <Button 
              onClick={handleFileUpload}
              variant="outline"
              className="flex-shrink-0 min-w-0 bg-secondary text-secondary-foreground py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-semibold hover:bg-secondary/80 shadow-lg border-2 text-sm sm:text-base"
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="whitespace-nowrap">Upload</span>
            </Button>
            <Link href="/manual-entry">
              <Button 
                variant="outline"
                className="flex-shrink-0 min-w-0 bg-secondary text-secondary-foreground py-3 px-4 sm:py-4 sm:px-6 rounded-xl font-semibold hover:bg-secondary/80 shadow-lg border-2 text-sm sm:text-base"
                data-testid="button-manual-entry"
              >
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="whitespace-nowrap">Type</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="px-4 py-2 max-w-full">
          <div className="flex items-center justify-between mb-4 max-w-full">
            <h3 className="text-lg font-semibold text-muted-foreground font-display">Recent Transactions</h3>
            <Button 
              variant="link" 
              className="text-primary text-sm font-medium p-0 flex-shrink-0"
              data-testid="button-view-all-transactions"
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {stats?.recentTransactions?.length ? (
              stats.recentTransactions.map((expense: any) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            ) : (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No expenses yet</p>
                  <p className="text-sm text-gray-400">
                    Scan your first receipt to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Spending Categories */}
        {stats?.categoryTotals && Object.keys(stats.categoryTotals).length > 0 && (
          <section className="px-4 py-6 max-w-full">
            <CategoryChart categoryTotals={stats.categoryTotals} />
          </section>
        )}
      </main>

      <BottomNavigation />
      
      {/* Modals */}
      <CameraModal 
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
      
      <ProcessingModal 
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        progress={processingProgress}
        imageUrl={currentImageUrl}
      />
      
      <ResultsModal 
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        onSave={handleSaveExpense}
        ocrResult={ocrResult}
      />
    </div>
  );
}
