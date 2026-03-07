"use client";

// ===== IMPORTS =====
// React hooks for component state management and lifecycle
import { useState, useRef, useEffect } from "react";
// Wouter hook for client-side navigation
import { useLocation } from "wouter";
// Application UI components
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
// Lucide React icons for UI elements
import { CalendarIcon, ChevronDown, Upload, Trash2, CheckCircle } from "lucide-react";
// Date formatting utility
import { format } from "date-fns";
// Utility function for conditional CSS classes
import { cn } from "@/lib/utils";
// Toast notification system for user feedback
import { useToast } from "@/hooks/use-toast";
// OCR processing function for receipt scanning
import { processReceipt } from "@/lib/ocr";
// Currency formatting utilities for amount input/output
import { formatAmountInput, parseAmount } from "@/lib/currency";

// ===== TYPE DEFINITIONS =====
// Interface defining the structure of an uploaded file with OCR extraction results
interface UploadedFile {
  file: File; // The actual file object from file input
  preview: string; // Base64 preview URL for image display
  extractedData?: { // Optional OCR-extracted data from the receipt
    merchant: string; // Extracted merchant/business name
    amount: number; // Extracted transaction amount
    date: string; // Extracted transaction date
    category: string; // Suggested expense category
    notes: string; // Extracted transaction notes/narration
    dayOfWeek: string; // Day of the week for the transaction
    transactionTime: string; // Time of the transaction
    confidence: number; // OCR confidence percentage (0-100)
  };
}

