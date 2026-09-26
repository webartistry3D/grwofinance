# Sophisticated Dual-OCR Receipt Scanning Implementation Guide

## Overview

This document provides a comprehensive guide for implementing a sophisticated dual-OCR receipt scanning and upload technology. The system uses a hybrid approach with PaddleOCR as the primary engine and Tesseract.js as fallback, combined with bank-specific pattern recognition for optimal accuracy.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   OCR Services  │
│                 │    │                 │    │                 │
│ • Camera UI     │◄──►│ • PaddleOCR API │◄──►│ • PaddleOCR     │
│ • File Upload   │    │ • Tesseract.js  │    │ • Tesseract.js  │
│ • Results UI    │    │ • Error Handling│    │ • Image Processing│
│ • Validation    │    │ • Performance   │    │ • Text Extraction│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend
- **React/Next.js** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **date-fns** - Date handling
- **Lucide React** - Icons

### Backend
- **Node.js/Express** - Server framework
- **PaddleOCR** - Primary OCR engine (Python integration)
- **Tesseract.js** - Fallback OCR engine
- **Multer** - File upload handling
- **Sharp** - Image processing

### OCR Engines
- **PaddleOCR** - High accuracy, server-side processing
- **Tesseract.js** - Client-side fallback, lower accuracy

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── select.tsx
│   ├── header.tsx
│   ├── bottom-navigation.tsx
│   └── camera-modal.tsx
├── lib/
│   ├── ocr.ts                    # Main OCR processing
│   ├── ocr-service.ts           # OCR service integration
│   ├── currency.ts              # Currency formatting
│   └── utils.ts                 # Utility functions
├── pages/
│   ├── scan-receipt.tsx         # Main scanning page
│   └── expense-manager.tsx      # Expense management
└── hooks/
    └── use-toast.ts             # Toast notifications
```

## Implementation Steps

### Step 1: Frontend Setup

#### Install Dependencies

```bash
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod date-fns lucide-react
npm install -D tailwindcss postcss autoprefixer
```

#### Create OCR Service Interface

```typescript
// src/lib/ocr-service.ts
interface OCRResult {
  text: string;
  confidence: number;
  source: 'paddleocr' | 'tesseract';
  processingTime: number;
}

interface OCRResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export async function processReceiptOCR(file: File): Promise<OCRResult> {
  // Try PaddleOCR first
  try {
    return await processWithPaddleOCR(file);
  } catch (error) {
    console.warn('PaddleOCR failed, falling back to Tesseract.js:', error);
    return await processWithTesseract(file);
  }
}
```

#### Create Main OCR Processing Module

```typescript
// src/lib/ocr.ts
export interface ScannedData {
  merchant?: string;
  amount?: number;
  date?: string;
  items?: string[];
  category?: string;
  confidence?: number;
  notes?: string;
  ocrSource?: 'paddleocr' | 'tesseract';
  processingTime?: number;
  transactionDate?: {
    year: number;
    month: string | number;
    day: number;
    weekday?: string;
    time?: string;
  };
}

