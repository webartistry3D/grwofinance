import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { Calculator, ArrowLeft, FileText, TrendingUp, Percent } from "lucide-react";

interface TaxCalculation {
  income: number;
  expenses: number;
  taxableIncome: number;
  vatPayable: number;
  payePayable: number;
  totalTax: number;
  netIncome: number;
}

export default function TaxCalculator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  console.log('=== Tax Calculator Page Debug ===');
  console.log('Component mounted at:', new Date().toISOString());
  console.log('Current location:', window.location.href);
  console.log('Navigation hook setLocation:', typeof setLocation);
  
  const [formData, setFormData] = useState({
    income: "",
    expenses: "",
    vatRate: "7.5",
    payeRate: "24"
  });

  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const calculateTax = () => {
    console.log('=== Tax Calculation Debug ===');
    console.log('Form data:', formData);
    console.log('Income:', formData.income, 'Type:', typeof formData.income);
    console.log('Expenses:', formData.expenses, 'Type:', typeof formData.expenses);
    console.log('VAT Rate:', formData.vatRate);
    console.log('PAYE Rate:', formData.payeRate);
    
    const income = parseFloat(formData.income) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const vatRate = parseFloat(formData.vatRate) / 100;
    const payeRate = parseFloat(formData.payeRate) / 100;

    console.log('Parsed income:', income);
    console.log('Parsed expenses:', expenses);
    console.log('Parsed VAT rate:', vatRate);
    console.log('Parsed PAYE rate:', payeRate);

    if (income <= 0) {
      console.log('❌ Invalid income detected:', income);
      toast({
        title: "Invalid Input",
        description: "Please enter a valid income amount",
        variant: "destructive"
      });
      return;
    }

    const taxableIncome = Math.max(0, income - expenses);
    const vatPayable = income * vatRate;
    const payePayable = taxableIncome * payeRate;
    const totalTax = vatPayable + payePayable;
    const netIncome = income - totalTax;

    console.log('Calculation results:', {
      taxableIncome,
      vatPayable,
      payePayable,
      totalTax,
      netIncome
    });

    setCalculation({
      income,
      expenses,
      taxableIncome,
      vatPayable,
      payePayable,
      totalTax,
      netIncome
    });
    
    console.log('✅ Tax calculation completed');
    console.log('=== End Tax Calculation Debug ===');
  };

  const resetCalculator = () => {
    setFormData({
      income: "",
      expenses: "",
      vatRate: "7.5",
      payeRate: "24"
    });
    setCalculation(null);
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Tax Calculator" showBack={true} backHref="/tax-compliance" />

      <main className="pb-20 px-4 py-6 space-y-6">
        {/* Calculator Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Tax Calculator
            </CardTitle>
            <CardDescription>
              Calculate your VAT and PAYE taxes based on Nigerian tax rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Enter your annual income"
                  value={formData.income}
                  onChange={(e) => setFormData(prev => ({ ...prev, income: e.target.value }))}
                  className="text-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expenses">Annual Expenses</Label>
                <Input
                  id="expenses"
                  type="number"
                  placeholder="Enter your annual expenses"
                  value={formData.expenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
                  className="text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Select value={formData.vatRate} onValueChange={(value) => setFormData(prev => ({ ...prev, vatRate: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7.5">7.5% (Standard VAT)</SelectItem>
                    <SelectItem value="5">5% (Reduced VAT)</SelectItem>
                    <SelectItem value="0">0% (Exempt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payeRate">PAYE Rate (%)</Label>
                <Select value={formData.payeRate} onValueChange={(value) => setFormData(prev => ({ ...prev, payeRate: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24% (Highest bracket)</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="7">7%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={calculateTax}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-calculate-tax"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Tax
              </Button>
              <Button 
                onClick={resetCalculator}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Results */}
        {calculation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Tax Calculation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Gross Income</span>
                    <span className="font-bold text-lg">{formatNaira(calculation.income)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Business Expenses</span>
                    <span className="font-bold text-lg text-red-600">-{formatNaira(calculation.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Taxable Income</span>
                    <span className="font-bold text-lg text-blue-600">{formatNaira(calculation.taxableIncome)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-sm font-medium text-orange-900 dark:text-orange-100">VAT Payable</span>
                    <span className="font-bold text-lg text-orange-600">{formatNaira(calculation.vatPayable)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">PAYE Payable</span>
                    <span className="font-bold text-lg text-purple-600">{formatNaira(calculation.payePayable)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">Total Tax</span>
                    <span className="font-bold text-lg text-red-600">{formatNaira(calculation.totalTax)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-900 dark:text-green-100">Net Income (After Tax)</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{formatNaira(calculation.netIncome)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tax Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-600" />
              Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">VAT (Value Added Tax)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Standard VAT rate in Nigeria is 7.5% on most goods and services. 
                Some items may qualify for reduced rates (5%) or be exempt (0%).
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">PAYE (Pay As You Earn)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PAYE is calculated on taxable income after deducting business expenses. 
                Rates range from 7% to 24% based on income brackets.
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Taxable Income</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Calculated as Gross Income minus allowable Business Expenses. 
                Only legitimate business expenses can be deducted.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