// ===== COMPONENT DEFINITION =====
// Main upload receipt component for scanning and processing receipt images
export default function UploadReceipt() {
  // ===== HOOKS AND REFS =====
  const [, setLocation] = useLocation(); // Navigation hook for redirecting after successful upload
  const { toast } = useToast(); // Toast notification system for user feedback
  const fileInputRef = useRef<HTMLInputElement>(null); // Reference to file input element for programmatic access

  // ===== STATE MANAGEMENT =====
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // Array of uploaded files with their data
  const [isProcessing, setIsProcessing] = useState(false); // Loading state for OCR processing
  const [progress, setProgress] = useState(0); // Progress indicator for OCR processing (0-100)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Selected date for expense record
  const [ocrResult, setOcrResult] = useState<any>(null); // OCR processing results from receipt scanning
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission

  // ===== FORM DATA STATE =====
  // State object containing all form fields for expense record creation
  const [formData, setFormData] = useState({
    merchant: "", // Merchant/business name from receipt
    amount: "", // Transaction amount (formatted string)
    category: "", // Expense category selection
    notes: "",
    dayOfWeek: "",
    transactionTime: "",
  });

  // ===== SESSION STORAGE MANAGEMENT =====
  // Clear sessionStorage backup on page refresh for fresh start
  useEffect(() => {
    // Detect if page is being refreshed vs initial load
    const isPageRefresh = performance.getEntriesByType && 
      performance.getEntriesByType('navigation').length > 0 && 
      (performance.getEntriesByType('navigation')[0] as any).type === 'reload';
    
    if (isPageRefresh) {
      // Clear backup data on refresh to prevent stale data
      sessionStorage.removeItem('uploadedFiles_backup');
      console.log("🧹 Cleared sessionStorage backup on page refresh");
    }
  }, []);

  // Backup uploaded files to sessionStorage when they change (but not on refresh)
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      // Persist uploaded files data across page navigation
      sessionStorage.setItem('uploadedFiles_backup', JSON.stringify(uploadedFiles));
      console.log("💾 Backed up uploadedFiles to sessionStorage");
    }
  }, [uploadedFiles]);

  // ===== FORM HANDLING FUNCTIONS =====
  // Generic form input handler for all form fields except amount
  const handleInputChange = (field: string, value: string) => {
    if (field === 'amount') {
      // Special handling for amount field - format with thousand separators for display
      const formattedValue = formatAmountInput(value);
      setFormData(prev => ({ ...prev, [field]: value })); // Store raw value internally
    } else {
      // Standard handling for all other form fields
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Dedicated handler for amount input with real-time formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value; // Get raw input value
    const formattedValue = formatAmountInput(rawValue); // Format with thousand separators
    
    // Update the input display with formatted value for better UX
    e.target.value = formattedValue;
    
    // Store the raw value in form data for processing
    setFormData(prev => ({ ...prev, amount: rawValue }));
  };

  // ===== DATE CONSTRUCTION UTILITIES =====
  // Construct ISO date string from OCR-extracted date components
  const constructDateFromComponents = (transactionDate: any): string => {
    if (!transactionDate) {
      // Fallback to current date if no transaction date available
      return new Date().toISOString().split('T')[0];
    }
    
    const { year, month, day } = transactionDate;
    if (year && month && day) {
      // Array of month names for conversion from number to string
      const monthNames = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"];
      const monthNum = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
      const date = new Date(year, monthNum - 1, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  // ===== FILE UPLOAD HANDLING =====
  // Handle file selection from file input and trigger OCR processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert FileList to array and validate files exist
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create file objects with preview URLs for display
    const newFiles = files.map(file => ({
      file, // Original file object
      preview: URL.createObjectURL(file), // Create blob URL for image preview
    }));

    // Add new files to existing uploaded files array
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process the first file for OCR (single file processing)
    if (newFiles.length > 0) {
      await processFile(newFiles[0]);
    }
  };

  // ===== OCR PROCESSING FUNCTION =====
  // Process uploaded file through OCR to extract receipt data
  const processFile = async (uploadedFile: UploadedFile) => {
    // Start performance timing for processing metrics
    const startTime = performance.now();
    console.log("⏱️ Starting OCR processing at:", startTime);
    
    // Set processing state and initial progress
    setIsProcessing(true);
    setProgress(5);

    try {
      // Time the OCR processing specifically
      const ocrStartTime = performance.now();
      console.log("⏱️ Starting processReceipt at:", ocrStartTime);
      
      // Simulate gradual progress during OCR processing
      const progressSteps = [10, 25, 45, 65, 85, 95];
      let currentStep = 0;
      
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setProgress(progressSteps[currentStep]);
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 300); // Update every 300ms
      
      // Execute OCR processing on the uploaded file
      let ocrResult = await processReceipt(uploadedFile.file);
      
      // Clear the progress interval when OCR completes
      clearInterval(progressInterval);
      
      // Calculate and log OCR processing duration
      const ocrEndTime = performance.now();
      console.log("⏱️ processReceipt completed in:", ocrEndTime - ocrStartTime, "ms");
      console.log("📊 OCR Result:", ocrResult);

      // Store OCR result in component state and global window object for debugging
      setOcrResult(ocrResult);
      (window as any).ocrResult = ocrResult;

      // ===== OCR DATA MAPPING =====
      // Extract and map OCR data to form fields (for storage, not auto-fill)
      const merchant = ocrResult.merchant || ""; // Extracted merchant name
      const amount = ocrResult.amount || 0; // Extracted transaction amount
      const dateStr = ocrResult.date || ""; // Extracted transaction date
      const narration = ocrResult.notes || ""; // Extracted transaction notes/narration
      const dayOfWeek = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }) || ""; // Calculate day of week
      const transactionTime = ocrResult.transactionDate?.time || new Date(dateStr).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) || ""; // Extract transaction time or generate from date

      const extractedData = {
        merchant,
        amount,
        date: dateStr,
        category: "Other",
        notes: narration,
        dayOfWeek,
        transactionTime,
        confidence: ocrResult.confidence || 0, // OCR confidence percentage
      };

      // ===== UPLOADED FILES STATE UPDATE =====
      // Update uploadedFiles array with extracted OCR data for immediate display
      setUploadedFiles(prev => 
        prev.map(f => (f.file === uploadedFile.file ? { ...f, extractedData } : f))
      );

      // ===== DATE SELECTION UPDATE =====
      // Automatically set the date picker to the extracted transaction date
      try {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) setSelectedDate(parsed); // Only set if valid date
      } catch {
        // Ignore invalid date parsing errors
      }

      // ===== PROCESSING COMPLETION =====
      setProgress(100); // Set progress to 100% for completion
      toast({
        title: "Receipt Scanned",
        description: `OCR completed with ${Math.round(Number(extractedData.confidence || 0))}% confidence. Click "Extract OCR Data" to populate form.`,
      });

    } catch (error) {
      // ===== ERROR HANDLING =====
      console.error("OCR failed:", error);
      toast({
        title: "Scanning Failed",
        description: `Could not scan ${uploadedFile.file.name}`,
        variant: "destructive",
      });
    } finally {
      // ===== CLEANUP =====
      setIsProcessing(false); // Reset processing state
      setTimeout(() => setProgress(0), 700); // Clear progress indicator after delay
    }
  };

  // ===== OCR DATA EXTRACTION UTILITIES =====
  // Extract OCR data from multiple sources (state, window object, or uploaded files)
  const extractOCRDataFromConsole = () => {
    try {
      console.log("🔍 Extracting OCR data...");
      
      let consoleOCRData = null;
      
      // Try to get OCR data from component state first
      if (ocrResult) {
        consoleOCRData = ocrResult;
        console.log("✅ Found OCR data in ocrResult state");
      } 
      // Fallback to global window object (for debugging)
      else if ((window as any).ocrResult) {
        consoleOCRData = (window as any).ocrResult;
        console.log("✅ Found OCR data in window.ocrResult");
      } 
      // Fallback to uploaded files extracted data
      else if (uploadedFiles.length > 0 && uploadedFiles[0].extractedData) {
        consoleOCRData = uploadedFiles[0].extractedData;
        console.log("✅ Found OCR data in uploadedFiles[0].extractedData");
      }
      
      if (!consoleOCRData) {
        console.log("❌ No OCR data found");
        toast({
          title: "No OCR Data Found",
          description: "Please scan a receipt first",
          variant: "destructive",
        });
        return;
      }

      // ===== OCR DATA MAPPING TO FORM =====
      // Map extracted OCR data to form field structure
      const mappedData = {
        merchant: consoleOCRData.beneficiaryName || consoleOCRData.merchant || "", // Use beneficiary name or merchant
        amount: consoleOCRData.amount ? String(consoleOCRData.amount) : "", // Convert amount to string
        category: "Other", // Default category
        notes: consoleOCRData.narration || consoleOCRData.notes || "", // Use narration or notes
        dayOfWeek: consoleOCRData.transactionDate?.weekday || "", // Extract day of week
        transactionTime: consoleOCRData.transactionDate?.time || "", // Extract transaction time
      };

      // ===== FORM STATE UPDATE =====
      // Update form data with mapped OCR values
      setFormData(mappedData);

      // ===== DATE UPDATE FROM OCR =====
      // Update date picker with extracted transaction date
      if (consoleOCRData.transactionDate) {
        const { year, month, day } = consoleOCRData.transactionDate;
        if (year && month && day) {
          // Convert month name to number if needed
          const monthNames = ["January", "February", "March", "April", "May", "June",
                             "July", "August", "September", "October", "November", "December"];
          const monthNum = typeof month === 'string' ? monthNames.indexOf(month) + 1 : month;
          const date = new Date(year, monthNum - 1, day);
          if (!isNaN(date.getTime())) setSelectedDate(date); // Only set if valid date
        }
      }

      // ===== OCR RESULT STATE UPDATE =====
      // Update component state if OCR result was found in alternative source
      if (!ocrResult && consoleOCRData) {
        setOcrResult(consoleOCRData);
      }

      // ===== SUCCESS NOTIFICATION =====
      toast({
        title: "OCR Data Extracted",
        description: "Form populated with OCR data successfully",
      });

    } catch (error) {
      // ===== ERROR HANDLING =====
      console.error("❌ Error extracting OCR data:", error);
      toast({
        title: "Extraction Failed",
        description: `Could not extract OCR data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // ===== FILE MANAGEMENT FUNCTIONS =====
  // Remove a specific file from the uploaded files array
  // Remove a specific file from the uploaded files array
  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  // ===== FORM SUBMISSION HANDLER =====
  // Handle the complete form submission process including receipt upload and expense creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("⚠️ Form already submitting, ignoring...");
      return;
    }

    setIsSubmitting(true);
    console.log("🚀 Form submission started...");

    // ===== FORM VALIDATION =====
    // Validate all required form fields are filled
    console.log("🔍 Starting form validation...");
    console.log("📊 Form data:", JSON.stringify(formData, null, 2));
    console.log("📊 Selected date:", selectedDate);
    console.log("📊 Uploaded files:", uploadedFiles.length);
    
    const validationErrors = [];
    
    if (!formData.merchant || formData.merchant.trim() === '') {
      validationErrors.push('Merchant name is required');
      console.error("❌ Validation failed: Merchant name is empty");
    }
    
    if (!formData.amount || formData.amount.trim() === '') {
      validationErrors.push('Amount is required');
      console.error("❌ Validation failed: Amount is empty");
    } else {
      const parsedAmount = parseAmount(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        validationErrors.push('Amount must be a positive number');
        console.error("❌ Validation failed: Amount is invalid:", formData.amount, "->", parsedAmount);
      }
    }
    
    if (!formData.category || formData.category.trim() === '') {
      validationErrors.push('Category is required');
      console.error("❌ Validation failed: Category is empty");
    }
    
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      validationErrors.push('Valid date is required');
      console.error("❌ Validation failed: Date is invalid:", selectedDate);
    }
    
    if (!formData.notes || formData.notes.trim() === '') {
      validationErrors.push('Narration is required');
      console.error("❌ Validation failed: Notes is empty");
    }
    
    if (validationErrors.length > 0) {
      console.error("❌ Form validation failed with errors:", validationErrors);
      toast({
        title: "Validation Failed",
        description: validationErrors[0], // Show first error for simplicity
        variant: "destructive",
      });
      return;
    }
    
    console.log("✅ Form validation passed");

    try {
      // ===== RECEIPT UPLOAD PROCESS =====
      // Upload receipt image to server if files exist
      let serverImageUrl = "";
      if (uploadedFiles.length > 0) {
        console.log("📸 Starting receipt upload process...");
        console.log("📸 Files to upload:", uploadedFiles.length);
        console.log("📸 First file details:", {
          name: uploadedFiles[0].file.name,
          size: uploadedFiles[0].file.size,
          type: uploadedFiles[0].file.type
        });
        
        // Prepare FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append("receipt", uploadedFiles[0].file);

        console.log("📸 FormData prepared, sending to /api/upload-receipt...");

        // Send file to server for storage
        const response = await fetch("/api/upload-receipt", {
          method: "POST",
          body: formDataToSend,
        });
        
        console.log("📸 Upload response status:", response.status);
        console.log("📸 Upload response ok:", response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Receipt upload failed:", errorText);
          throw new Error(`Failed to upload receipt: ${response.status} - ${errorText}`);
        }

        // Parse and debug server response
        const responseText = await response.text();
        console.log("📸 Full response text:", responseText);
        console.log("📸 Response text length:", responseText.length);
        
        const result = JSON.parse(responseText);
        console.log("📸 Receipt uploaded:", result);
        console.log("📸 Result structure:", JSON.stringify(result, null, 2));
        console.log("📸 result.imageUrl:", result.imageUrl);
        console.log("📸 result.message:", result.message);
        
        // Extract server-stored image URL
        serverImageUrl = result.imageUrl || "";
        
        if (!serverImageUrl) {
          console.error("❌ No imageUrl returned from upload API");
        } else {
          console.log("✅ Server image URL received:", serverImageUrl);
        }
        
        toast({ title: "Receipt Uploaded", description: result.message });
      } else {
        console.log("📸 No files to upload - proceeding without receipt image");
      }

      // ===== IMAGE URL SELECTION =====
      // Choose server-stored URL over temporary blob URL for reliability
      const imageUrl = serverImageUrl || (ocrResult?.scannedDocument || "");
      
      if (imageUrl) {
        console.log("📸 Including receipt image in expense");
        console.log("📸 Image URL length:", imageUrl.length);
        console.log("📸 Image URL starts with:", imageUrl.substring(0, 50));
      } else {
        console.log("❌ No receipt image available");
      }

      // ===== EXPENSE DATA CREATION =====
      // Create expense data object with all required fields for API submission
      const expenseData = {
        merchant: formData.merchant, // Merchant/business name
        amount: String(parseAmount(formData.amount) || 0), // Parse formatted amount to string
        netAmount: String(parseAmount(formData.amount) || 0), // Same as amount for backend compatibility
        category: formData.category, // Expense category
        date: selectedDate ? selectedDate.toISOString() : new Date().toISOString(), // ISO date string
        notes: formData.notes, // Transaction notes
        items: [], // Empty items array (not used in this flow)
        imageUrl: imageUrl, // Server-stored image URL for receipt
      };

      // ===== EXPENSE CREATION DEBUGGING =====
      console.log("🔄 Attempting to save expense...");
      console.log("📊 Expense data structure:", JSON.stringify(expenseData, null, 2));
      console.log("📊 Expense data types:", {
        merchant: typeof expenseData.merchant,
        amount: typeof expenseData.amount,
        category: typeof expenseData.category,
        date: typeof expenseData.date,
        notes: typeof expenseData.notes,
        items: typeof expenseData.items
      });
      
      // ===== EXPENSE API SUBMISSION =====
      // Send expense data to server for database storage
      console.log("🚀 Starting expense API submission...");
      console.log("📊 Request URL:", "/api/expenses");
      console.log("📊 Request method:", "POST");
      console.log("📊 Request headers:", { "Content-Type": "application/json" });
      console.log("📊 Request body:", JSON.stringify(expenseData, null, 2));
      
      const expenseResponse = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      
      console.log("📊 Expense API response status:", expenseResponse.status);
      console.log("📊 Expense API response ok:", expenseResponse.ok);
      console.log("📊 Expense API response headers:", Object.fromEntries(expenseResponse.headers.entries()));
      
      // ===== API ERROR HANDLING =====
      if (!expenseResponse.ok) {
        const errorText = await expenseResponse.text();
        console.error("❌ Expense API error response:", errorText);
        console.error("❌ Response headers:", expenseResponse.headers);
        console.error("❌ Request data that was sent:", JSON.stringify(expenseData, null, 2));
        
        // Try to parse the error for more detailed debugging
        try {
          const errorJson = JSON.parse(errorText);
          console.error("❌ Parsed error details:", errorJson);
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            console.error("❌ Validation errors found:", errorJson.errors.length);
            errorJson.errors.forEach((err: any, index: number) => {
              console.error(`❌ Error ${index + 1}:`, err);
              console.error(`❌ Error ${index + 1} details:`, {
                path: err.path,
                message: err.message,
                code: err.code,
                expected: err.expected,
                received: err.received,
                value: err.value
              });
              
              // Show specific field error in toast
              const fieldName = err.path?.[0] || 'field';
              const fieldValue = err.received || err.value || 'empty';
              console.error(`❌ Field "${fieldName}" has invalid value:`, fieldValue);
            });
            
            // Show user-friendly validation error message
            const firstError = errorJson.errors[0];
            const fieldName = firstError?.path?.[0] || 'field';
            const errorMessage = firstError?.message || 'Invalid value';
            
            toast({
              title: "Validation Error",
              description: `${fieldName}: ${errorMessage}`,
              variant: "destructive",
            });
          } else {
            // Non-validation error
            toast({
              title: "Save Failed",
              description: errorJson.message || "Server error occurred",
              variant: "destructive",
            });
          }
        } catch (e) {
          console.error("❌ Could not parse error as JSON. Raw response:", errorText);
          console.error("❌ Parse error:", e);
          
          // Show generic error for non-JSON responses
          toast({
            title: "Save Failed",
            description: `Server error: ${expenseResponse.status}`,
            variant: "destructive",
          });
        }
        
        throw new Error(`Failed to save expense: ${expenseResponse.status} - ${errorText}`);
      }
      
      // ===== SUCCESS HANDLING =====
      const expenseResult = await expenseResponse.json();
      console.log("✅ Expense saved successfully:", expenseResult);
      const parsedAmount = parseAmount(formData.amount);
      
      // Show success toast
      toast({ title: "Expense Saved", description: `₦${parsedAmount.toFixed(2)} saved successfully` });
      
      // ===== CLEANUP AND REDIRECT =====
      console.log("🧹 Starting cleanup after successful save...");
      
      // Clear all form data
      setFormData({
        merchant: "",
        amount: "",
        category: "",
        notes: "",
        dayOfWeek: "",
        transactionTime: "",
      });
      
      // Clear uploaded files and OCR results
      setUploadedFiles([]);
      setOcrResult(null);
      
      // Reset date to today
      setSelectedDate(new Date());
      
      // Clear sessionStorage backup
      sessionStorage.removeItem('uploadedFiles_backup');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log("🧹 Cleanup completed");
      
      // ===== NAVIGATION =====
      // Redirect to expense manager after successful save with a small delay to show success toast
      setTimeout(() => {
        console.log("🚀 Redirecting to expense manager...");
        setLocation("/expense-manager");
      }, 1500); // 1.5 second delay to show success message
    } catch (error) {
      // ===== GENERAL ERROR HANDLING =====
      console.error("❌ Form submission error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save expense",
        variant: "destructive",
      });
    } finally {
      // ===== SUBMISSION CLEANUP =====
      setIsSubmitting(false);
      console.log("🏁 Form submission completed, isSubmitting reset to false");
    }
  };

  // ===== COMPONENT RENDER =====
  // Main JSX structure for the upload receipt interface
  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl mx-auto bg-background min-h-screen">
      {/* ===== PAGE HEADER ===== */}
      <Header title="Upload Receipt" showBack backHref="/expense-manager" />

      <main className="pb-20 px-4 py-6 space-y-6">
        {/* ===== UPLOAD SECTION ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" /> Upload Receipt Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* ===== FILE INPUT ===== */}
            {/* Hidden file input that triggers the upload process */}
            <input
              id="receiptFiles"
              name="receiptFiles"
              type="file"
              accept="image/*" // Only accept image files
              multiple // Allow multiple file selection
              ref={fileInputRef} // Reference for programmatic access
              onChange={handleFileUpload} // Handle file selection
              className="hidden" // Hidden - triggered by button click
              data-testid="input-file-upload"
            />

            {/* ===== UPLOAD BUTTON ===== */}
            {/* Visible upload area with drag-and-drop styling */}
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-muted/50"
              onClick={() => fileInputRef.current?.click()} // Trigger hidden file input
              data-testid="button-upload-receipt"
            >
              <Upload className="h-8 w-8" />
              <span>Click to upload or drag and drop</span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, JPEG up to 10MB each
              </span>
            </Button>

            {/* ===== PROCESSING INDICATOR ===== */}
            {/* Progress bar shown during OCR processing */}
            {isProcessing && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }} // Dynamic width based on progress
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Extracting receipt… {progress}%
                </p>
              </div>
            )}

            {/* ===== OCR ACTION BUTTONS ===== */}
            {/* Show action buttons when OCR data or files are available */}
            {(ocrResult || uploadedFiles.length > 0) && (
              <div className="mt-4 space-y-3">
                {/* Extract OCR data button */}
                <Button
                  onClick={extractOCRDataFromConsole}
                  variant="outline"
                  className="w-full"
                >
                  📊 Extract OCR Data from Console
                </Button>
                
                {/* Clear files button */}
                <Button
                  onClick={() => {
                    setUploadedFiles([]);
                    setOcrResult(null);
                    setFormData({
                      merchant: "",
                      amount: "",
                      category: "",
                      notes: "",
                      dayOfWeek: "",
                      transactionTime: "",
                    });
                    setSelectedDate(new Date());
                    sessionStorage.removeItem('uploadedFiles_backup');
                    console.log("🧹 Cleared all data and sessionStorage");
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  🗑️ Clear All Data
                </Button>
              </div>
            )}

            {/* ===== FILE THUMBNAILS ===== */}
            {/* Display uploaded files as thumbnails with extracted data */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                {/* File count indicator */}
                <div className="mt-2 text-sm text-gray-600">
                  📁 Found {uploadedFiles.length} uploaded file(s)
                </div>
                
                {/* Thumbnail grid */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedFiles.map((f, idx) => (
                    <Card key={idx} className="relative">
                      {/* Image preview with delete button */}
                      <div className="aspect-square overflow-hidden rounded-t-lg relative">
                        <img src={f.preview} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFile(f.file)} // Remove individual file
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* File information and extracted data */}
                      <CardContent className="p-2 text-xs space-y-1">
                        <p className="truncate font-medium">{f.file.name}</p>
                        <p className="text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</p>
                        
                        {/* Show extracted OCR data if available */}
                        {f.extractedData && (
                          <>
                            {/* Processing status indicator */}
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>Processed</span>
                            </div>
                            
                            {/* Extracted data display */}
                            <div className="mt-2 p-1 bg-gray-50 rounded text-xs">
                              <p><strong>Beneficiary:</strong> {f.extractedData.merchant}</p>
                              <p><strong>Amount:</strong> ₦{f.extractedData.amount}</p>
                              <p><strong>Date:</strong> {f.extractedData.date}</p>
                              <p><strong>Day:</strong> {f.extractedData.dayOfWeek}</p>
                              <p><strong>Time:</strong> {f.extractedData.transactionTime}</p>
                              <p><strong>Narration:</strong> {f.extractedData.notes?.substring(0, 30)}...</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== EXPENSE FORM SECTION ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ===== MERCHANT FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="merchant">Beneficiary Name *</Label>
                {/* Show extracted merchant name from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.beneficiaryName && (
                    <span>Extracted: {ocrResult.beneficiaryName}</span>
                  )}
                </div>
                <Input
                  id="merchant"
                  name="merchant"
                  placeholder="e.g., KELECHI ARIBEANA"
                  value={formData.merchant}
                  onChange={(e) => handleInputChange("merchant", e.target.value)}
                  required
                  autoComplete="organization"
                  data-testid="input-merchant"
                />
              </div>

              {/* ===== AMOUNT FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                {/* Show extracted amount from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.amount && (
                    <span>Extracted: ₦{ocrResult.amount.toLocaleString()}</span>
                  )}
                </div>
                <Input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formatAmountInput(formData.amount)} // Format with thousand separators
                  onChange={handleAmountChange} // Custom handler for real-time formatting
                  required
                  autoComplete="off"
                  style={{ fontFamily: '"Share Tech Mono", monospace' }} // Monospace font for numbers
                  data-testid="input-amount"
                />
              </div>

              {/* ===== DATE PICKER FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="expenseDateNative">Transaction Date *</Label>
                {/* Show extracted transaction date from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.transactionDate && (
                    <span>Extracted: {ocrResult.transactionDate.weekday}, {ocrResult.transactionDate.month} {ocrResult.transactionDate.day}, {ocrResult.transactionDate.year}</span>
                  )}
                </div>
                
                {/* Custom date picker popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground" // Style when no date selected
                      )}
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
                
                {/* Hidden native date input for accessibility and form submission */}
                <input
                  id="expenseDateNative"
                  name="date"
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDate(val ? new Date(val + "T00:00:00") : undefined);
                  }}
                  className="sr-only" // Screen reader only for accessibility
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* ===== DAY OF WEEK FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                {/* Show extracted day of week from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.transactionDate?.weekday && (
                    <span>Extracted: {ocrResult.transactionDate.weekday}</span>
                  )}
                </div>
                <Input
                  id="dayOfWeek"
                  name="dayOfWeek"
                  placeholder="e.g., Wednesday"
                  value={formData.dayOfWeek}
                  onChange={(e) => handleInputChange("dayOfWeek", e.target.value)}
                  autoComplete="off"
                  data-testid="input-day-of-week"
                />
              </div>

              {/* ===== TRANSACTION TIME FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="transactionTime">Transaction Time</Label>
                {/* Show extracted transaction time from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.transactionDate?.time && (
                    <span>Extracted: {ocrResult.transactionDate.time}</span>
                  )}
                </div>
                <Input
                  id="transactionTime"
                  name="transactionTime"
                  type="time"
                  value={formData.transactionTime}
                  onChange={(e) => handleInputChange("transactionTime", e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* ===== CATEGORY SELECT FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="categoryNative">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Category options */}
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Hidden native select for accessibility and form submission */}
                <select
                  id="categoryNative"
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="sr-only" // Screen reader only
                  tabIndex={-1}
                  autoComplete="off"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* ===== NARRATION FIELD ===== */}
              <div className="space-y-2">
                <Label htmlFor="notes">Narration *</Label>
                {/* Show extracted narration from OCR if available */}
                <div className="text-sm text-muted-foreground mb-2">
                  {ocrResult?.narration && (
                    <span>Extracted: {ocrResult.narration}</span>
                  )}
                </div>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Transaction description..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full min-h-24 px-3 py-2 border border-input rounded-md text-sm bg-background"
                  autoComplete="off"
                  required
                />
              </div>

              {/* ===== FORM ACTION BUTTONS ===== */}
              <div className="flex gap-3 pt-4">
                {/* Cancel button - returns to expense manager */}
                <Button type="button" variant="outline" className="flex-1" onClick={() => setLocation("/expense-manager")} data-testid="button-cancel">
                  Cancel
                </Button>
                
                {/* Submit button - saves expense and shows loading state */}
                <Button type="submit" className="flex-1" disabled={isProcessing || isSubmitting} data-testid="button-save-expense">
                  {(isProcessing || isSubmitting) ? "Saving..." : "Save Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <BottomNavigation />
    </div>
  );
}
