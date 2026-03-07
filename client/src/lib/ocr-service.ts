// OCR service integration for receipt scanning
// This module provides PaddleOCR functionality with Tesseract.js fallback

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

/**
 * Process image with PaddleOCR via server API
 * PaddleOCR is more accurate for receipts but requires server-side processing
 */
async function processWithPaddleOCR(imageFile: File): Promise<OCRResult> {
  const startTime = performance.now();
  
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('language', 'en'); // English for Nigerian receipts
    formData.append('timestamp', Date.now().toString()); // Cache-busting
    formData.append('filesize', imageFile.size.toString()); // Additional identifier
    
    console.log('📸 Sending image to server-side OCR:', {
      filename: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
      timestamp: Date.now()
    });
    
    // Send to PaddleOCR processing endpoint
    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`PaddleOCR server error: ${response.status}`);
    }
    
    const result: OCRResponse = await response.json();
    
    const processingTime = performance.now() - startTime;
    
    console.log('🔍 Client received server result:', {
      success: result.success,
      textLength: result.text?.length || 0,
      textPreview: result.text?.substring(0, 200) + '...',
      confidence: result.confidence,
      processingTime: `${processingTime.toFixed(2)}ms`,
      source: 'server-side'
    });
    
    if (!result.success || !result.text) {
      throw new Error(result.error || 'PaddleOCR processing failed');
    }
    
    console.log('✅ PaddleOCR Results:', {
      textLength: result.text.length,
      confidence: result.confidence,
      processingTime: `${processingTime.toFixed(2)}ms`,
      source: 'server-side'
    });
    
    // Debug: Check if confidence is > 100 (indicates server-side issue)
    if (result.confidence && result.confidence > 100) {
      console.log(`🚨 CLIENT ERROR: Server confidence > 100%: ${result.confidence}% - Server-side multiplication detected!`);
    }
    
    return {
      text: result.text,
      confidence: result.confidence || 0,
      source: 'paddleocr',
      processingTime
    };
    
  } catch (error) {
    console.error('❌ PaddleOCR processing failed:', error);
    throw error;
  }
}

/**
 * Process image with Tesseract.js as fallback
 */
async function processWithTesseract(imageFile: File): Promise<OCRResult> {
  const startTime = performance.now();
  
  try {
    // Import Tesseract.js dynamically
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Convert image to data URL
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(imageUrl);
    await worker.terminate();
    
    const processingTime = performance.now() - startTime;
    
    console.log('Tesseract Results:', {
      text: text.substring(0, 200) + '...',
      confidence,
      processingTime: `${processingTime.toFixed(2)}ms`
    });
    
    return {
      text,
      confidence,
      source: 'tesseract',
      processingTime
    };
    
  } catch (error) {
    console.error('Tesseract processing failed:', error);
    throw error;
  }
}

/**
 * Primary OCR processing function with PaddleOCR first, Tesseract fallback
 */
export async function processReceiptOCR(imageFile: File): Promise<OCRResult> {
  console.log('🔍 Starting dual OCR processing...');
  
  // Try PaddleOCR first (more accurate for receipts)
  try {
    console.log('📸 Attempting PaddleOCR processing...');
    const paddleOCRResult = await processWithPaddleOCR(imageFile);
    
    // Only accept PaddleOCR result if confidence is reasonable (> 60%)
    if (paddleOCRResult.confidence > 60) {
      console.log('✅ PaddleOCR successful with high confidence');
      return paddleOCRResult;
    } else {
      console.log('⚠️ PaddleOCR confidence low, trying Tesseract fallback...');
    }
  } catch (error) {
    console.log('❌ PaddleOCR failed, falling back to Tesseract:', error);
  }
  
  // Fallback to Tesseract.js
  try {
    console.log('🔤 Attempting Tesseract fallback...');
    const tesseractResult = await processWithTesseract(imageFile);
    console.log('✅ Tesseract fallback successful');
    return tesseractResult;
  } catch (error) {
    console.error('❌ Both OCR methods failed:', error);
    throw new Error('All OCR processing methods failed');
  }
}

/**
 * Compare results from both OCR methods and return best one
 */
export async function processReceiptOCRComparison(imageFile: File): Promise<OCRResult> {
  console.log('🔄 Running OCR comparison...');
  
  const results: OCRResult[] = [];
  
  // Try PaddleOCR
  try {
    const paddleOCRResult = await processWithPaddleOCR(imageFile);
    results.push(paddleOCRResult);
  } catch (error) {
    console.log('PaddleOCR failed in comparison:', error);
  }
  
  // Try Tesseract
  try {
    const tesseractResult = await processWithTesseract(imageFile);
    results.push(tesseractResult);
  } catch (error) {
    console.log('Tesseract failed in comparison:', error);
  }
  
  if (results.length === 0) {
    throw new Error('All OCR methods failed in comparison');
  }
  
  // Return result with highest confidence
  const bestResult = results.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  console.log(`🏆 Best OCR result: ${bestResult.source} (${bestResult.confidence}% confidence)`);
  return bestResult;
}

export default {
  processReceiptOCR,
  processReceiptOCRComparison,
  processWithPaddleOCR,
  processWithTesseract
};
