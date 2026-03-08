import { Router, Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Bot } from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import "./websocket-debug-override"; // Import WebSocket debug override early
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Company from "@/pages/company";
import Dashboard from "@/pages/dashboard";
import GlobalDashboard from "@/pages/global-dashboard";
import IncomeManager from "@/pages/income-manager";
import ExpenseManager from "@/pages/expense-manager";
import ManualEntry from "@/pages/manual-entry";
import ExpenseHistory from "@/pages/expense-history";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin";
import BudgetSettings from "@/pages/budget-settings";
import PrivacySettings from "@/pages/privacy-settings";
import HelpCenter from "@/pages/help-center";
import ContactSupport from "@/pages/contact-support";
import ExpenseReports from "@/pages/expense-reports";
import ExpenseCategories from "@/pages/expense-categories";
import Subscription from "@/pages/subscription";
import PaystackCheckout from "@/pages/paystack-checkout";
import AddIncome from "@/pages/add-income";
import CreateInvoice from "@/pages/create-invoice";
import IncomeHistory from "@/pages/income-history";
import IncomeReports from "@/pages/income-reports";
import IncomeSourceManager from "@/pages/income-source-manager";
import IncomeSettings from "@/pages/income-settings";
import InvoiceList from "@/pages/invoice-list";
import InvoiceDocument from "@/pages/invoice-document";
import EditInvoice from "@/pages/edit-invoice";
import EditExpense from "@/pages/edit-expense";
import ScanReceipt from "@/pages/scan-receipt";
import UploadReceipt from "@/pages/upload-receipt";
import SavingsGoals from "@/pages/savings-goals";
import AdminRegister from "@/pages/admin-register";
import ApiDocs from "@/pages/api-docs";
import TaxCompliance from "@/pages/tax-compliance";
import TaxCalendar from "@/pages/tax-calendar";
import WhtTracking from "@/pages/wht-tracking";
import TaxReports from "@/pages/tax-reports";
import TaxReceipts from "@/pages/tax-receipts";
import VatTracking from "@/pages/vat-tracking";
import FileTax from "@/pages/file-tax";
import TaxCalculator from "@/pages/tax-calculator";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  console.log("ProtectedRoute - State:", { isAuthenticated, isLoading, isAdmin, adminOnly });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Bot className="w-16 h-16 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute - Not authenticated, redirecting to /landing");
    return <Redirect to="/landing" />;
  }

  if (adminOnly && !isAdmin) {
    console.log("ProtectedRoute - Admin only but not admin, redirecting to /dashboard");
    return <Redirect to="/dashboard" />;
  }

  console.log("ProtectedRoute - Access granted, rendering component");
  return <Component />;
}

// Create stable component references to prevent remounting
const UploadReceiptRoute = () => <ProtectedRoute component={UploadReceipt} />;
const ScanReceiptRoute = () => <ProtectedRoute component={ScanReceipt} />;
const ExpenseManagerRoute = () => <ProtectedRoute component={ExpenseManager} />;
const IncomeManagerRoute = () => <ProtectedRoute component={IncomeManager} />;
const ManualEntryRoute = () => <ProtectedRoute component={ManualEntry} />;
const ExpenseHistoryRoute = () => <ProtectedRoute component={ExpenseHistory} />;
const ReportsRoute = () => <ProtectedRoute component={Reports} />;
const SettingsRoute = () => <ProtectedRoute component={Settings} />;
const ProfileRoute = () => <ProtectedRoute component={Profile} />;
const BudgetSettingsRoute = () => <ProtectedRoute component={BudgetSettings} />;
const PrivacySettingsRoute = () => <ProtectedRoute component={PrivacySettings} />;
const HelpCenterRoute = () => <ProtectedRoute component={HelpCenter} />;
const ContactSupportRoute = () => <ProtectedRoute component={ContactSupport} />;
const ExpenseCategoriesRoute = () => <ProtectedRoute component={ExpenseCategories} />;
const SubscriptionRoute = () => <ProtectedRoute component={Subscription} />;
const PaystackCheckoutRoute = () => <ProtectedRoute component={PaystackCheckout} />;
const AddIncomeRoute = () => <ProtectedRoute component={AddIncome} />;
const CreateInvoiceRoute = () => <ProtectedRoute component={CreateInvoice} />;
const InvoiceListRoute = () => <ProtectedRoute component={InvoiceList} />;
const InvoiceDocumentRoute = (props: any) => <ProtectedRoute component={(p: any) => <InvoiceDocument {...p} {...props} />} />;
const EditInvoiceRoute = (props: any) => <ProtectedRoute component={(p: any) => <EditInvoice {...p} {...props} />} />;
const ExpenseReportsRoute = () => <ProtectedRoute component={ExpenseReports} />;
const IncomeHistoryRoute = () => <ProtectedRoute component={IncomeHistory} />;
const IncomeReportsRoute = () => <ProtectedRoute component={IncomeReports} />;
const IncomeSettingsRoute = () => <ProtectedRoute component={IncomeSettings} />;
const IncomeSourceManagerRoute = () => <ProtectedRoute component={IncomeSourceManager} />;
const SavingsGoalsRoute = () => <ProtectedRoute component={SavingsGoals} />;
const AdminDashboardRoute = () => <ProtectedRoute component={AdminDashboard} adminOnly={true} />;

