// Server-side OCR service for receipt processing
// PaddleOCR provides better accuracy for various receipt types with Tesseract fallback

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  processingTime?: number;
  error?: string;
}

/**
 * Call PaddleOCR worker (primary OCR)
 */
async function callPaddleOCRWorker(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Calling PaddleOCR worker...');
    
    // Create FormData for multipart upload
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'receipt.jpg',
      contentType: 'image/jpeg'
    });
    
    // Call PaddleOCR worker
    const nodeFetch = await import('node-fetch');
    const response = await nodeFetch.default('http://127.0.0.1:8001/ocr', {
      method: 'POST',
      body: formData,
      timeout: 15000  // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`PaddleOCR worker error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const processingTime = performance.now() - startTime;
    
    console.log('✅ PaddleOCR OCR completed:', {
      success: result.success,
      confidence: result.confidence,
      processingTime: `${processingTime.toFixed(2)}ms`,
      lines: result.lines
    });
    
    return {
      success: result.success,
      text: result.text,
      confidence: result.confidence,
      processingTime
    };
    
  } catch (error) {
    console.error('❌ PaddleOCR worker failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PaddleOCR worker failed'
    };
  }
}

/**
 * Main OCR entrypoint with PaddleOCR as primary
 */
export async function processWithOCR(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = performance.now();
  
  try {
    console.log('🔍 Starting OCR processing with PaddleOCR...');
    
    // Try PaddleOCR first (primary)
    try {
      const paddleOCRResult = await callPaddleOCRWorker(imageBuffer);
      
      console.log(`🔍 PaddleOCR Result: success=${paddleOCRResult.success}, confidence=${paddleOCRResult.confidence}`);
      
      if (paddleOCRResult.success && paddleOCRResult.confidence && paddleOCRResult.confidence > 0.6) {
        const displayConfidence = Math.round(paddleOCRResult.confidence * 100);
        console.log(`✅ Using PaddleOCR result with confidence: ${displayConfidence}%`);
        return {
          success: paddleOCRResult.success,
          text: paddleOCRResult.text,
          confidence: displayConfidence,  // Convert to percentage for display
          processingTime: performance.now() - startTime
        };
      }
      
      console.log('⚠️ PaddleOCR confidence low, falling back to Tesseract...');
    } catch (err) {
      console.log('❌ PaddleOCR failed, falling back to Tesseract:', err);
    }
    
    // Fallback to Tesseract.js
    console.log('🔄 Using Tesseract.js fallback...');
    const tesseractResult = await processWithTesseract(imageBuffer);
    
    console.log(`📊 Tesseract Result: success=${tesseractResult.success}, confidence=${tesseractResult.confidence}`);
    
    return {
      ...tesseractResult,
      processingTime: performance.now() - startTime
    };
    
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR processing failed'
    };
  }
}

/**
 * Python OCR invocation (safe + reliable)
 */
async function callPythonOCR(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = performance.now();

  const tempId = uuidv4();
  const tempDir = path.join(process.cwd(), 'temp');
  const tempPath = path.join(tempDir, `${tempId}.png`);

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempPath, imageBuffer);

    console.log('🐍 Starting Python OCR process...');

    const pythonScript = path.join(__dirname, 'paddleocr_worker.py');

    // Pass file path to Python, not stdin
    const pythonProcess = spawn('python', [pythonScript, tempPath]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', data => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', data => {
      stderr += data.toString();
    });

    const result = await new Promise<OCRResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python OCR timed out after 30s'));
      }, 30000);

      pythonProcess.on('close', code => {
        clearTimeout(timeout);

        if (code !== 0) {
          return reject(new Error(stderr || `Python exited with code ${code}`));
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve({
            success: parsed.success,
            text: parsed.text,
            confidence: parsed.confidence,
            processingTime: performance.now() - startTime
          });
        } catch (err) {
          reject(new Error('Invalid JSON returned from Python OCR'));
        }
      });
    });

    return result;

  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * Tesseract fallback OCR with enhanced accuracy
 */
async function processWithTesseract(imageBuffer: Buffer): Promise<OCRResult> {
  const tempId = uuidv4();
  const tempDir = path.join(process.cwd(), 'temp');
  const tempPath = path.join(tempDir, `${tempId}.png`);

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempPath, imageBuffer);

    const tesseract = await import('tesseract.js');
    const { createWorker } = tesseract;
    
    // Enhanced worker configuration for better name recognition
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const { data } = await worker.recognize(tempPath);
    await worker.terminate();
    
    // Debug: Log the raw confidence value
    console.log(`🔍 Raw Tesseract confidence: ${data.confidence} (type: ${typeof data.confidence})`);
    
    // Post-process OCR text to better extract names
    let processedText = data.text;
    
    // Enhanced name extraction patterns
    const namePatterns = [
      // Specific pattern for "KELECHI ARIBEANA" style names (more flexible)
      /(?:Recipient\s*Details|Beneficiary\s*Name|Payee\s*Details|To\s*Details|From\s*Details|Name\s*Details)[:\s]*([A-Z]{2,}(?:\s+[A-Z]{2,})+)/gi,
      // Mixed case names (more flexible)
      /(?:Recipient|Beneficiary|Payee|To|From|Name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      // All caps names (like KELECHI ARIBEANA)
      /([A-Z]{2,}\s+[A-Z]{2,})/g,
      // Two-word names with first letter capitalized
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      // Single word names in caps
      /\b([A-Z]{4,})\b/g,
      // Additional patterns for receipts
      /(?:Account\s*Name|Customer\s*Name|Client\s*Name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      // Pattern for names after "Details:" or similar
      /Details[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      // Pattern for names in any context with multiple words
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];
    
    console.log(`🔍 OCR Raw Text: ${processedText}`);
    
    for (const pattern of namePatterns) {
      const matches = processedText.match(pattern);
      if (matches) {
        console.log(`✅ Found potential names: ${matches.join(', ')}`);
        // Highlight found names in the text
        matches.forEach(match => {
          processedText = processedText.replace(match, `👤 ${match}`);
        });
      }
    }
    
    console.log(`📝 Processed Text: ${processedText}`);
    
    // Check if confidence is already a percentage
    let finalConfidence: number;
    if (data.confidence > 1) {
      console.log(`⚠️ Tesseract confidence > 1, treating as percentage: ${data.confidence}`);
      finalConfidence = Math.round(data.confidence);
    } else {
      console.log(`✅ Tesseract confidence is decimal: ${data.confidence}, converting to percentage`);
      finalConfidence = Math.round(data.confidence * 100);
    }
    
    console.log(`🎯 Final confidence: ${finalConfidence}`);
    
    // Additional debugging: Check if finalConfidence is > 100 (indicates double multiplication)
    if (finalConfidence > 100) {
      console.log(`🚨 ERROR: Final confidence > 100%: ${finalConfidence}% - Double multiplication detected!`);
    }

    return {
      success: true,
      text: processedText,
      confidence: finalConfidence  // Fix: Don't multiply by 100 again
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tesseract OCR failed'
    };
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

export default {
  processWithOCR,
  callPythonOCR
};
