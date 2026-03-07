import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryColors, getCategoryIcon, getCategoryById } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";

interface CategoryChartProps {
  categoryTotals: Record<string, number>;
}

export function CategoryChart({ categoryTotals }: CategoryChartProps) {
  const maxAmount = Math.max(...Object.values(categoryTotals));
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categoryTotals).map(([categoryId, amount]) => {
          const { color, bgColor } = getCategoryColors(categoryId);
          const icon = getCategoryIcon(categoryId);
          const category = getCategoryById(categoryId);
          const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
          
          return (
            <div key={categoryId} className="flex items-center justify-between" data-testid={`category-${categoryId}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`${icon} ${color} text-sm`} />
                </div>
                <span className="font-medium text-foreground">{category?.name || categoryId}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground" data-testid={`amount-${categoryId}`}>
                  {formatNaira(amount)}
                </p>
                <div className="w-20 h-2 bg-muted rounded-full mt-1">
                  <div 
                    className={`h-full ${color.replace('text-', 'bg-').replace('-600', '-500')} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
