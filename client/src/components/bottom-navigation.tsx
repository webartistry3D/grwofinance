import { Home, List, BarChart3, Settings, Shield, Users, Edit3, TrendingUp, TrendingDown, Crown } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const userNavItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/income-manager", label: "Income", icon: TrendingUp },
  { path: "/expense-manager", label: "Expense", icon: TrendingDown },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { path: "/admin", label: "Admin", icon: Crown },
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/income-manager", label: "Income", icon: TrendingUp },
  { path: "/expense-manager", label: "Expense", icon: TrendingDown },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md lg:max-w-lg xl:max-w-xl bg-background border-t border-border px-4 py-2 z-30">
      <div className="flex justify-center items-center gap-2 lg:gap-4 xl:gap-6">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location === item.path || 
                         (item.path === "/income-manager" && (
                           location === "/income-history" || 
                           location === "/invoice-list" || 
                           location === "/income-source-manager" ||
                           location === "/add-income" ||
                           location === "/create-invoice" ||
                           location === "/income-reports" ||
                           (location.startsWith("/invoice/") && location !== "/invoice-list")
                         )) ||
                         (item.path === "/expense-manager" && (
                           location === "/expense-history" || 
                           location === "/receipt-list" || 
                           location === "/expense-category-manager" ||
                           location === "/manual-entry" ||
                           location === "/upload-receipt" ||
                           location === "/expense-reports" ||
                           location === "/tax-compliance" ||
                           location === "/tax-calendar" ||
                           location === "/tax-reports" ||
                           location === "/tax-receipts" ||
                           location === "/wht-tracking" ||
                           location === "/vat-tracking"
                         ));
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center py-2 px-2 lg:px-4 transition-colors min-w-0 flex-1 max-w-[80px] lg:max-w-none lg:flex-initial ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`} 
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 mb-1" />
              <span className="text-xs lg:text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
