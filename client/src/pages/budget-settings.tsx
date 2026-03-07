import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Target } from "lucide-react";
import { formatNaira } from "@/lib/currency";

/**
 * Budget settings UI:
 * - Fetches user settings from /api/user/settings
 * - Persists budgets to /api/user/settings (PUT)
 * - Does not overwrite local state if backend returns empty/undefined
 */

type CategoryBudgets = Record<
  "food" | "transport" | "utilities" | "entertainment" | "healthcare" | "shopping",
  string
>;

const DEFAULT_CATEGORY_BUDGETS: CategoryBudgets = {
  food: "0",
  transport: "0",
  utilities: "0",
  entertainment: "0",
  healthcare: "0",
  shopping: "0",
};

export default function BudgetSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Keep UI values as strings to avoid clobbering while typing
  const [monthlyBudget, setMonthlyBudget] = useState<string>("0");
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>(DEFAULT_CATEGORY_BUDGETS);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // spentAmounts is placeholder — keep it if you want to show actual spent later
  const spentAmounts = {
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    healthcare: 0,
    shopping: 0,
  };

  // Helper: normalize server budgets to our string-based format and merge with defaults
  const normalizeCategoryBudgets = (raw: any): CategoryBudgets => {
    if (!raw || typeof raw !== "object") return { ...DEFAULT_CATEGORY_BUDGETS };
    return {
      food: raw.food !== undefined && raw.food !== null ? String(raw.food) : DEFAULT_CATEGORY_BUDGETS.food,
      transport:
        raw.transport !== undefined && raw.transport !== null ? String(raw.transport) : DEFAULT_CATEGORY_BUDGETS.transport,
      utilities:
        raw.utilities !== undefined && raw.utilities !== null ? String(raw.utilities) : DEFAULT_CATEGORY_BUDGETS.utilities,
      entertainment:
        raw.entertainment !== undefined && raw.entertainment !== null
          ? String(raw.entertainment)
          : DEFAULT_CATEGORY_BUDGETS.entertainment,
      healthcare:
        raw.healthcare !== undefined && raw.healthcare !== null ? String(raw.healthcare) : DEFAULT_CATEGORY_BUDGETS.healthcare,
      shopping:
        raw.shopping !== undefined && raw.shopping !== null ? String(raw.shopping) : DEFAULT_CATEGORY_BUDGETS.shopping,
    };
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    let mounted = true;
    const controller = new AbortController();

    async function fetchBudgets() {
      try {
        setIsLoading(true);
        // Use the user settings endpoint (your routes provide /api/user/settings)
        const res = await fetch("/api/user/settings", {
          method: "GET",
          credentials: "same-origin",
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });

        if (!mounted) return;

        if (!res.ok) {
          // server returned something unexpected — keep defaults
          console.warn("Failed to fetch user settings:", res.status);
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        // The server returns the userSettings object. Be defensive and resilient:
        // possible shapes:
        // { budgets: { monthlyBudget: 1000, categoryBudgets: { food: 100 } } }
        // or { monthlyBudget: 1000, categoryBudgets: { ... } }
        // or an empty object {}
        const serverBudgets = data?.budgets ?? null;
        const monthlyFromServer =
          serverBudgets?.monthlyBudget ?? data?.monthlyBudget ?? serverBudgets?.monthly ?? data?.monthly ?? undefined;

        if (monthlyFromServer !== undefined && monthlyFromServer !== null) {
          // only update if server truly provided a value
          setMonthlyBudget(String(monthlyFromServer));
        }

        const categoryFromServer =
          serverBudgets?.categoryBudgets ?? data?.categoryBudgets ?? serverBudgets ?? data ?? null;

        // If the server provides category budget values (object with keys), merge them
        // otherwise keep existing local categories (prevents overwriting with empty object)
        if (categoryFromServer && typeof categoryFromServer === "object") {
          setCategoryBudgets(normalizeCategoryBudgets(categoryFromServer));
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // ignore
        } else {
          console.error("Failed to fetch budgets", err);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchBudgets();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save budgets to backend: PUT /api/user/settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // convert UI strings to numbers (server can store whatever shape you expect)
      const numericCategoryBudgets: Record<string, number> = {};
      Object.entries(categoryBudgets).forEach(([k, v]) => {
        const n = parseInt(v.replace(/[^0-9]/g, "")) || 0;
        numericCategoryBudgets[k] = n;
      });

      const payload = {
        // store budgets under a budgets key to avoid clashing with other user settings
        budgets: {
          monthlyBudget: parseInt(monthlyBudget.replace(/[^0-9]/g, "")) || 0,
          categoryBudgets: numericCategoryBudgets,
        },
      };

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to save (${res.status})`);
      }

      const saved = await res.json();

      // If server returned stored values, normalize them back into UI
      const savedBudgets = saved?.budgets ?? saved ?? null;

      if (savedBudgets) {
        if (savedBudgets.monthlyBudget !== undefined && savedBudgets.monthlyBudget !== null) {
          setMonthlyBudget(String(savedBudgets.monthlyBudget));
        }

        if (savedBudgets.categoryBudgets && typeof savedBudgets.categoryBudgets === "object") {
          setCategoryBudgets(normalizeCategoryBudgets(savedBudgets.categoryBudgets));
        }
      }

      toast({
        title: "Budget Saved",
        description: "Your budget settings have been updated successfully.",
        duration: 2000,
      });
    } catch (error: any) {
      console.error("Save budgets error:", error);
      toast({
        title: "Save Failed",
        description: error?.message || "Failed to save budget settings.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate cumulative remaining budget
  const calculateCumulativeRemaining = (currentCategory: string) => {
    const totalMonthly = parseInt(monthlyBudget.replace(/[^0-9]/g, "")) || 0;
    let totalAllocated = 0;

    Object.entries(categoryBudgets).forEach(([_, amount]) => {
      totalAllocated += parseInt(String(amount).replace(/[^0-9]/g, "")) || 0;
    });

    return Math.max(0, totalMonthly - totalAllocated);
  };

  const handleReset = () => {
    setMonthlyBudget("0");
    setCategoryBudgets({ ...DEFAULT_CATEGORY_BUDGETS });
    toast({
      title: "Budget Reset",
      description: "Budget settings have been reset to defaults.",
      duration: 3000,
    });
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">Budget Settings</h1>
          </div>
          <div className="hidden lg:block" />
        </div>
      </header>

      <main className="pb-20 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Loading indicator (simple) */}
          {isLoading ? (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Loading budget settings…</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Monthly Budget */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Monthly Budget Limit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="monthly-budget">Set your monthly spending limit</Label>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl mr-2">₦</span>
                      <Input
                        id="monthly-budget"
                        type="text"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value.replace(/[^0-9]/g, ""))}
                        className="text-2xl font-bold"
                        data-testid="input-monthly-budget"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Current limit: {formatNaira(parseInt(monthlyBudget.replace(/[^0-9]/g, "")) || 0)}
                    </p>
                    <p className="text-sm text-primary font-medium mt-1">
                      Total Remaining: {formatNaira(calculateCumulativeRemaining(""))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Budgets */}
            {Object.entries(categoryBudgets).map(([category, amount]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={`budget-${category}`}>Monthly limit</Label>
                    <div className="flex items-center">
                      <span className="mr-2">₦</span>
                      <Input
                        id={`budget-${category}`}
                        type="text"
                        value={amount}
                        onChange={(e) =>
                          setCategoryBudgets((prev) => ({
                            ...prev,
                            [category]: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        data-testid={`input-budget-${category}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatNaira(parseInt(amount.replace(/[^0-9]/g, "")) || 0)}</p>
                    <p className="text-xs text-primary font-medium">
                      Budget Remaining: {formatNaira(calculateCumulativeRemaining(category))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button variant="outline" className="w-auto" onClick={handleReset} data-testid="button-reset-budget">
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="w-auto bg-primary hover:bg-primary/90"
              data-testid="button-save-budget"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}


/*
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Target } from "lucide-react";
import { formatNaira } from "@/lib/currency";

export default function BudgetSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [monthlyBudget, setMonthlyBudget] = useState("0");
  const [categoryBudgets, setCategoryBudgets] = useState({
    food: "0",
    transport: "0",
    utilities: "0",
    entertainment: "0",
    healthcare: "0",
    shopping: "0"
  });

  // Calculate spent amounts for budget remaining (mock data for now)
  const spentAmounts = {
    food: 0,
    transport: 0,
    utilities: 0,
    entertainment: 0,
    healthcare: 0,
    shopping: 0
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    async function fetchBudgets() {
      try {
        // Replace with real API call
        const res = await fetch("/api/budgets");
        const data = await res.json();

        setMonthlyBudget(data.monthlyBudget || "0");
        setCategoryBudgets(data.categoryBudgets || {});
      } catch (error) {
        console.error("Failed to fetch budgets", error);
      }
    }

    fetchBudgets();

  }, []);

  useEffect(() => {
    
  }, []);




  const handleSave = () => {
    toast({
      title: "Budget Saved",
      description: "Your budget settings have been updated successfully.",
    });
  };

  // Calculate cumulative remaining budget
  const calculateCumulativeRemaining = (currentCategory: string) => {
    const totalMonthly = parseInt(monthlyBudget) || 0;
    let totalAllocated = 0;
    
    // Sum all category budgets including the current one being displayed
    Object.entries(categoryBudgets).forEach(([category, amount]) => {
      totalAllocated += parseInt(amount) || 0;
    });
    
    return Math.max(0, totalMonthly - totalAllocated);
  };

  const handleReset = () => {
    setMonthlyBudget("0");
    setCategoryBudgets({
      food: "0",
      transport: "0", 
      utilities: "0",
      entertainment: "0",
      healthcare: "0",
      shopping: "0"
    });
    toast({
      title: "Budget Reset",
      description: "Budget settings have been reset to defaults.",
    });
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
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
              Budget Settings
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Monthly Budget /}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Monthly Budget Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthly-budget">Set your monthly spending limit</Label>
                  <div className="flex items-center mt-2">
                    <span className="text-2xl mr-2">₦</span>
                    <Input
                      id="monthly-budget"
                      type="text"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-2xl font-bold"
                      data-testid="input-monthly-budget"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current limit: {formatNaira(parseInt(monthlyBudget) || 0)}
                  </p>
                  <p className="text-sm text-primary font-medium mt-1">
                    Total Remaining: {formatNaira(calculateCumulativeRemaining(''))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Budgets /}
          {Object.entries(categoryBudgets).map(([category, amount]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`budget-${category}`}>Monthly limit</Label>
                  <div className="flex items-center">
                    <span className="mr-2">₦</span>
                    <Input
                      id={`budget-${category}`}
                      type="text"
                      value={amount}
                      onChange={(e) => setCategoryBudgets(prev => ({
                        ...prev,
                        [category]: e.target.value.replace(/[^0-9]/g, '')
                      }))}
                      data-testid={`input-budget-${category}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(parseInt(amount) || 0)}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    Budget Remaining: {formatNaira(calculateCumulativeRemaining(category))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons /}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button 
            variant="outline" 
            className="w-auto"
            onClick={handleReset}
            data-testid="button-reset-budget"
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave}
            className="w-auto bg-primary hover:bg-primary/90"
            data-testid="button-save-budget"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}*/