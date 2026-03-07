import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Target, Plus, Trash2, TrendingUp } from "lucide-react";
import { formatNaira } from "@/lib/currency";

// Fetch wrapper for react-query
async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, { 
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${url} returned ${res.status} ${res.statusText} ${text ? "- " + text : ""}`);
  }

  // ✅ Handle empty responses (204 No Content)
  if (res.status === 204) return null;

  return res.json();
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function SavingsGoals() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for new goal
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    category: "general"
  });

  // Currency formatting function
  const formatCurrencyInput = (value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");
    
    // Split by decimal point
    const parts = cleanValue.split(".");
    const integerPart = parts[0] || "";
    const decimalPart = parts[1] || "";
    
    // Add commas to integer part (thousands separator)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Fetch savings goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/savings-goals"],
    queryFn: () => fetchJson("/api/savings-goals"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add new goal mutation
  const addGoalMutation = useMutation({
    mutationFn: (goalData: typeof newGoal) => 
      fetchJson("/api/savings-goals", {
        method: "POST",
        body: JSON.stringify({
          name: goalData.name,
          targetAmount: goalData.targetAmount.replace(/,/g, ""),
          deadline: new Date(goalData.deadline).toISOString(),
          category: goalData.category,
        }),

      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      setNewGoal({ name: "", targetAmount: "", deadline: "", category: "general" });
      setIsAddingGoal(false);
      toast({
        title: "Goal Added",
        description: "Your savings goal has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add savings goal.",
        variant: "destructive",
      });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => {
      console.log('🚀 Attempting to delete goal:', goalId);
      console.log('🚀 Goal ID type:', typeof goalId, 'value:', goalId);
      return fetchJson(`/api/savings-goals/${goalId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data) => {
      console.log('✅ Goal deleted successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Goal Deleted",
        description: "Savings goal has been removed.",
      });
    },
    onError: (error) => {
      console.error('❌ Delete goal error:', error);
      toast({
        title: "Error",
        description: "Failed to delete savings goal.",
        variant: "destructive",
      });
    },
  });

  // Update goal amount mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      fetchJson(`/api/savings-goals/${goalId}`, {
        method: "PUT",
        body: JSON.stringify({ currentAmount: amount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Goal Updated",
        description: "Savings goal progress has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update savings goal.",
        variant: "destructive",
      });
    },
  });

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    addGoalMutation.mutate(newGoal);
  };

  const handleDeleteGoal = (goalId: string) => {
    console.log('Delete button clicked for goal:', goalId);
    setDeleteGoalId(goalId);
  };

  const confirmDeleteGoal = () => {
    console.log('Confirm delete called for goal:', deleteGoalId);
    if (deleteGoalId) {
      deleteGoalMutation.mutate(deleteGoalId);
      setDeleteGoalId(null);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const calculateDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <header className="bg-background border-b border-border sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")} data-testid="button-back">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">Savings Goals</h1>
            </div>
            <div className="hidden lg:block" />
          </div>
        </header>
        <main className="pb-20 p-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading savings goals...</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">Savings Goals</h1>
          </div>
          <div className="hidden lg:block" />
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Add New Goal Button */}
          <Card className="mb-6">
            <CardContent className="p-4">
              {!isAddingGoal ? (
                <Button 
                  onClick={() => setIsAddingGoal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Savings Goal
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input
                      id="goal-name"
                      placeholder="e.g., Emergency Fund, Vacation, New Car"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target-amount">Target Amount (₦)</Label>
                      <Input
                        id="target-amount"
                        type="text"
                        placeholder="100,000"
                        value={formatCurrencyInput(newGoal.targetAmount)}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadline">Target Date</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full p-2 border rounded-md"
                      value={newGoal.category}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="general">General</option>
                      <option value="emergency">Emergency Fund</option>
                      <option value="vacation">Vacation</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="home">Home</option>
                      <option value="education">Education</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddGoal} disabled={addGoalMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {addGoalMutation.isPending ? "Adding..." : "Add Goal"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingGoal(false);
                        setNewGoal({ name: "", targetAmount: "", deadline: "", category: "general" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings Goals List */}
          {goals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first savings goal to track your progress.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal: SavingsGoal) => {
                const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                const daysRemaining = calculateDaysRemaining(goal.deadline);
                const isCompleted = progress >= 100;
                
                return (
                  <Card key={goal.id} className={isCompleted ? "border-green-200 bg-green-50" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <AlertDialog open={deleteGoalId === goal.id} onOpenChange={(open) => {
                          console.log('🔍 Modal state change:', { goalId: goal.id, open, wasOpen: deleteGoalId === goal.id });
                          if (!open && deleteGoalId === goal.id) {
                            setDeleteGoalId(null);
                          }
                        }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              console.log('🔍 Delete button onClick triggered:', { goalId: goal.id, event: e });
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteGoal(goal.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this savings goal? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteGoalId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => confirmDeleteGoal()}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">{goal.category}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${isCompleted ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Current:</span>
                            <span className="font-medium" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(goal.currentAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Target:</span>
                            <span className="font-medium" style={{ fontFamily: '"Share Tech Mono", monospace' }}>{formatNaira(goal.targetAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Remaining:</span>
                            <span className="font-medium" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                              {formatNaira(Math.max(0, goal.targetAmount - goal.currentAmount))}
                            </span>
                          </div>
                        </div>

                        {/* Deadline */}
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span>Days left:</span>
                            <span className={`font-medium ${daysRemaining <= 30 ? "text-orange-500" : ""}`}>
                              {daysRemaining} days
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Add to Goal Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const amount = prompt("Enter amount to add to this goal:");
                            if (amount && !isNaN(parseFloat(amount))) {
                              updateGoalMutation.mutate({
                                goalId: goal.id,
                                amount: goal.currentAmount + parseFloat(amount)
                              });
                            }
                          }}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Add to Goal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
