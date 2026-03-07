import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit3, Palette } from "lucide-react";
import * as Icons from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

// Category interface comes from shared schema

// Categories are now fetched from the database

const availableIcons = [
  "UtensilsCrossed", "Car", "Zap", "Gamepad2", "Heart", "ShoppingBag", 
  "GraduationCap", "MapPin", "Home", "Briefcase", "CreditCard", "Gift",
  "Coffee", "Fuel", "Smartphone", "Wifi", "Music", "Camera"
];

const availableColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F06292", "#A8E6CF", "#FFB347", "#87CEEB", "#F0E68C"
];

export default function ExpenseCategories() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "ShoppingBag",
    color: "#FF6B6B"
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Fetch categories from backend
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });

  // Mutations for category management
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; icon: string; color: string }) => {
      return apiRequest("/api/categories", "POST", categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      setNewCategory({ name: "", icon: "ShoppingBag", color: "#FF6B6B" });
      toast({
        //title: "Category Added",
        description: "Category has been added successfully.",
        duration: 2000, // ✅ stays only 2 seconds
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive"
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; icon: string; color: string } }) => {
      return apiRequest(`/api/categories/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      setNewCategory({ name: "", icon: "ShoppingBag", color: "#FF6B6B" });
      toast({
        //title: "Category Updated",
        description: "Category has been updated successfully.",
        duration: 2000, // ✅ stays only 2 seconds
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
        duration: 2000, // ✅ stays only 2 seconds
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/categories/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        //title: "Category Deleted",
        description: "Category has been removed successfully.",
        duration: 2000, // ✅ stays only 2 seconds
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
        duration: 2000, // ✅ stays only 2 seconds
      });
    }
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    createCategoryMutation.mutate({
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return;

    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color
      }
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const renderIcon = (iconName: string, color: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    return IconComponent ? <IconComponent className="w-6 h-6" style={{ color }} /> : null;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
        <header className="bg-background border-b border-border sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/expense-manager")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
                Expense Categories
              </h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/expense-manager")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground font-display">
              Expense Categories
            </h1>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-add-category"
                disabled={createCategoryMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a custom expense category with a name, icon, and color.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    data-testid="input-category-name"
                  />
                </div>
                
                <div>
                  <Label>Icon</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {availableIcons.map(iconName => (
                      <Button
                        key={iconName}
                        variant={newCategory.icon === iconName ? "default" : "outline"}
                        size="sm"
                        className="h-12 w-12 p-0"
                        onClick={() => setNewCategory(prev => ({ ...prev, icon: iconName }))}
                        data-testid={`icon-${iconName}`}
                      >
                        {renderIcon(iconName, newCategory.color)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {availableColors.map(color => (
                      <Button
                        key={color}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-2"
                        style={{ backgroundColor: color, borderColor: newCategory.color === color ? "#000" : color }}
                        onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                        data-testid={`color-${color}`}
                      />
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddCategory} 
                  className="w-full" 
                  data-testid="button-save-category"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <main className="pb-20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {renderIcon(category.icon, category.color)}
                    <span>{category.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`button-edit-${category.id}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`button-delete-${category.id}`}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Modify the category name, icon, or color.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  data-testid="input-edit-category-name"
                />
              </div>
              
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {availableIcons.map(iconName => (
                    <Button
                      key={iconName}
                      variant={newCategory.icon === iconName ? "default" : "outline"}
                      size="sm"
                      className="h-12 w-12 p-0"
                      onClick={() => setNewCategory(prev => ({ ...prev, icon: iconName }))}
                    >
                      {renderIcon(iconName, newCategory.color)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {availableColors.map(color => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-2"
                      style={{ backgroundColor: color, borderColor: newCategory.color === color ? "#000" : color }}
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleUpdateCategory} 
                className="w-full" 
                data-testid="button-update-category"
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
}