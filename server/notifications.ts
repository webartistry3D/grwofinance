import { storage } from "./storage";

export interface Notification {
  id: string;
  userId: string;
  type: "subscription_expiry" | "scan_limit" | "payment_failed" | "general";
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: Date;
}

// Get notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const user = await storage.getUserById(userId);
  if (!user) return [];

  const notifications: Notification[] = [];

  // Check for subscription expiry notification
  if (user.subscriptionPlan === "premium" && user.subscriptionStatus === "active" && user.subscriptionEndDate) {
    const expiryDate = new Date(user.subscriptionEndDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    if (expiryDate <= sevenDaysFromNow) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      notifications.push({
        id: `expiry_${userId}`,
        userId,
        type: "subscription_expiry",
        title: "Subscription Expiring Soon",
        message: daysUntilExpiry <= 0 
          ? "Your premium subscription has expired. Renew now to continue enjoying unlimited scans."
          : `Your premium subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Renew now to avoid interruption.`,
        actionLink: "/subscription",
        actionText: "Renew Subscription",
        isRead: false,
        createdAt: new Date()
      });
    }
  }

  // Check for scan limit notification (for freemium users)
  if (user.subscriptionPlan === "freemium") {
    const scansUsed = parseInt(user.monthlyScansUsed);
    if (scansUsed >= 8) { // Warning when close to limit
      notifications.push({
        id: `scan_limit_${userId}`,
        userId,
        type: "scan_limit",
        title: scansUsed >= 10 ? "Monthly Scan Limit Reached" : "Monthly Scan Limit Almost Reached",
        message: scansUsed >= 10 
          ? "You've used all 10 monthly scans. Upgrade to Premium for unlimited scanning."
          : `You've used ${scansUsed}/10 monthly scans. Upgrade to Premium for unlimited scanning.`,
        actionLink: "/subscription",
        actionText: "Upgrade to Premium",
        isRead: false,
        createdAt: new Date()
      });
    }
  }

  return notifications;
}