export async function processReceipt(file: File): Promise<ScannedData> {
  try {
    // Use dual OCR system
    const ocrResult = await processReceiptOCR(file);
    
    // Extract structured data using bank-specific parsers
    const extractedData = extractDetailedReceiptData(
      ocrResult.text, 
      ocrResult.confidence, 
      URL.createObjectURL(file)
    );
    
    // Convert to standard format
    return {
      merchant: extractedData.beneficiaryName || 'Unknown Merchant',
      amount: extractedData.amount || 0,
      date: extractedData.transactionDate ? 
        `${extractedData.transactionDate.year}-${String(extractedData.transactionDate.month).padStart(2, '0')}-${String(extractedData.transactionDate.day).padStart(2, '0')}` : 
        new Date().toISOString().split('T')[0],
      items: extractedData.narration ? [extractedData.narration] : [],
      confidence: Math.round(ocrResult.confidence),
      notes: extractedData.narration || ocrResult.text.substring(0, 200),
      ocrSource: ocrResult.source,
      processingTime: ocrResult.processingTime,
      transactionDate: extractedData.transactionDate
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process receipt with OCR');
  }
}
```

### Step 2: Bank-Specific Pattern Recognition

#### Create Bank Detection System

```typescript
// src/lib/ocr.ts (continued)
function detectBank(text: string): 
  | 'providus' | 'zenith' | 'gtbank' | 'uba' | 'access' | 'firstbank' | 'opay' | 'moniepoint' | 'unknown' {
  
  const t = text.toLowerCase();
  
  // Receipt issuer detection
  if (t.startsWith('firstbank') || t.includes('firstbank by')) return 'firstbank';
  if (t.includes('providus')) return 'providus';
  if (t.includes('gtbank') || t.includes('guaranty trust')) return 'gtbank';
  if (t.includes('access')) return 'access';
  if (t.includes('uba') || t.includes('united bank for africa')) return 'uba';
  if (t.includes('zenith')) return 'zenith';
  if (t.includes('opay')) return 'opay';
  if (t.includes('moniepoint')) return 'moniepoint';
  
  return 'unknown';
}
```

#### Implement ProvidusBank Parser (Example)

```typescript
// src/lib/ocr.ts (continued)
function parseProvidusReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing ProvidusBank receipt format...`);
  
  // Clean text by removing emojis and special characters
  const cleanText = text.replace(/[👤📤📝🏁🔍💰💾✅❌⚠️—]/g, '').replace(/\s+/g, ' ').trim();
  
  const providusBankPatterns = {
    transactionDate: /Transaction\s*Date\s*:\s*([A-Za-z]+\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2})/i,
    senderName: /Sender\s*Name\s*:\s*([A-Z\s]+)/i,
    beneficiaryName: /Beneficiary\s*Name\s*:\s*([A-Z]{2,}(?:\s+[A-Z]{2,})+)(?=\s+Account|$)/i,
    amount: /Amount\s*:\s*NGN\s*([\d,]+\.\d{2})/i,
    narration: /Narration\s*:\s*(.*)/i
  };

  // Extract beneficiary name
  const beneficiaryMatch = cleanText.match(
    /Beneficiary\s*Name\s*:\s*([A-Z\s]+?)(?=\s+Beneficiary\s+Account|\s+Beneficiary\s+Bank|\s+Type|\s+Amount|\s+Session|\n|$)/i
  );
  
  // Extract amount
  const amountMatch = cleanText.match(providusBankPatterns.amount);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  
  // Extract transaction date
  const dateMatch = cleanText.match(providusBankPatterns.transactionDate);
  let transactionDate = undefined;
  
  if (dateMatch) {
    const fullDate = dateMatch[1];
    const parts = fullDate.match(/([A-Za-z]+)\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
    
    if (parts) {
      transactionDate = {
        year: parseInt(parts[4]),
        month: parts[2],
        day: parseInt(parts[3]),
        weekday: parts[1],
        time: parts[5]
      };
    }
  }

  return {
    beneficiaryName: beneficiaryMatch?.[1]?.trim() || 'Unknown Beneficiary',
    amount,
    transactionDate,
    narration: 'Bank transfer transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}
```

#### Implement Opay Parser (Example)

```typescript
// src/lib/ocr.ts (continued)
function parseOpayReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing Opay receipt format...`);
  
  const cleanText = text.replace(/[👤📤📝🏁🔍💰💾✅❌⚠️—]/g, '').replace(/\s+/g, ' ').trim();
  
  const opayPatterns = {
    paymentTo: /Payment\s*To\s*:\s*([A-Za-z\s]+)/i,
    merchantName: /Merchant\s*:\s*([A-Za-z\s]+)/i,
    amount: /Amount\s*:\s*₦\s*([\d,]+\.\d{2})/i,
    amountAlt: /~([\d,]+\.\d{2})/i,
    date: /Date\s*:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    time: /Time\s*:\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    reference: /Reference\s*:\s*([A-Z0-9]+)/i,
    narration: /Description\s*:\s*(.*)/i
  };

  // Extract beneficiary/merchant name
  const paymentToMatch = cleanText.match(opayPatterns.paymentTo);
  const merchantMatch = cleanText.match(opayPatterns.merchantName);
  const beneficiaryName = paymentToMatch?.[1]?.trim() || merchantMatch?.[1]?.trim() || 'Unknown Beneficiary';
  
  // Extract amount
  const amountMatch = cleanText.match(opayPatterns.amount);
  const amountAltMatch = cleanText.match(opayPatterns.amountAlt);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 
                 amountAltMatch ? parseFloat(amountAltMatch[1].replace(/,/g, '')) : 0;
  
  // Extract date and time
  const dateMatch = cleanText.match(opayPatterns.date);
  const timeMatch = cleanText.match(opayPatterns.time);
  
  let transactionDate = undefined;
  if (dateMatch) {
    const date = new Date(dateMatch[1]);
    if (!isNaN(date.getTime())) {
      transactionDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
        time: timeMatch?.[1] || date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }
  }

  return {
    beneficiaryName,
    amount,
    transactionDate,
    narration: 'Opay payment transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}
```

### Step 3: Backend Implementation

#### Set up PaddleOCR Server Endpoint

```javascript
// server/routes/ocr.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// PaddleOCR processing endpoint
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    const startTime = Date.now();
    
    // Save temporary file
    const tempImagePath = path.join(__dirname, '../temp', `temp_${Date.now()}.jpg`);
    await fs.writeFile(tempImagePath, req.file.buffer);

    // Process with PaddleOCR
    const result = await processWithPaddleOCR(tempImagePath);
    
    // Clean up temp file
    await fs.unlink(tempImagePath);
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      processingTime
    });
    
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'OCR processing failed'
    });
  }
});

