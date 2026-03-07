import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle, CheckCircle, Plus, Bell, ArrowLeft } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FullScreenSkeleton from "@/components/FullScreenSkeleton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Header } from "@/components/header";

interface TaxCalendarItem {
  id: string;
  taxType: string;
  title: string;
  description?: string;
  dueDate: string;
  reminderDate?: string;
  status: string;
  isRecurring: boolean;
  recurringFrequency?: string;
}

export default function TaxCalendar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch tax calendar using React Query
  const { data: taxCalendar = [], isLoading, error } = useQuery<TaxCalendarItem[]>({
    queryKey: ['/api/tax/calendar'],
    queryFn: async () => {
      const response = await apiRequest("/api/tax/calendar", "GET");
      return response.json();
    },
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTaxTypeColor = (taxType: string) => {
    switch (taxType) {
      case "VAT":
        return "bg-blue-100 text-blue-800";
      case "WHT":
        return "bg-purple-100 text-purple-800";
      case "CIT":
        return "bg-green-100 text-green-800";
      case "PAYE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString();
  };

  const isDueSoon = (dueDate: string) => {
    const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  };

  // Show skeleton while auth is loading or data is loading
  if (authLoading || isLoading) {
    return <FullScreenSkeleton />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background min-h-screen">
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error instanceof Error ? error.message : "Failed to load tax calendar"}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tax/calendar'] })}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Tax Calendar" showBack={true} backHref="/tax-compliance" />
      
      <main className="pb-20 px-3 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {taxCalendar.filter(item => isOverdue(item.dueDate)).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {taxCalendar.filter(item => isDueSoon(item.dueDate)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {taxCalendar.filter(item => item.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Calendar Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Tax Filing Schedule
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </CardTitle>
            <CardDescription>
              Track your tax filing deadlines and set reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {taxCalendar.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tax reminders set</p>
                <p className="text-sm mt-2">Add your first tax reminder to get started</p>
              </div>
            ) : (
              taxCalendar.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border ${
                    isOverdue(item.dueDate) ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 
                    isDueSoon(item.dueDate) ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTaxTypeColor(item.taxType)}>
                          {item.taxType}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </Badge>
                        {item.isRecurring && (
                          <Badge variant="outline">
                            {item.recurringFrequency}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        </div>
                        {item.reminderDate && (
                          <div className="flex items-center gap-1">
                            <Bell className="w-4 h-4" />
                            <span>Reminder: {new Date(item.reminderDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {item.status !== "completed" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              await apiRequest(`/api/tax/calendar/${item.id}`, "PATCH", {
                                status: "completed"
                              });
                              
                              queryClient.invalidateQueries({ queryKey: ['/api/tax/calendar'] });
                              
                              toast({
                                title: "Tax filing marked as completed",
                                description: "Great job staying compliant!",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update tax calendar status",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
