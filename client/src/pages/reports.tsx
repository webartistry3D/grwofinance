import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/currency";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, TrendingDown, Calendar, Download, FileText, DollarSign, Receipt, Calculator, Crown } from "lucide-react";

interface Record {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  source?: string;
  percentage?: number;
  type?: 'collected' | 'paid' | 'deducted' | 'credit';
}

interface IncomeStats {
  totalIncome: number;
  monthlyTotal: number;
  weeklyTotal: number;
  pendingInvoices: number;
  invoicesCreated: number;
  recentPayments: Array<{
    id: string;
    source: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

interface ExpenseStats {
  totalExpenses: number;
  monthlyExpenses: number;
  weeklyExpenses: number;
  receiptCount: number;
  recentExpenses: Array<{
    id: string;
    merchant: string;
    amount: number;
    date: string;
    category: string;
    imageUrl?: string;
    notes?: string;
    dayOfWeek?: string;
    transactionTime?: string;
  }>;
}

interface VATStats {
  totalVATCollected: number;
  totalVATPaid: number;
  netVAT: number;
  vatTransactions: Array<{
    id: string;
    type: 'collected' | 'paid';
    amount: number;
    date: string;
    description: string;
    source?: string;
    category?: string;
  }>;
}

interface WHTStats {
  totalWHTDeducted: number;
  totalWHTCredits: number;
  netWHT: number;
  whtTransactions: Array<{
    id: string;
    type: 'deducted' | 'credit';
    amount: number;
    date: string;
    description: string;
    source?: string;
    category?: string;
  }>;
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [incomeFilter, setIncomeFilter] = useState('all');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [vatFilter, setVATFilter] = useState('all');
  const [whtFilter, setWHTFilter] = useState('all');
  const [incomeMonthFilter, setIncomeMonthFilter] = useState('all');
  const [incomeYearFilter, setIncomeYearFilter] = useState('all');
  const [expenseMonthFilter, setExpenseMonthFilter] = useState('all');
  const [expenseYearFilter, setExpenseYearFilter] = useState('all');
  const [vatMonthFilter, setVATMonthFilter] = useState('all');
  const [vatYearFilter, setVATYearFilter] = useState('all');
  const [whtMonthFilter, setWHTMonthFilter] = useState('all');
  const [whtYearFilter, setWHTYearFilter] = useState('all');

  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), []);

