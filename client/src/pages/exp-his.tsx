{/*import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ExpenseCard } from "@/components/expense-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { type Expense } from "@shared/schema";

export default function Transactions() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses']
  });

  const filteredExpenses = expenses.filter(expense => {
    if (selectedCategory !== "all" && expense.category !== selectedCategory) {
      return false;
    }
    
    if (dateFilter !== "all") {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          return expenseDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo;
        case "month":
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    }
    
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount), 0
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <Header title="Transactions" />
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Transactions" />
      
      <main className="pb-20">
        {/* Summary Card /}
        <section className="p-4">
          <Card className="bg-primary text-white border-0">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-sm">
                  {selectedCategory === "all" ? "Total" : 
                   EXPENSE_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || selectedCategory} 
                  {" "}Expense
                </p>
                <h2 className="text-2xl font-bold mt-1" data-testid="text-filtered-total">
                  {formatNaira(totalFiltered)}
                </h2>
                <p className="text-green-100 text-xs mt-1">
                  {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filters /}
        <section className="px-4 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Time Period
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Transactions List /}
        <section className="px-4">
          {filteredExpenses.length > 0 ? (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="p-8 text-center">
                <i className="fas fa-receipt text-4xl text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No transactions found</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory !== "all" || dateFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Scan your first receipt to get started"
                  }
                </p>
                {(selectedCategory !== "all" || dateFilter !== "all") && (
                  <Button 
                    onClick={() => {
                      setSelectedCategory("all");
                      setDateFilter("all");
                    }}
                    variant="outline"
                    className="mt-4"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}*/}
