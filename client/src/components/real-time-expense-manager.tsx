// Real-time expense manager with live updates
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Edit, Eye } from 'lucide-react';
import { formatNaira } from '@/lib/currency';
import { format } from 'date-fns';

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

interface RealTimeExpenseManagerProps {
  userId: string;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onViewExpense?: (expense: Expense) => void;
}

export function RealTimeExpenseManager({ 
  userId, 
  onEditExpense, 
  onDeleteExpense, 
  onViewExpense 
}: RealTimeExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'expense_update') {
        handleExpenseUpdate(message.data);
      }
    },
  });

  // Handle real-time expense updates
  const handleExpenseUpdate = (data: any) => {
    const { action, expense } = data;
    
    setExpenses(prev => {
      switch (action) {
        case 'created':
          return [expense, ...prev];
        case 'updated':
          return prev.map(e => e.id === expense.id ? expense : e);
        case 'deleted':
          return prev.filter(e => e.id !== expense.id);
        default:
          return prev;
      }
    });

    setLastUpdate(new Date());
  };

  // Fetch initial expenses
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Transportation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Utilities': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Entertainment': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Healthcare': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Shopping': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Business': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'Other': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold">Expense Manager</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated: {format(lastUpdate, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <Button
          onClick={fetchExpenses}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNaira(totalExpenses)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(expensesByCategory).length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNaira(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {expenses.filter(e => e.category === category).length} items
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatNaira(amount)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No expenses yet</p>
              <p className="text-sm mt-2">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{expense.merchant}</h4>
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatNaira(Number(expense.amount))}</span>
                      <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                      {expense.notes && (
                        <span className="truncate max-w-xs">
                          {expense.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onViewExpense && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewExpense(expense)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEditExpense && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteExpense && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeExpenseManager;
