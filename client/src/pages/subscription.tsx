import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/currency";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Check, Crown, CreditCard, Calendar, AlertCircle } from "lucide-react";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Check if returning from Paystack payment
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch("/api/subscription/info");
      const data = await response.json();
      setSubscriptionInfo(data);
    } catch (error) {
      console.error("Failed to fetch subscription info:", error);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await apiRequest("/api/subscription/activate", "POST", { reference });
      const data = await response.json();
      
      toast({
        title: "Payment Successful!",
        description: data.message || "Your subscription has been activated",
      });
      
      // Force refresh both auth and subscription data immediately and with delays
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      fetchSubscriptionInfo();
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        fetchSubscriptionInfo();
      }, 1000);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        fetchSubscriptionInfo();
      }, 2000);
      
      // Clean up URL
      window.history.replaceState({}, '', '/subscription');
    } catch (error) {
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support if payment was deducted",
        variant: "destructive",
      });
    }
  };

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planType: 'monthly' | 'yearly' = 'yearly') => {
    setLoadingPlan(planType);
    try {
      const response = await apiRequest("/api/subscription/create", "POST", { planType });
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
        setLoadingPlan(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade subscription",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  const handleRenewSubscription = async () => {
    setShowRenewModal(false);
    setLoadingPlan('monthly');
    try {
      const response = await apiRequest("/api/subscription/create", "POST", { planType: 'monthly' });
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to create renewal session",
          variant: "destructive",
        });
        setLoadingPlan(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to renew subscription",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    setLoading(true);
    try {
      await apiRequest("/api/subscription/cancel", "POST");
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You'll retain access until your current period ends.",
      });
      // Force refresh auth data and subscription info
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      fetchSubscriptionInfo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Use subscription info for display, fallback to user data
  const isPremium = subscriptionInfo?.subscriptionPlan === "premium" || (user as any)?.subscriptionPlan === "premium";
  const scansUsed = subscriptionInfo?.monthlyScansUsed ?? parseInt((user as any)?.monthlyScansUsed || "0");
  const scansLimit = subscriptionInfo?.scansLimit ?? (isPremium ? -1 : 5); // Updated to 5 to match pricing card
  const invoicesUsed = subscriptionInfo?.monthlyInvoicesUsed ?? 0;
  const invoicesLimit = subscriptionInfo?.invoicesLimit ?? (isPremium ? -1 : 5);
  const savingsGoalsCount = subscriptionInfo?.savingsGoalsCount ?? 0;
  const savingsGoalsLimit = subscriptionInfo?.savingsGoalsLimit ?? (isPremium ? -1 : 1);

  // Show skeleton while auth is loading or subscription info is not yet available
  if (authLoading || !subscriptionInfo) {
    return <FullScreenSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/settings")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
              Subscription
            </h1>
          </div>
        </div>
      </header>

      <main className="pb-20 p-4 space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPremium ? <Crown className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-muted-foreground" />}
              Current Plan
            </CardTitle>
            <CardDescription>
              Your current subscription status and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Plan</span>
              <Badge variant={isPremium ? "default" : "secondary"} className={isPremium ? "bg-primary" : ""}>
                {isPremium ? "Premium" : "Freemium"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant={subscriptionInfo?.subscriptionStatus === "active" ? "default" : 
                              subscriptionInfo?.subscriptionStatus === "canceled" ? "destructive" : "secondary"}>
                {subscriptionInfo?.subscriptionStatus === "active" ? "Active" :
                 subscriptionInfo?.subscriptionStatus === "canceled" ? "Cancelled" : "Freemium"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Monthly Scans Used</span>
              <span className="font-mono">
                {scansUsed} / {scansLimit === -1 ? "Unlimited" : scansLimit}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Monthly Invoices Used</span>
              <span className="font-mono">
                {invoicesUsed} / {invoicesLimit === -1 ? "Unlimited" : invoicesLimit}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Savings Goals Created</span>
              <span className="font-mono">
                {savingsGoalsCount} / {savingsGoalsLimit === -1 ? "Unlimited" : savingsGoalsLimit}
              </span>
            </div>



            {subscriptionInfo?.subscriptionEndDate && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Next Billing Date</span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(subscriptionInfo.subscriptionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {!isPremium && scansUsed >= scansLimit && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">
                  You've reached your monthly scan limit. Upgrade to Premium for unlimited scans.
                </span>
              </div>
            )}

            {!isPremium && invoicesUsed >= invoicesLimit && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">
                  You've reached your monthly invoice limit. Upgrade to Premium for unlimited invoices.
                </span>
              </div>
            )}

            {!isPremium && savingsGoalsCount >= savingsGoalsLimit && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">
                  You've reached your savings goals limit. Upgrade to Premium for unlimited savings goals.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Freemium Plan */}
          <Card className={!isPremium ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Freemium</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(0)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Up to 5 receipt scans</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Up to 5 invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">1 savings goals</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Dashboard Overview</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Income manager module</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Expense manager module</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Financial reports (view only)</span>
              </div>
              {/*<div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Mobile app access</span>
              </div>*/}
              {isPremium && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancelSubscription}
                  disabled={loading}
                >
                  Downgrade to Freemium
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={isPremium ? "border-primary bg-primary/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Premium
              </CardTitle>
              <CardDescription>Complete finance management (Save 20% / yr)</CardDescription>
              <div className="text-3xl font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(3000)}<span className="text-sm font-normal text-muted-foreground">/month</span> <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(28800)}/yr</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Unlimited receipt scans</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Unlimited invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Unlimited savings goals</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Dashboard Overview</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Income manager module</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Expense manager module</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Financial reports in PDF and Excel</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Tax compliance tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Priority customer support</span>
              </div>
              {!isPremium && (
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handleUpgrade('monthly')}
                    disabled={loadingPlan === 'monthly'}
                    data-testid="button-upgrade-monthly"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {loadingPlan === 'monthly' ? "Processing..." : `Get Monthly - ${formatNaira(3000)}/month`}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10"
                    onClick={() => handleUpgrade('yearly')}
                    disabled={loadingPlan === 'yearly'}
                    data-testid="button-upgrade-yearly"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {loadingPlan === 'yearly' ? "Processing..." : `Get Yearly - ${formatNaira(28800)}/year`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Information */}
        {isPremium && subscriptionInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Manage your billing and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionInfo.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Method</span>
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    **** **** **** {subscriptionInfo.paymentMethod.last4}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Renew Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    Extend your premium access with the same plan
                  </p>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowRenewModal(true)}
                  disabled={loadingPlan !== null}
                  data-testid="button-renew-subscription"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {loadingPlan ? "Processing..." : "Renew"}
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Cancel Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    You'll retain access until your current billing period ends
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                  data-testid="button-cancel-subscription"
                >
                  {loading ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Renew Subscription Modal */}
      <Dialog open={showRenewModal} onOpenChange={setShowRenewModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Renew Subscription
            </DialogTitle>
            <DialogDescription>
              Extend your premium access with another month of unlimited features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Monthly Premium Plan</span>
                <span className="font-bold text-primary" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                  {formatNaira(3000)}
                </span>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Unlimited receipt scans</li>
                <li>• Unlimited invoices</li>
                <li>• Tax compliance tools</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRenewModal(false)}
              disabled={loadingPlan !== null}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleRenewSubscription}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'monthly' ? (
                <>
                  <Crown className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Renew Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your premium subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium text-destructive mb-2">
                  What happens when you cancel:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• You'll keep premium access until your current billing period ends</li>
                  <li>• After that, you'll be downgraded to the Freemium plan</li>
                  <li>• Limited to 5 receipt scans and 5 invoices per month</li>
                  <li>• No access to tax compliance tools</li>
                </ul>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>You can resubscribe anytime to regain premium features.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={loading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}