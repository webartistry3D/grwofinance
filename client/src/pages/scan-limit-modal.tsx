import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { formatNaira } from "@/lib/currency";

interface ScanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  scansUsed: number;
  scansLimit: number;
  userPlan: "freemium" | "premium";
}

export default function ScanLimitModal({ 
  isOpen, 
  onClose, 
  scansUsed, 
  scansLimit, 
  userPlan 
}: ScanLimitModalProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onClose();
    setLocation("/subscription");
  };

  const isNearLimit = userPlan === "freemium" && scansUsed >= 8;
  const hasReachedLimit = userPlan === "freemium" && scansUsed >= scansLimit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasReachedLimit ? (
              <>
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Scan Limit Reached
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 text-primary" />
                Upgrade to Premium
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasReachedLimit 
              ? "You've used all 10 of your monthly scans. Upgrade to Premium for unlimited scanning."
              : `You've used ${scansUsed} of your ${scansLimit} monthly scans. Consider upgrading for unlimited access.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Plan Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <Badge variant="secondary">Freemium</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Scans Used</p>
              <p className="text-lg font-bold">{scansUsed} / {scansLimit}</p>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">With Premium you get:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited receipt scans</li>
              <li>• Advanced AI categorization</li>
              <li>• Professional reports</li>
              <li>• Budget alerts & tracking</li>
              <li>• Business loan support</li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Plan</p>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(28800)}/year - Save 20%</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(3000)}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {hasReachedLimit ? "Maybe Later" : "Continue with Freemium"}
            </Button>
            <Button onClick={handleUpgrade} className="flex-1 bg-primary hover:bg-primary/90">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}