  // Check if user has premium access for export features
  const isPremium = (user as any)?.subscriptionPlan === "premium";
  if (!authLoading && !isPremium) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <Header title="Reports" showBack={true} backHref="/expense-manager" />
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Advanced reporting and export features are available for Premium subscribers only. Upgrade to access PDF/Excel exports, custom reports, and comprehensive analytics.
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
            <h3 className="text-lg font-semibold mb-4">Premium Reporting Features</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-red-600 mb-2">Freemium</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Basic expense tracking</li>
                  <li>• Simple income overview</li>
                  <li>• Manual calculations</li>
                </ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-600 mb-2">Premium</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• ✅ PDF & Excel exports</li>
                  <li>• ✅ Custom date ranges</li>
                  <li>• ✅ Advanced analytics</li>
                  <li>• ✅ Professional reports</li>
                  <li>• ✅ Tax-ready summaries</li>
                  <li>• ✅ Trend analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: incomeStats, isLoading: incomeLoading } = useQuery<IncomeStats>({
    queryKey: ['/api/income/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/income/stats');
        if (!response.ok) throw new Error('Failed to fetch income stats');
        return response.json();
      } catch (error) {
        console.error('Error fetching income stats:', error);
        return {
          totalIncome: 0,
          monthlyTotal: 0,
          weeklyTotal: 0,
          pendingInvoices: 0,
          invoicesCreated: 0,
          recentPayments: []
        };
      }
    },
    retry: false,
  });

  const { data: expenseStats, isLoading: expensesLoading } = useQuery<ExpenseStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch expense stats');
        return response.json();
      } catch (error) {
        console.error('Error fetching expense stats:', error);
        return {
          totalExpenses: 0,
          monthlyExpenses: 0,
          weeklyExpenses: 0,
          receiptCount: 0,
          recentExpenses: []
        };
      }
    },
    retry: false,
  });

  const { data: vatStats, isLoading: vatLoading } = useQuery<VATStats>({
    queryKey: ['/api/tax/vat/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tax/compliance/dashboard');
        if (!response.ok) throw new Error('Failed to fetch VAT stats');
        const data = await response.json();
        const taxSummary = data.taxSummary || {};
        
        // Create mock VAT transactions for demonstration
        const vatTransactions = [
          {
            id: 'vat_1',
            type: 'collected' as const,
            amount: taxSummary.totalVATCollected || 0,
            date: new Date().toISOString(),
            description: 'VAT collected from sales',
            source: 'Sales Revenue'
          },
          {
            id: 'vat_2',
            type: 'paid' as const,
            amount: taxSummary.totalVATPaid || 0,
            date: new Date().toISOString(),
            description: 'VAT paid on purchases',
            category: 'Operating Expenses'
          }
        ];
        
        return {
          totalVATCollected: taxSummary.totalVATCollected || 0,
          totalVATPaid: taxSummary.totalVATPaid || 0,
          netVAT: (taxSummary.totalVATCollected || 0) - (taxSummary.totalVATPaid || 0),
          vatTransactions
        };
      } catch (error) {
        console.error('Error fetching VAT stats:', error);
        return {
          totalVATCollected: 0,
          totalVATPaid: 0,
          netVAT: 0,
          vatTransactions: []
        };
      }
    },
    retry: false,
  });

  const { data: whtStats, isLoading: whtLoading } = useQuery<WHTStats>({
    queryKey: ['/api/tax/wht/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tax/compliance/dashboard');
        if (!response.ok) throw new Error('Failed to fetch WHT stats');
        const data = await response.json();
        const taxSummary = data.taxSummary || {};
        
        // Create mock WHT transactions for demonstration
        const whtTransactions = [
          {
            id: 'wht_1',
            type: 'deducted' as const,
            amount: taxSummary.totalWHTDeducted || 0,
            date: new Date().toISOString(),
            description: 'WHT deducted from payments',
            source: 'Client Payments'
          },
          {
            id: 'wht_2',
            type: 'credit' as const,
            amount: taxSummary.totalWHTCredits || 0,
            date: new Date().toISOString(),
            description: 'WHT credits from expenses',
            category: 'Supplier Payments'
          }
        ];
        
        return {
          totalWHTDeducted: taxSummary.totalWHTDeducted || 0,
          totalWHTCredits: taxSummary.totalWHTCredits || 0,
          netWHT: (taxSummary.totalWHTCredits || 0) - (taxSummary.totalWHTDeducted || 0),
          whtTransactions
        };
      } catch (error) {
        console.error('Error fetching WHT stats:', error);
        return {
          totalWHTDeducted: 0,
          totalWHTCredits: 0,
          netWHT: 0,
          whtTransactions: []
        };
      }
    },
    retry: false,
  });

  const filterRecords = (records: Record[], filter: string, monthFilter: string = 'all', yearFilter: string = 'all') => {
    const now = new Date();
    return records.filter(record => {
      const recordDate = new Date(record.date);
      
      // Handle legacy filter options for backward compatibility
      if (filter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      } else if (filter === 'monthly') {
        return recordDate.getMonth() === now.getMonth() && 
               recordDate.getFullYear() === now.getFullYear();
      } else if (filter === 'yearly') {
        return recordDate.getFullYear() === now.getFullYear();
      } else if (filter === 'custom') {
        // Use custom month and year filters
        let monthMatch = monthFilter === 'all';
        let yearMatch = yearFilter === 'all';
        
        if (monthFilter !== 'all') {
          monthMatch = recordDate.getMonth() === parseInt(monthFilter);
        }
        
        if (yearFilter !== 'all') {
          yearMatch = recordDate.getFullYear() === parseInt(yearFilter);
        }
        
        return monthMatch && yearMatch;
      }
      
      return true; // 'all' filter
    });
  };

  const exportToCSV = (records: Record[], filename: string) => {
    const csv = 'Date,Category,Description,Amount\n' + 
      records.map(r => `${r.date},${r.category},${r.description || ''},${r.amount}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportToPDF = (records: Record[], title: string) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    const html = `
      <html>
        <head>
          <title>${title} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; font-size: 1.1em; }
            .amount { text-align: right; }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            .col-date { width: 15%; }
            .col-source { width: 20%; }
            .col-description { width: 45%; }
            .col-amount { width: 20%; }
          </style>
        </head>
        <body>
          <h1>${title} Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th class="col-date">Date</th>
                <th class="col-source">${title.toLowerCase().includes('expense') ? 'Expense Category' : 'Income Source'}</th>
                <th class="col-description">Description</th>
                <th class="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  <td class="col-date">${new Date(r.date).toLocaleDateString()}</td>
                  <td class="col-source">${r.source || r.category || '-'}</td>
                  <td class="col-description">${r.description || '-'}</td>
                  <td class="col-amount amount ${title.toLowerCase()}" style={{ fontFamily: '"Share Tech Mono", monospace' }}>${formatNaira(r.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="total">Total:</td>
                <td class="col-amount amount total ${title.toLowerCase()}" style={{ fontFamily: '"Share Tech Mono", monospace' }}>${formatNaira(total)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate month options
  const getMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map((month, index) => ({
      value: index.toString(),
      label: month
    }));
  };

  // Generate year options (current year and 3 years back)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 4; i++) {
      const year = currentYear - i;
      years.push({
        value: year.toString(),
        label: year.toString()
      });
    }
    return years;
  };

  const RecordsTable = ({ records, title, type, filter, setFilter, monthFilter, setMonthFilter, yearFilter, setYearFilter, isLoading }: {
    records: Record[];
    title: string;
    type: 'income' | 'expense' | 'vat' | 'wht';
    filter: string;
    setFilter: (filter: string) => void;
    monthFilter: string;
    setMonthFilter: (filter: string) => void;
    yearFilter: string;
    setYearFilter: (filter: string) => void;
    isLoading: boolean;
  }) => {
    const filteredRecords = filterRecords(records, filter, monthFilter, yearFilter);
    
    // Calculate cumulative totals (all time, not filtered)
    const totalAllTime = records.reduce((sum: number, r: Record) => sum + r.amount, 0);

    // Calculate percentage for each record based on cumulative total
    const recordsWithPercentage = filteredRecords.map((record: Record) => ({
      ...record,
      percentage: totalAllTime > 0 ? (record.amount / totalAllTime) * 100 : 0
    }));

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {title}
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border rounded text-base bg-background border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring min-w-0 flex-shrink-0"
                >
                  <option value="all">All Time</option>
                  <option value="weekly">This Week</option>
                  <option value="monthly">This Month</option>
                  <option value="yearly">This Year</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    onClick={() => exportToCSV(filteredRecords, `${type}-${filter}.csv`)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-2 text-base"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button 
                    onClick={() => exportToPDF(filteredRecords, title)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-2 text-base"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {filter === 'custom' && (
            <div className="p-4 border-b bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="font-semibold text-lg">{title} Records</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="all">All Months</option>
                    {getMonthOptions().map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="all">All Years</option>
                    {getYearOptions().map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium text-base">Total {title}:</span>
              <span className={`font-bold text-xl ${
                type === 'income' ? 'text-green-600' : 
                type === 'expense' ? 'text-orange-600' :
                type === 'vat' ? 'text-blue-600' :
                'text-red-600'
              }`} style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                {formatNaira(totalAllTime)}
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded"></div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {type.toLowerCase()} records found for selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base min-w-[600px] md:min-w-[700px] lg:min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 md:px-4 whitespace-nowrap font-semibold">Date</th>
                    <th className="text-left py-3 px-3 md:px-4 whitespace-nowrap font-semibold">
                      {type === 'income' ? 'Income Source' : 
                       type === 'expense' ? 'Expense Category' :
                       type === 'vat' ? 'VAT Type' : 'WHT Type'}
                    </th>
                    <th className="text-left py-3 px-3 md:px-4 whitespace-nowrap font-semibold">Description</th>
                    <th className="text-right py-3 px-3 md:px-4 whitespace-nowrap font-semibold">Amount</th>
                    <th className="text-right py-3 px-3 md:px-4 whitespace-nowrap font-semibold">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsWithPercentage.map((record: Record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3 md:px-4 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 md:px-4 whitespace-nowrap">
                      {type === 'income' ? (record.source || record.category || '-') : 
                       type === 'expense' ? (record.category || '-') :
                       type === 'vat' ? (record.type === 'collected' ? 'VAT Collected' : 'VAT Paid') :
                       (record.type === 'deducted' ? 'WHT Deducted' : 'WHT Credit')}
                    </td>
                      <td className="py-3 px-3 md:px-4 whitespace-nowrap max-w-[200px] truncate" title={record.description || '-'}>{record.description || '-'}</td>
                      <td className={`py-3 px-3 md:px-4 whitespace-nowrap text-right font-medium ${
                      type === 'income' ? 'text-green-600' : 
                      type === 'expense' ? 'text-orange-600' :
                      type === 'vat' ? (record.type === 'collected' ? 'text-blue-600' : 'text-purple-600') :
                      (record.type === 'deducted' ? 'text-red-600' : 'text-indigo-600')
                    }`} style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                        {formatNaira(record.amount)}
                      </td>
                      <td className={`py-3 px-3 md:px-4 whitespace-nowrap text-right font-medium ${
                        type === 'income' ? 'text-green-600' : 
                        type === 'expense' ? 'text-orange-600' :
                        type === 'vat' ? (record.type === 'collected' ? 'text-blue-600' : 'text-purple-600') :
                        (record.type === 'deducted' ? 'text-red-600' : 'text-indigo-600')
                      }`}>
                        {(record.percentage || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ProfitSummary = () => {
    // Calculate cumulative totals (all time, not filtered)
    const totalIncomeAllTime = incomeStats?.totalIncome || 0;
    const totalExpensesAllTime = expenseStats?.totalExpenses || 0;
    const netPosition = totalIncomeAllTime - totalExpensesAllTime;
    const profitMargin = totalIncomeAllTime > 0 ? (netPosition / totalIncomeAllTime) * 100 : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/*<span className="w-5 h-5 flex items-center justify-center text-lg font-bold">₦</span>*/}
            Profit/Loss Summary
          </CardTitle>
        </CardHeader>
        <CardContent>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Income</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                    {formatNaira(totalIncomeAllTime)}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Expenses</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                    {formatNaira(totalExpensesAllTime)}
                  </p>
                </div>
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${netPosition >= 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${netPosition >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    Net Position
                  </p>
                  <p className={`text-xl font-bold ${netPosition >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`} style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                    {formatNaira(netPosition)}
                  </p>
                  <p className={`text-xs ${netPosition >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {profitMargin.toFixed(1)}% margin
                  </p>
                </div>
                <span className={`w-6 h-6 flex items-center justify-center text-lg font-bold ${netPosition >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₦</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen text-base">
      <Header title="Reports" showBack={true} backHref="/expense-manager" />
      <main className="pb-20 p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 text-base">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RecordsTable
            records={incomeStats?.recentPayments || []}
            title="Income"
            type="income"
            filter={incomeFilter}
            setFilter={setIncomeFilter}
            monthFilter={incomeMonthFilter}
            setMonthFilter={setIncomeMonthFilter}
            yearFilter={incomeYearFilter}
            setYearFilter={setIncomeYearFilter}
            isLoading={incomeLoading}
          />
          
          <RecordsTable
            records={expenseStats?.recentExpenses || []}
            title="Expenses"
            type="expense"
            filter={expenseFilter}
            setFilter={setExpenseFilter}
            monthFilter={expenseMonthFilter}
            setMonthFilter={setExpenseMonthFilter}
            yearFilter={expenseYearFilter}
            setYearFilter={setExpenseYearFilter}
            isLoading={expensesLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RecordsTable
            records={vatStats?.vatTransactions || []}
            title="VAT Report"
            type="vat"
            filter={vatFilter}
            setFilter={setVATFilter}
            monthFilter={vatMonthFilter}
            setMonthFilter={setVATMonthFilter}
            yearFilter={vatYearFilter}
            setYearFilter={setVATYearFilter}
            isLoading={vatLoading}
          />
          
          <RecordsTable
            records={whtStats?.whtTransactions || []}
            title="WHT Report"
            type="wht"
            filter={whtFilter}
            setFilter={setWHTFilter}
            monthFilter={whtMonthFilter}
            setMonthFilter={setWHTMonthFilter}
            yearFilter={whtYearFilter}
            setYearFilter={setWHTYearFilter}
            isLoading={whtLoading}
          />
        </div>
        
        <div className="mb-20 md:mb-24">
        <ProfitSummary />
      </div>
      
      {/* Empty Section for spacing */}
      <div className="h-8"></div>
      
      <BottomNavigation />
      </main>
    </div>
  );
}
