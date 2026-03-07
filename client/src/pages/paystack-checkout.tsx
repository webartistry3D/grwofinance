import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle, ArrowLeft, CreditCard, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { formatNaira } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaystackCheckout() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("/api/subscription/create", "POST");
      const data = await response.json();
      
      if (data.checkoutUrl) {
        // Redirect to Paystack checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to create checkout session");
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to start payment process",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Upgrade to Premium
          </h1>
          <div></div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Premium Plan Card */}
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">GrwoFinance Premium</CardTitle>
            <CardDescription>
              Unlock unlimited scanning and advanced features for your business
            </CardDescription>
            <div className="text-center mt-4">
              <div className="text-4xl font-bold text-foreground">
                {formatNaira(28800)}
                <span className="text-lg text-muted-foreground font-normal">/year</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Save 20% compared to monthly billing
              </p>
              <Badge variant="secondary" className="mt-2">
                Only {formatNaira(2400)} per month
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">What's included:</h3>
              
              <div className="space-y-2">
                {[
                  "Unlimited receipt scans",
                  "Advanced AI categorization",
                  "Professional expense reports",
                  "Budget tracking & alerts",
                  "Business loan application support",
                  "Priority email support",
                  "Export to Excel/PDF",
                  "Tax-ready financial reports"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-foreground mb-3">Secure Payment Options:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-muted-foreground text-xs">All Nigerian banks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Debit Card</p>
                    <p className="text-muted-foreground text-xs">Visa, Mastercard, Verve</p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Powered by Paystack - Secure, PCI-compliant payments
                <br />
                Optimized for Nigerian businesses with local payment methods
              </p>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleUpgrade}
              disabled={isLoading}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-upgrade-premium"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Premium - {formatNaira(28800)}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Billed annually. Cancel anytime. 
              <br />
              Your subscription will be active immediately after payment.
            </p>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">Secure & Trusted</p>
                <p className="text-gray-600">
                  Complete your payment with GrwoFinance. Your transaction is secured with bank-level encryption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}