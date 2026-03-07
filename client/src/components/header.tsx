import { Bell, User, Bot, ArrowLeft, Sun, Moon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/use-settings";

interface HeaderProps {
  title?: string | React.ReactNode;
  showBack?: boolean;
  backHref?: string;
}

export function Header({ title = "GrwoFinance", showBack = false, backHref = "/" }: HeaderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { settings, toggleDarkMode } = useSettings();

  const { data: notifications } = useQuery<{notifications: any[], count: number}>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = (actionLink?: string) => {
    if (actionLink) {
      setLocation(actionLink);
      setShowNotifications(false);
    }
  };

  const handleProfile = () => {
    setLocation("/profile");
  };

  const handleThemeToggle = () => {
    toggleDarkMode();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-border sticky">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {showBack ? (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="w-8 h-8 lg:w-10 lg:h-10" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
              </Button>
            </Link>
          ) : (
            <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
          )}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground font-display truncate" data-testid="header-title">
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            onClick={handleThemeToggle}
            data-testid="button-theme-toggle"
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            )}
          </Button>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 relative"
              onClick={handleNotifications}
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {notifications && notifications.count > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-xs flex items-center justify-center p-0"
                  style={{backgroundColor: '#EA580C'}}
                  variant="destructive"
                >
                  {notifications.count > 9 ? '9+' : notifications.count}
                </Badge>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto z-50">
                <Card className="shadow-lg border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {notifications && notifications.count && notifications.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {notifications.count}
                        </Badge>
                      )}
                    </div>
                    
                    {notifications && notifications.notifications && notifications.notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.notifications.map((notification: any) => (
                          <div
                            key={notification.id}
                            className="p-3 rounded-lg bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => handleNotificationClick(notification.actionLink)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                {notification.actionText && (
                                  <p className="text-xs text-primary font-medium">
                                    {notification.actionText} →
                                  </p>
                                )}
                              </div>
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No new notifications
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-muted hover:bg-accent ml-1"
            onClick={handleProfile}
            data-testid="button-profile"
          >
            <User className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      {/* Overlay to close notifications when clicking outside */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}
