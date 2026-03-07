import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Camera, Upload, Scan, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";

const expenseCategories = [
  "Food & Dining",
  "Transportation", 
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Business",
  "Other"
];

interface ScannedData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: string[];
  category?: string;
  notes?: string;
}

export default function ScanReceipt() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    category: "",
    notes: "",
  });

  const handleCameraCapture = () => {
    // In a real app, this would open the device camera
    // For now, trigger file input as fallback
    //fileInputRef.current?.click();
    cameraInputRef.current?.click();
  };  

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Import OCR processing
      const { processReceipt } = await import('@/lib/ocr');
      
      toast({
        title: "Processing Receipt",
        description: "Scanning receipt with OCR technology...",
      });
      
      // Process the receipt with real OCR
      const ocrResult = await processReceipt(file);
      
      setScanResult(ocrResult);
      setFormData({
        merchant: ocrResult.merchant || "",
        amount: ocrResult.amount?.toString() || "",
        category: "Food & Dining", // Default category
        notes: ocrResult.items?.join(", ") || ""
      });
      setSelectedDate(ocrResult.date ? new Date(ocrResult.date) : undefined);
      setIsScanning(false);
      
      toast({
        title: "Receipt Processed Successfully",
        //description: `Extracted data with ${ocrResult.confidence}% confidence`,
        description: `Extracted data${ocrResult.confidence ? ` with ${ocrResult.confidence}% confidence` : ""}`,
      });
    } catch (error) {
      console.error("OCR processing failed:", error);
      setIsScanning(false);
      toast({
        title: "Processing Failed", 
        description: "Could not extract data from receipt. Please enter manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.merchant || !formData.amount || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        merchant: formData.merchant,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: selectedDate || new Date(),
        notes: formData.notes,
        items: scanResult?.items || []
      };

      // Submit the expense
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      toast({
        title: "Expense Saved",
        description: "Receipt data has been saved successfully",
      });

      // Navigate back to expense manager
      setLocation('/expense-manager');
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: "Save Failed",
        description: "Could not save expense data",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      <Header title="Scan Receipt" showBack={true} backHref="/expense-manager" />
      
      <main className="pb-20 px-4 py-6">
        {!scanResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-blue-600" />
                Capture Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"   // 👈 this hints mobile to open the camera
                  onChange={handleFileUpload}
                  ref={cameraInputRef}
                  className="hidden"
                  data-testid="input-camera-capture"
                />

                <Button 
                  onClick={handleCameraCapture}
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  disabled={isScanning}
                  data-testid="button-camera-capture"
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-24 w-full flex flex-col items-center justify-center space-y-2"
                    disabled={isScanning}
                    data-testid="button-upload-receipt"
                  >
                    <Upload className="h-8 w-8" />
                    <span>Upload Image</span>
                  </Button>
                </div>
              </div>*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Camera capture input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  ref={cameraInputRef}
                  className="hidden"
                  data-testid="input-camera-capture"
                />
                <Button 
                  onClick={handleCameraCapture}
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  disabled={isScanning}
                  data-testid="button-camera-capture"
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>

                {/* File upload input */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-24 w-full flex flex-col items-center justify-center space-y-2"
                    disabled={isScanning}
                    data-testid="button-upload-receipt"
                  >
                    <Upload className="h-8 w-8" />
                    <span>Upload Image</span>
                  </Button>
                </div>
              </div>


              {isScanning && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Processing receipt...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {scanResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Scanned Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Merchant:</span>
                    <p className="text-green-700 dark:text-green-300">{scanResult.merchant || "—"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p className="text-green-700 dark:text-green-300" style={{ fontFamily: '"Share Tech Mono", monospace' }}>
                      {scanResult.amount ? formatNaira(scanResult.amount) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Items Found:</span>
                    <p className="text-green-700 dark:text-green-300">
                      {scanResult.items?.length || 0} items
                    </p>
                  </div>
                </div>

                {/* Detailed items */}
                {scanResult.items && scanResult.items.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium block mb-1">Extracted Items:</span>
                    <ul className="list-disc list-inside text-green-700 dark:text-green-300 text-sm space-y-1">
                      {scanResult.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes / raw fallback */}
                {scanResult.notes && (
                  <div className="mt-4">
                    <span className="font-medium block mb-1">Notes / Raw OCR:</span>
                    <pre className="whitespace-pre-wrap text-green-700 dark:text-green-300 text-sm bg-green-100 dark:bg-green-900 p-2 rounded">
                      {scanResult.notes}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        
        {/*{scanResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Scanned Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Merchant:</span>
                    <p className="text-green-700 dark:text-green-300">{scanResult.merchant}</p>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p className="text-green-700 dark:text-green-300">{formatNaira(scanResult.amount || 0)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Items Found:</span>
                    <p className="text-green-700 dark:text-green-300">{scanResult.items?.length || 0} items</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}*/}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanResult ? <AlertCircle className="h-5 w-5 text-orange-600" /> : <Scan className="h-5 w-5 text-blue-600" />}
              {scanResult ? "Verify & Edit Details" : "Manual Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Merchant */}
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant/Store Name *</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Shoprite, Dominos"
                  value={formData.merchant}
                  onChange={(e) => handleInputChange("merchant", e.target.value)}
                  data-testid="input-merchant"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  data-testid="input-amount"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-date-picker"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes/Items */}
              <div className="space-y-2">
                <Label htmlFor="notes">Items/Notes</Label>
                <textarea
                  id="notes"
                  placeholder="List of items or additional notes..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full min-h-20 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  data-testid="textarea-notes"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/expense-manager")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-save-expense"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}