async function processWithPaddleOCR(imagePath) {
  return new Promise((resolve, reject) => {
    // Python script call
    const pythonScript = path.join(__dirname, '../ocr/paddleocr_processor.py');
    
    exec(`python3 "${pythonScript}" "${imagePath}"`, {
      cwd: path.join(__dirname, '../ocr'),
      timeout: 30000 // 30 second timeout
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`PaddleOCR execution failed: ${error.message}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse OCR result: ${parseError.message}`));
      }
    });
  });
}

module.exports = router;
```

#### Create PaddleOCR Python Processor

```python
# server/ocr/paddleocr_processor.py
import sys
import json
import os
from paddleocr import PaddleOCR
import cv2
import numpy as np

class PaddleOCRProcessor:
    def __init__(self):
        # Initialize PaddleOCR with English language
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
    
    def process_image(self, image_path):
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image file")
            
            # Preprocess image for better OCR accuracy
            img = self.preprocess_image(img)
            
            # Perform OCR
            results = self.ocr.ocr(img, cls=True)
            
            if not results or not results[0]:
                return {
                    "success": False,
                    "text": "",
                    "confidence": 0
                }
            
            # Extract text and calculate confidence
            text_lines = []
            confidences = []
            
            for line in results[0]:
                if line:
                    bbox, (text, confidence) = line
                    text_lines.append(text)
                    confidences.append(confidence)
            
            full_text = '\n'.join(text_lines)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                "success": True,
                "text": full_text,
                "confidence": avg_confidence * 100  # Convert to percentage
            }
            
        except Exception as e:
            return {
                "success": False,
                "text": "",
                "confidence": 0,
                "error": str(e)
            }
    
    def preprocess_image(self, img):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        return denoised

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python paddleocr_processor.py <image_path>"
        }))
        return
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({
            "success": False,
            "error": f"Image file not found: {image_path}"
        }))
        return
    
    processor = PaddleOCRProcessor()
    result = processor.process_image(image_path)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
```

### Step 4: Frontend UI Implementation

#### Create Scan Receipt Page

```typescript
// src/pages/scan-receipt.tsx
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
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
import { processReceipt, ScannedData } from "@/lib/ocr";

