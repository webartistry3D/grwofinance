import { Card, CardContent } from "@/components/ui/card";
import { getCategoryColors, getCategoryIcon } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";
import { type Expense } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { History, Search, Filter, Download, TrendingDown, Trash2, Edit3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert relative image URLs to absolute backend URLs
const getImageUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return '';
  
  // If it's already an absolute URL, return as-is
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // Always use port 5000 for backend (hardcoded for development)
  const origin = window.location.origin;
  const backendUrl = origin.includes('5173') || origin.includes('5174') 
    ? origin.replace(/:517[34]/, ':5000')
    : 'http://localhost:5000';
  
  const fullUrl = `${backendUrl}${imageUrl}`;
  
  // Debug logging
  console.log('🔍 Image URL Debug:');
  console.log('  - Original imageUrl:', imageUrl);
  console.log('  - Current origin:', origin);
  console.log('  - Backend URL:', backendUrl);
  console.log('  - Full URL:', fullUrl);
  
  return fullUrl;
};

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const [showReceipt, setShowReceipt] = useState(false);
  const { color, bgColor } = getCategoryColors(expense.category);
  const icon = getCategoryIcon(expense.category);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/expenses/${expense.id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Expense Deleted",
        description: `${expense.merchant} expense has been deleted successfully.`,
      });
      // Invalidate expenses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Debug logging - make this more visible
  console.log("🖼️🖼️🖼️ ExpenseCard RENDERING for expense:", expense.id);
  console.log("🖼️🖼️🖼️ Merchant:", expense.merchant);
  console.log("🖼️🖼️🖼️ imageUrl:", expense.imageUrl ? `EXISTS (${expense.imageUrl.length} chars)` : "NONE");
  console.log("🖼️🖼️🖼️ imageUrl starts with:", expense.imageUrl?.substring(0, 50));
  
  // Test image accessibility
  if (expense.imageUrl) {
    const absoluteUrl = getImageUrl(expense.imageUrl);
    console.log("🔍 Testing image URL:", absoluteUrl);
    
    // Test if image loads
    const img = new Image();
    img.onload = () => console.log("✅ Image loads successfully:", absoluteUrl);
    img.onerror = () => console.log("❌ Image failed to load:", absoluteUrl);
    img.src = absoluteUrl;
  }
  
  return (
    <Card className="shadow-sm" data-testid={`expense-card-${expense.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Show receipt thumbnail if available, otherwise show category icon */}
            {expense.imageUrl ? (
              <div className="relative">
                <img 
                  src={getImageUrl(expense.imageUrl)} 
                  alt="Receipt"
                  className="w-10 h-10 object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowReceipt(!showReceipt)}
                  onLoad={() => console.log('✅ Thumbnail loaded successfully')}
                  onError={(e) => {
                    console.error('❌ Thumbnail failed to load:', getImageUrl(expense.imageUrl));
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
            ) : (
              <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                <i className={`${icon} ${color} text-sm`} />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground" data-testid={`text-merchant-${expense.id}`}>
                {expense.merchant}
              </p>
              <p className="text-sm text-muted-foreground capitalize" data-testid={`text-category-${expense.id}`}>
                {expense.category}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`text-date-${expense.id}`}>
                {format(new Date(expense.date), 'MMM dd, yyyy')}
              </p>
              {expense.imageUrl && (
                <p className="text-xs text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => setShowReceipt(!showReceipt)}>
                  {showReceipt ? 'Hide' : 'View'} Receipt
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground" data-testid={`text-amount-${expense.id}`}>
              {formatNaira(expense.amount)}
            </p>
            
            {/* Show VAT and WHT details if available */}
            {(expense.vatAmount && parseFloat(expense.vatAmount) > 0) && (
              <p className="text-xs text-blue-600" data-testid={`text-vat-amount-${expense.id}`}>
                VAT: {formatNaira(expense.vatAmount)} ({expense.vatRate}%)
              </p>
            )}
            
            {(expense.whtAmount && parseFloat(expense.whtAmount) > 0) && (
              <p className="text-xs text-purple-600" data-testid={`text-wht-amount-${expense.id}`}>
                WHT: {formatNaira(expense.whtAmount)} ({expense.whtRate}%)
              </p>
            )}
            
            {(expense.netAmount && parseFloat(expense.netAmount) !== parseFloat(expense.amount)) && (
              <p className="text-xs text-green-600 font-medium" data-testid={`text-net-amount-${expense.id}`}>
                Net: {formatNaira(expense.netAmount)}
              </p>
            )}
            
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            
            {/* Edit Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => window.location.href = `/edit-expense/${expense.id}`}
              data-testid={`button-edit-${expense.id}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                  data-testid={`button-delete-${expense.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the expense from <strong>{expense.merchant}</strong> for <strong>{formatNaira(expense.amount)}</strong>?
                    <br /><br />
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteExpenseMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Receipt Image Preview */}
        {expense.imageUrl && (
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showReceipt ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-4 border-t">
              <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 p-2">
                <img 
                  src={getImageUrl(expense.imageUrl)} 
                  alt="Receipt"
                  className="w-full h-auto max-h-64 object-contain cursor-pointer"
                  onClick={() => {
                    // Open in new tab for full view
                    if (expense.imageUrl) {
                      window.open(getImageUrl(expense.imageUrl), '_blank');
                    }
                  }}
                  onLoad={() => console.log('✅ Full receipt loaded successfully')}
                  onError={(e) => {
                    console.error('❌ Full receipt failed to load:', getImageUrl(expense.imageUrl));
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click to view full size
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