function AppRouter() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  console.log("AppRouter - Auth state:", { isAuthenticated, isAdmin, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Bot className="w-16 h-16 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Define the home component based on user role
  const HomeComponent = () => {
    console.log("HomeComponent - Checking auth:", { isAuthenticated, isAdmin });
    if (!isAuthenticated) {
      console.log("HomeComponent - Returning Landing page");
      return <Landing />;
    }
    if (isAdmin) {
      console.log("HomeComponent - Returning AdminDashboard");
      return <AdminDashboard />;
    }
    console.log("HomeComponent - Returning GlobalDashboard");
    return <GlobalDashboard />;
  };

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={isAuthenticated ? HomeComponent : Login} />
      <Route path="/register" component={isAuthenticated ? HomeComponent : Register} />
      <Route path="/admin-register" component={isAuthenticated ? HomeComponent : AdminRegister} />
      <Route path="/company" component={Company} />
      
      {/* Protected routes */}
      <Route path="/" component={HomeComponent} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={GlobalDashboard} />} />
      <Route path="/income-manager" component={() => <ProtectedRoute component={IncomeManager} />} />
      <Route path="/income-source-manager" component={() => <ProtectedRoute component={IncomeSourceManager} />} />
      <Route path="/expense-manager" component={() => <ProtectedRoute component={ExpenseManager} />} />
      <Route path="/manual-entry" component={() => <ProtectedRoute component={ManualEntry} />} />
      <Route path="/expense-history" component={() => <ProtectedRoute component={ExpenseHistory} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/budget-settings" component={() => <ProtectedRoute component={BudgetSettings} />} />
      <Route path="/privacy-settings" component={() => <ProtectedRoute component={PrivacySettings} />} />
      <Route path="/help-center" component={() => <ProtectedRoute component={HelpCenter} />} />
      <Route path="/contact-support" component={() => <ProtectedRoute component={ContactSupport} />} />
      <Route path="/expense-categories" component={() => <ProtectedRoute component={ExpenseCategories} />} />
      <Route path="/subscription" component={() => <ProtectedRoute component={Subscription} />} />
      <Route path="/checkout" component={() => <ProtectedRoute component={PaystackCheckout} />} />
      <Route path="/add-income" component={() => <ProtectedRoute component={AddIncome} />} />
      <Route path="/create-invoice" component={() => <ProtectedRoute component={CreateInvoice} />} />
      <Route path="/invoice-list" component={() => <ProtectedRoute component={InvoiceList} />} />
      <Route path="/invoice/:id" component={() => <ProtectedRoute component={InvoiceDocument} />} />
      <Route path="/edit-invoice/:id" component={() => <ProtectedRoute component={EditInvoice} />} />
      <Route path="/edit-expense/:id" component={() => <ProtectedRoute component={EditExpense} />} />
      <Route path="/expense-reports" component={() => <ProtectedRoute component={ExpenseReports} />} />
      <Route path="/income-history" component={() => <ProtectedRoute component={IncomeHistory} />} />
      <Route path="/income-reports" component={() => <ProtectedRoute component={IncomeReports} />} />
      <Route path="/income-settings" component={() => <ProtectedRoute component={IncomeSettings} />} />
      <Route path="/scan-receipt" component={() => <ProtectedRoute component={ScanReceipt} />} />
      <Route path="/upload-receipt" component={UploadReceiptRoute} />
      <Route path="/savings-goals" component={() => <ProtectedRoute component={SavingsGoals} />} />
      <Route path="/tax-compliance" component={() => <ProtectedRoute component={TaxCompliance} />} />
      <Route path="/tax-calendar" component={() => <ProtectedRoute component={TaxCalendar} />} />
      <Route path="/tax-calculator" component={() => <ProtectedRoute component={TaxCalculator} />} />
      <Route path="/vat-tracking" component={() => <ProtectedRoute component={VatTracking} />} />
      <Route path="/wht-tracking" component={() => <ProtectedRoute component={WhtTracking} />} />
      <Route path="/tax-reports" component={() => <ProtectedRoute component={TaxReports} />} />
      <Route path="/tax-receipts" component={() => <ProtectedRoute component={TaxReceipts} />} />
      <Route path="/file-tax" component={() => <ProtectedRoute component={FileTax} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />} />
      <Route path="/api-docs" component={() => <ProtectedRoute component={ApiDocs} adminOnly={true} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <AppRouter />
          <ConditionalBottomNavigation />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ConditionalBottomNavigation() {
  const [location] = useLocation();
  
  // Don't show bottom navigation on landing page
  if (location === '/') {
    return null;
  }
  
  return <BottomNavigation />;
}

export default App;
