import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Eye, Download, Trash2, Lock, Database } from "lucide-react";

export default function PrivacySettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    dataCollection: true,
    analytics: false,
    locationTracking: false,
    crashReporting: true,
    personalizedAds: false,
    thirdPartySharing: false
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Setting Updated",
      description: "Privacy setting has been updated successfully.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Initiated",
      description: "Your data export will be ready in 24-48 hours. You'll receive an email when it's ready.",
    });
  };

  const handleDeleteData = () => {
    if (window.confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
      toast({
        title: "Data Deletion Requested",
        description: "Your data deletion request has been submitted. This process may take up to 30 days.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen overflow-x-hidden">
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
              Privacy Settings
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary" />
                Data Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Basic Usage Data</p>
                  <p className="text-sm text-muted-foreground">Collect anonymous usage statistics</p>
                </div>
                <Switch 
                  checked={settings.dataCollection}
                  onCheckedChange={() => handleToggle('dataCollection')}
                  data-testid="switch-data-collection"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">Help improve the app with usage analytics</p>
                </div>
                <Switch 
                  checked={settings.analytics}
                  onCheckedChange={() => handleToggle('analytics')}
                  data-testid="switch-analytics"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Crash Reporting</p>
                  <p className="text-sm text-muted-foreground">Send crash reports to improve stability</p>
                </div>
                <Switch 
                  checked={settings.crashReporting}
                  onCheckedChange={() => handleToggle('crashReporting')}
                  data-testid="switch-crash-reporting"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-primary" />
                Privacy Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Location Tracking</p>
                  <p className="text-sm text-muted-foreground">Use location for receipt categorization</p>
                </div>
                <Switch 
                  checked={settings.locationTracking}
                  onCheckedChange={() => handleToggle('locationTracking')}
                  data-testid="switch-location"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Personalized Ads</p>
                  <p className="text-sm text-muted-foreground">Show relevant ads based on your data</p>
                </div>
                <Switch 
                  checked={settings.personalizedAds}
                  onCheckedChange={() => handleToggle('personalizedAds')}
                  data-testid="switch-ads"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Third-Party Sharing</p>
                  <p className="text-sm text-muted-foreground">Share data with trusted partners</p>
                </div>
                <Switch 
                  checked={settings.thirdPartySharing}
                  onCheckedChange={() => handleToggle('thirdPartySharing')}
                  data-testid="switch-sharing"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                  className="justify-start h-auto p-4 max-w-sm"
                  data-testid="button-export-data"
                >
                  <Download className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Download all data</p>
                    <p className="text-sm text-muted-foreground">Export your complete account data</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}