const expenseCategories = [
  "Food & Dining", "Transportation", "Utilities", "Entertainment",
  "Healthcare", "Shopping", "Business", "Other"
];

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
                  onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  data-testid="input-amount"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
```

### Step 5: Tesseract.js Fallback Implementation

```typescript
// src/lib/ocr-service.ts (continued)
async function processWithTesseract(imageFile: File): Promise<OCRResult> {
  const startTime = performance.now();
  
  try {
    // Dynamically import Tesseract.js to reduce initial bundle size
    const { createWorker } = await import('tesseract.js');
    
    console.log('🔄 Starting Tesseract.js processing...');
    
    // Create worker
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📖 Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Convert file to image data URL
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Recognize text
    const { data } = await worker.recognize(imageUrl);
    
    // Terminate worker
    await worker.terminate();
    
    // Clean up object URL
    URL.revokeObjectURL(imageUrl);
    
    const processingTime = performance.now() - startTime;
    
    console.log('✅ Tesseract.js Results:', {
      textLength: data.text.length,
      confidence: data.confidence,
      processingTime: `${processingTime.toFixed(2)}ms`,
      source: 'client-side'
    });
    
    return {
      text: data.text,
      confidence: data.confidence,
      source: 'tesseract',
      processingTime
    };
    
  } catch (error) {
    console.error('❌ Tesseract.js processing failed:', error);
    throw error;
  }
}
```

### Step 6: Environment Setup

#### Backend Requirements

```json
// package.json (backend)
{
  "name": "receipt-ocr-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.6",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### Python Dependencies

```bash
# requirements.txt
paddleocr>=2.7.0
opencv-python>=4.8.0
numpy>=1.24.0
Pillow>=10.0.0
```

#### Frontend Dependencies

```json
// package.json (frontend)
{
  "name": "receipt-ocr-frontend",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@tanstack/react-query": "^4.32.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.263.0",
    "tesseract.js": "^4.1.1",
    "wouter": "^2.10.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## Configuration

### Environment Variables

```bash
# .env (backend)
PORT=3001
NODE_ENV=production
UPLOAD_MAX_SIZE=10485760
OCR_TIMEOUT=30000
PADDLEOCR_MODEL_PATH=./models
TEMP_DIR=./temp
```

### Server Setup

```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/expenses', require('./routes/expenses'));

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Performance Optimization

### 1. Image Preprocessing

```python
# server/ocr/image_preprocessor.py
import cv2
import numpy as np

class ImagePreprocessor:
    @staticmethod
    def enhance_for_ocr(image):
        """Enhance image for better OCR accuracy"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, h=10, 
                                           templateWindowSize=7, searchWindowSize=21)
        
        # Sharpen
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        return sharpened
    
    @staticmethod
    def resize_if_needed(image, max_width=1024):
        """Resize image if too large"""
        height, width = image.shape[:2]
        if width > max_width:
            ratio = max_width / width
            new_height = int(height * ratio)
            return cv2.resize(image, (max_width, new_height), interpolation=cv2.INTER_AREA)
        return image
```

### 2. Caching Strategy

```javascript
// server/cache/ocr-cache.js
const NodeCache = require('node-cache');

class OCRCache {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour
      checkperiod: 600 // 10 minutes
    });
  }
  
  generateKey(fileBuffer) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }
  
  async get(fileBuffer) {
    const key = this.generateKey(fileBuffer);
    return this.cache.get(key);
  }
  
  async set(fileBuffer, result) {
    const key = this.generateKey(fileBuffer);
    return this.cache.set(key, result);
  }
}

module.exports = new OCRCache();
```

### 3. Rate Limiting

```javascript
// server/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const ocrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many OCR requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = ocrRateLimit;
```

## Testing

### Unit Tests

```typescript
// tests/ocr.test.ts
import { processReceipt } from '../src/lib/ocr';
import { describe, it, expect, vi } from 'vitest';

describe('OCR Processing', () => {
  it('should process receipt with PaddleOCR', async () => {
    // Mock file
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock OCR service
    vi.mock('../src/lib/ocr-service', () => ({
      processReceiptOCR: vi.fn().mockResolvedValue({
        text: 'ProvidusBank\nTransaction Date: Friday November 14, 2025 16:21:31\nAmount: NGN 5,000.00',
        confidence: 95,
        source: 'paddleocr',
        processingTime: 1500
      })
    }));
    
    const result = await processReceipt(mockFile);
    
    expect(result.merchant).toBe('Unknown Beneficiary');
    expect(result.amount).toBe(5000);
    expect(result.confidence).toBe(95);
    expect(result.ocrSource).toBe('paddleocr');
  });
  
  it('should fallback to Tesseract.js on PaddleOCR failure', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    vi.mock('../src/lib/ocr-service', () => ({
      processReceiptOCR: vi.fn()
        .mockRejectedValueOnce(new Error('PaddleOCR failed'))
        .mockResolvedValueOnce({
          text: 'Generic receipt text',
          confidence: 85,
          source: 'tesseract',
          processingTime: 3000
        })
    }));
    
    const result = await processReceipt(mockFile);
    
    expect(result.ocrSource).toBe('tesseract');
    expect(result.confidence).toBe(85);
  });
});
```

### Integration Tests

```javascript
// tests/integration/ocr.test.js
const request = require('supertest');
const path = require('path');
const app = require('../server/index');

describe('OCR API', () => {
  it('should process receipt image', async () => {
    const testImagePath = path.join(__dirname, 'fixtures/test-receipt.jpg');
    
    const response = await request(app)
      .post('/api/ocr/process')
      .attach('image', testImagePath)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.text).toBeDefined();
    expect(response.body.confidence).toBeGreaterThan(0);
  });
  
  it('should reject non-image files', async () => {
    const response = await request(app)
      .post('/api/ocr/process')
      .attach('image', path.join(__dirname, 'fixtures/test.txt'))
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('image');
  });
});
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile (backend)
FROM node:18-alpine

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Install Node.js dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create temp directory
RUN mkdir -p temp

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./temp:/app/temp
    restart: unless-stopped
  
  frontend:
    build: ./client
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

### Production Considerations

1. **Security**: Implement file type validation, virus scanning, and secure file handling
2. **Scalability**: Use message queues for OCR processing to handle high load
3. **Monitoring**: Add logging, metrics, and error tracking
4. **Cost Management**: Monitor OCR API usage and implement usage limits
5. **Data Privacy**: Ensure GDPR/CCPA compliance for receipt data

## Troubleshooting

### Common Issues

1. **PaddleOCR Installation Issues**
   ```bash
   # Install paddlepaddle with correct CUDA version
   pip install paddlepaddle-gpu==2.5.2 -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html
   ```

2. **Memory Issues**
   ```python
   # Reduce image size before processing
   img = cv2.resize(img, (0,0), fx=0.5, fy=0.5)
   ```

3. **Tesseract.js Performance**
   ```javascript
   // Use Web Worker for better performance
   const worker = await createWorker('eng', 1, { 
     workerPath: '/tesseract-worker.js',
     corePath: '/tesseract-core.wasm.js'
   });
   ```

## Best Practices

1. **Image Quality**: Encourage users to capture clear, well-lit images
2. **Error Handling**: Provide clear error messages and recovery options
3. **User Experience**: Show progress indicators and estimated processing time
4. **Data Validation**: Validate extracted data before saving
5. **Performance**: Implement caching and optimize image preprocessing
6. **Testing**: Comprehensive test coverage for all OCR scenarios

## Conclusion

This sophisticated dual-OCR implementation provides a robust receipt scanning solution with high accuracy through PaddleOCR and reliable fallback through Tesseract.js. The bank-specific pattern recognition ensures optimal extraction for Nigerian banking receipts while maintaining flexibility for international formats.

The modular architecture allows for easy customization and extension, making it suitable for integration into various financial applications requiring receipt processing capabilities.
