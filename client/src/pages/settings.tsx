import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { FeedbackModal } from "@/components/feedback-modal";
import { WhatsAppBusiness } from "@/components/whatsapp-business";
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info, 
  LogOut,
  Camera,
  Moon,
  Download,
  Crown,
  Loader2,
  IndianRupee,
  MessageCircle,
  TrendingUp,
  Settings as SettingsIcon,
  Target,
  Wallet,
  CreditCard,
  BookOpen
} from "lucide-react";

export default function Settings() {
  const { user, isAdmin, logout, isLoggingOut } = useAuth();
  const { settings, togglePushNotifications, toggleDarkMode, toggleAutoCapture } = useSettings();
  const { toast } = useToast();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handlePushNotificationToggle = async () => {
    const result = await togglePushNotifications();
    if (!result && !settings.pushNotifications) {
      toast({
        title: "Notification Permission",
        description: "Please allow notifications in your browser settings to enable push notifications.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowSignOutModal(false);
  };

  const cancelLogout = () => {
    setShowSignOutModal(false);
  };

  const handleExportData = () => {
    toast({
      title: "Account Created!",
      description: "Welcome to GrwoFinance. You have been logged in automatically."
    });
  };



  const handleAbout = () => {
    toast({
      title: "About GrwoFinance v1.0.0",
      description: "Your comprehensive business finance platform designed for Nigerian SMEs.\n\nMission:\nAutomate income and expense tracking to save business owners time and improve financial decisions.\n\nVision:\nTo be the leading financial management platform for African businesses.\n\nGoals:\n• Help SMEs achieve 70% reduction in bookkeeping time\n• Support 10,000+ businesses in securing loans through better financial records\n• Provide complete income and expense visibility\n• Expand across West Africa by 2026",
    });
  };



  const userDisplayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || "User";

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Settings" showBack={true} backHref="/expense-manager" />
      
      <main className="pb-20">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 p-4 pt-6">
        {/* Profile Section */}
        <section className="col-span-full">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative" style={{backgroundColor: '#29A378'}}>
                  <User className="w-8 h-8 text-white" />
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{userDisplayName}</h3>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'recently'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* App Settings */}
        {/*
        <section className="col-span-1 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                  <Bell className="w-6 h-6 text-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified about budget alerts</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.pushNotifications}
                  onCheckedChange={handlePushNotificationToggle}
                  data-testid="switch-notifications" 
                  className="flex-shrink-0"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                  <Camera className="w-6 h-6 text-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Auto-Capture</p>
                    <p className="text-sm text-muted-foreground">Automatically detect receipts</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.autoCapture}
                  onCheckedChange={toggleAutoCapture}
                  data-testid="switch-auto-capture" 
                  className="flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        </section>
        
        */}
        

        {/* Financial Settings */}
        <section className="col-span-1 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Financial Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Link href="/budget-settings">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto hover:bg-accent"
                  data-testid="button-budget-settings"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center font-bold text-lg" style={{color: '#29A378'}}>₦</div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Budget Settings</p>
                    <p className="text-sm text-muted-foreground">Set monthly spending limits</p>
                  </div>
                </Button>
              </Link>

              <Link href="/savings-goals">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto hover:bg-accent"
                  data-testid="button-savings-goals"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center font-bold text-lg" style={{color: '#29A378'}}>🎯</div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Savings Goals</p>
                    <p className="text-sm text-muted-foreground">Track and manage savings targets</p>
                  </div>
                </Button>
              </Link>
              
              <Link href="/income-settings">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto hover:bg-accent"
                  data-testid="button-income-settings"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" style={{color: '#29A378'}} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Business Settings</p>
                    <p className="text-sm text-muted-foreground">Edit business information</p>
                  </div>
                </Button>
              </Link>
              
              {/*<Link href="/expense-categories">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto hover:bg-accent"
                  data-testid="button-expense-categories"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6" style={{color: '#EA580C'}} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Expense Categories</p>
                    <p className="text-sm text-muted-foreground">Manage expense categories</p>
                  </div>
                </Button>
              </Link>
              */}

              </CardContent>
          </Card>
        </section>

        {/* Data & Privacy */}
        <section className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-4 py-3 h-auto"
                onClick={handleExportData}
                data-testid="button-export-data"
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <Download className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Export Data</p>
                  <p className="text-sm text-muted-foreground">Download your income & expense data</p>
                </div>
              </Button>
              
              <Link href="/privacy-settings">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto"
                  data-testid="button-privacy-settings"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Privacy Settings</p>
                    <p className="text-sm text-muted-foreground">Control your data usage</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Support & Help */}
        <section className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Support & Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Link href="/help-center">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto"
                  data-testid="button-help-center"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Help Center</p>
                    <p className="text-sm text-muted-foreground">FAQs and tutorials</p>
                  </div>
                </Button>
              </Link>
              
              {isAdmin && (
                <Link href="/api-docs">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-3 h-auto"
                    data-testid="button-api-docs"
                  >
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">API Documentation</p>
                      <p className="text-sm text-muted-foreground">Developer resources</p>
                    </div>
                  </Button>
                </Link>
              )}
              
              <Link href="/contact-support">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto"
                  data-testid="button-contact-support"
                >
                  <div className="w-6 h-6 mr-3 rounded flex items-center justify-center bg-muted">
                    <span className="text-sm font-bold text-foreground">@</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Contact Support</p>
                    <p className="text-sm text-muted-foreground">Get help from our team</p>
                  </div>
                </Button>
              </Link>
              
              {/* Feedback and WhatsApp Support */}
              <div className="flex gap-3 justify-end pt-2">
                <FeedbackModal 
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-fit px-4 py-2"
                      data-testid="button-feedback"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Feedback
                    </Button>
                  }
                />
                
                <WhatsAppBusiness 
                  trigger={
                    <Button 
                      size="sm"
                      className="w-fit px-4 py-2" 
                      style={{ backgroundColor: '#25D366' }}
                      data-testid="button-whatsapp-support"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          </section>

        {/* Subscription Management */}
        <section className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Link href="/subscription">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 h-auto hover:bg-accent"
                  data-testid="button-subscription"
                >
                  <div className="w-6 h-6 mr-3 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" style={{color: '#29A378'}} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium" style={{color: '#29A378'}}>Manage Subscription</p>
                    <p className="text-sm" style={{color: '#29A378', opacity: 0.7}}>Billing & plan details</p>
                  </div>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start px-4 py-3 h-auto"
                onClick={handleAbout}
                data-testid="button-about"
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <Info className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">About GrwoFinance</p>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
              </Button>
              
              {/* Sign Out Button */}
              <div className="flex justify-end mt-4">
                <Button 
                  className="bg-red-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-red-600 shadow-lg text-sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  data-testid="button-sign-out"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Admin Section */}


        </div>
      </main>

      <BottomNavigation />

      {/* Sign Out Confirmation Modal */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              Sign Out
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelLogout}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
