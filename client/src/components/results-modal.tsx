import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { processReceipt, type ScannedData } from "@/lib/ocr";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category: string; notes: string }) => void;
  ocrResult: ScannedData | null;
}

export function ResultsModal({ isOpen, onClose, onSave, ocrResult }: ResultsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('groceries');
  const [notes, setNotes] = useState('');

  if (!isOpen || !ocrResult) return null;

  const handleSave = () => {
    onSave({ category: selectedCategory, notes });
  };

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Review & Save</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-close-results"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Extracted Data */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Extracted Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-medium text-foreground" data-testid="text-extracted-merchant">
                  {ocrResult.merchant}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground" data-testid="text-extracted-date">
                  {ocrResult.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-lg text-primary" data-testid="text-extracted-amount">
                  {formatNaira(ocrResult.amount || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {(ocrResult.items || []).length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="items-list">
                  {(ocrResult.items || []).map((item: string, index: number) => (
                    <div key={index} className="text-sm text-foreground" data-testid={`item-${index}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this expense..."
              rows={3}
              data-testid="textarea-notes"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-background space-y-3">
          <Button 
            onClick={handleSave}
            className="w-full bg-primary text-white hover:bg-primary/90"
            data-testid="button-save-expense"
          >
            Save Expense
          </Button>
          <Button 
            onClick={onClose}
            variant="outline" 
            className="w-full"
            data-testid="button-retake-picture"
          >
            Retake Picture
          </Button>
        </div>
      </div>
    </div>
  );
}
