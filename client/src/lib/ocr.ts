// Unified OCR processing module for receipt scanning
// This module provides comprehensive OCR functionality with specific ProvidusBank pattern matching

import { processReceiptOCR } from './ocr-service';

// Unified interface for all OCR results
interface OCRResult {
  beneficiaryName?: string;
  amount?: number;
  transactionDate?: {
    year: number;
    month: string | number;
    day: number;
    weekday?: string;
    time?: string;
  };
  narration?: string;
  confidence?: number;
  scannedDocument?: string; // Base64 encoded image or URL
  ocrSource?: 'paddleocr' | 'tesseract';
  processingTime?: number;
}

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

// Helper function to convert month name to number
function getMonthNumber(monthName: string): number {
  const months: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthName] || 0;
}

/**
 * Bank detection function - pure classification only
 */
function detectBank(text: string): 
  | 'providus'
  | 'zenith'
  | 'gtbank'
  | 'uba'
  | 'access'
  | 'firstbank'
  | 'opay'
  | 'moniepoint'
  | 'unknown' {
  
  const t = text.toLowerCase();
  
  // Receipt issuer detection MUST come first
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

/**
 * Parse ProvidusBank receipt format
 */
function parseProvidusReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing ProvidusBank receipt format...`);
  
  // Clean text by removing emojis and special characters
  const cleanText = text.replace(/[👤📤📝🏁🔍💰💾✅❌⚠️—]/g, '').replace(/\s+/g, ' ').trim();
  console.log(`🧹 Cleaned OCR text: ${cleanText.substring(0, 200)}...`);
  
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let beneficiaryName = '';
  let amount = 0;
  let dateStr = '';
  let timeStr = '';
  let weekday = '';
  let narration = '';
  
  // ProvidusBank specific patterns - exact matching for this receipt format
  const providusBankPatterns = {
    transactionDate: /Transaction\s*Date\s*:\s*([A-Za-z]+\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2})/i,
    senderName: /Sender\s*Name\s*:\s*([A-Z\s]+)/i,
    senderAccount: /Sender\s*Account\s*:\s*([\d*]+)/i,
    beneficiaryName: /Beneficiary\s*Name\s*:\s*([A-Z]{2,}(?:\s+[A-Z]{2,})+)(?=\s+Account|$)/i,
    //beneficiaryAccount: /Beneficiary\s*Account\s*:\s*(\d+)/i,
    //beneficiaryBank: /Beneficiary\s*Bank\s*:\s*([A-Za-z\s]+(?:Plc)?)/i,
    transactionType: /Type\s*:\s*([A-Z\-]+)/i,
    amount: /Amount\s*:\s*NGN\s*([\d,]+\.\d{2})/i,
    sessionId: /Session\s*ID\s*:\s*(\d+)/i,
    narration: /Narration\s*:\s*(.*)/i
  };

  console.log('🔍 Testing ProvidusBank patterns...');
  console.log('🧹 Full clean text:', cleanText);
  console.log('🧹 Clean text lines:', cleanText.split('\n').map((line, i) => `${i}: "${line}"`));
  
  // Extract beneficiary name only
  const beneficiaryMatch = cleanText.match(
    /Beneficiary\s*Name\s*:\s*([A-Z\s]+?)(?=\s+Beneficiary\s+Account|\s+Beneficiary\s+Bank|\s+Type|\s+Amount|\s+Session|\n|$)/i
  );

  console.log('🔍 Beneficiary regex match:', beneficiaryMatch);
  let extractedBeneficiaryName = '';
  if (beneficiaryMatch && beneficiaryMatch[1]) {
    extractedBeneficiaryName = beneficiaryMatch[1].trim();
    console.log('✅ Extracted beneficiary:', extractedBeneficiaryName);
  } else {
    console.log('❌ No beneficiary match found');
  }
  
  // Extract amount
  const amountMatch = cleanText.match(providusBankPatterns.amount);
  if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  
  // Extract transaction date
  const dateMatch = cleanText.match(providusBankPatterns.transactionDate);
  console.log('🔍 Date pattern test:', providusBankPatterns.transactionDate);
  console.log('🔍 Date match result:', dateMatch);
  if (dateMatch) {
    const fullDate = dateMatch[1]; 
    console.log('🔍 Full date string:', fullDate);
    // Friday November 14, 2025 16:21:31

    const parts = fullDate.match(
      /([A-Za-z]+)\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})/
    );
    console.log('🔍 Date parts:', parts);

    if (parts) {
      weekday = parts[1];
      const monthName = parts[2];
      const day = parseInt(parts[3]);
      const year = parseInt(parts[4]);
      timeStr = parts[5];

      dateStr = `${year}-${String(getMonthNumber(monthName) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('🔍 Parsed date:', { weekday, monthName, day, year, timeStr, dateStr });
    }
  } else {
    console.log('❌ No date match found in clean text');
  }

  let senderMatch, transactionTypeMatch, sessionIdMatch;
  // Extract narration (handle empty case)
  const narrationMatch = cleanText.match(providusBankPatterns.narration);
  if (narrationMatch) narration = narrationMatch[1]?.trim() || '';

  const result = {
    beneficiaryName: extractedBeneficiaryName || 'Unknown Beneficiary',
    amount: amount || 0,
    transactionDate: dateStr ? {
      year: parseInt(dateStr.split('-')[0]),
      month: parseInt(dateStr.split('-')[1]),
      day: parseInt(dateStr.split('-')[2]),
      weekday: weekday || 'Unknown',
      time: timeStr || '00:00:00'
    } : undefined,
    narration: narration || 'Bank transfer transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };

  console.log('🏁 Final OCR Result:', result);
  return result;
}

/**
 * Parse Zenith Bank receipt format
 */
function parseZenithReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing Zenith Bank receipt format...`);
  
  // TODO: Implement Zenith-specific patterns
  return {
    beneficiaryName: 'Unknown Beneficiary',
    amount: 0,
    transactionDate: undefined,
    narration: 'Zenith Bank transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Parse GTBank receipt format
 */
function parseGTBReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing GTBank receipt format...`);
  
  // TODO: Implement GTBank-specific patterns
  return {
    beneficiaryName: 'Unknown Beneficiary',
    amount: 0,
    transactionDate: undefined,
    narration: 'GTBank transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Parse UBA receipt format
 */
function parseUBAReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing UBA receipt format...`);
  
  // TODO: Implement UBA-specific patterns
  return {
    beneficiaryName: 'Unknown Beneficiary',
    amount: 0,
    transactionDate: undefined,
    narration: 'UBA transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Parse Access Bank receipt format
 */
function parseAccessReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing Access Bank receipt format...`);
  
  // TODO: Implement Access Bank-specific patterns
  return {
    beneficiaryName: 'Unknown Beneficiary',
    amount: 0,
    transactionDate: undefined,
    narration: 'Access Bank transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Parse FirstBank receipt format
 */
function parseFirstBankReceipt(
  text: string,
  confidence: number,
  imageUrl: string
): OCRResult {
  console.log(`🔍 Parsing FirstBank receipt format...`);

  // Beneficiary
  const beneficiaryMatch = text.match(
    /Beneficiary\s*Name\s*:\s*~*\s*([A-Z\s]+?)(?=\s+Account|\s+Bank|\s+Transaction|\s+Reference|\n|$)/i
  );

  // Amount
  const amountMatch = text.match(/₦?\s*([\d,]+\.\d{2})/);

  // Date
  const dateMatch = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{2}),\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})/i
  );

  // Narration
  const narrationMatch = text.match(/Narration\s*:\s*(.+)/i);

  let transactionDate: OCRResult['transactionDate'] = undefined;

  if (dateMatch) {
    const [, month, day, year, time] = dateMatch;

    transactionDate = {
      year: Number(year),
      month,
      day: Number(day),
      time
    };
  }

  return {
    beneficiaryName: beneficiaryMatch?.[1]?.trim(),
    amount: amountMatch
      ? parseFloat(amountMatch[1].replace(/,/g, ''))
      : undefined,
    transactionDate,
    narration: narrationMatch?.[1]?.trim(),
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Parse Opay receipt format
 */
function parseOpayReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing Opay receipt format...`);
  
  // Clean text by removing emojis and special characters
  const cleanText = text.replace(/[👤📤📝🏁🔍💰💾✅❌⚠️—]/g, '').replace(/\s+/g, ' ').trim();
  console.log(`🧹 Cleaned OCR text: ${cleanText.substring(0, 200)}...`);
  
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let beneficiaryName = '';
  let amount = 0;
  let dateStr = '';
  let timeStr = '';
  let weekday = '';
  let narration = '';
  let reference = '';
  
  // Opay specific patterns - exact matching for this receipt format
  const opayPatterns = {
    paymentTo: /Payment\s*To\s*:\s*([A-Za-z\s]+)/i,
    merchantName: /Merchant\s*:\s*([A-Za-z\s]+)/i,
    amount: /Amount\s*:\s*₦\s*([\d,]+\.\d{2})/i,
    amountAlt: /~([\d,]+\.\d{2})/i, // Alternative pattern for ~1,500.00
    date: /Date\s*:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    dateAlt: /(\w+\s+\d{1,2}[a-z]*[;,]\s+\d{4})/i, // Alternative for "Dec 20th, 2025" or "Dec 20th; 2025"
    time: /Time\s*:\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
    timeAlt: /(\d{1,2}:\d{2}:\d{2})/i, // Alternative for "11:39:50"
    reference: /Reference\s*:\s*([A-Z0-9]+)/i,
    transactionNo: /Transaction-No\.\s*([A-Z0-9]+)/i, // For "Transaction-No. 251220010100532829615185"
    status: /Status\s*:\s*([A-Za-z]+)/i,
    paymentMethod: /Payment\s*Method\s*:\s*([A-Za-z\s]+)/i,
    narration: /Description\s*:\s*(.*)/i,
    recipientDetails: /Recipient\s*Details\s*([A-Z\s]+)/i,
    senderDetails: /Sender\s*Details\s*([A-Z\s]+)/i
  };

  console.log('🔍 Testing Opay patterns...');
  console.log('🧹 Full clean text:', cleanText);
  console.log('🧹 Clean text lines:', cleanText.split('\n').map((line, i) => `${i}: "${line}"`));
  
  // Extract beneficiary/merchant name
  const paymentToMatch = cleanText.match(opayPatterns.paymentTo);
  const merchantMatch = cleanText.match(opayPatterns.merchantName);
  const recipientMatch = cleanText.match(opayPatterns.recipientDetails);
  
  // More specific patterns for Opay format
  const recipientNameMatch = cleanText.match(/Recipient\s*Details\s*([A-Z\s]+?)\s*OPay/i);
  const senderNameMatch = cleanText.match(/Sender\s*Details\s*([A-Z\s]+?)\s*OPay/i);
  
  console.log('🔍 Payment To regex match:', paymentToMatch);
  console.log('🔍 Merchant regex match:', merchantMatch);
  console.log('🔍 Recipient Details regex match:', recipientMatch);
  console.log('🔍 Recipient Name regex match:', recipientNameMatch);
  console.log('🔍 Sender Name regex match:', senderNameMatch);
  
  if (paymentToMatch && paymentToMatch[1]) {
    beneficiaryName = paymentToMatch[1].trim();
    console.log('✅ Extracted Payment To:', beneficiaryName);
  } else if (merchantMatch && merchantMatch[1]) {
    beneficiaryName = merchantMatch[1].trim();
    console.log('✅ Extracted Merchant:', beneficiaryName);
  } else if (recipientNameMatch && recipientNameMatch[1]) {
    beneficiaryName = recipientNameMatch[1].trim();
    console.log('✅ Extracted Recipient Name:', beneficiaryName);
  } else if (recipientMatch && recipientMatch[1]) {
    beneficiaryName = recipientMatch[1].trim();
    console.log('✅ Extracted Recipient Details:', beneficiaryName);
  } else {
    console.log('❌ No beneficiary/merchant match found');
  }
  
  // Extract amount
  const amountMatch = cleanText.match(opayPatterns.amount);
  const amountAltMatch = cleanText.match(opayPatterns.amountAlt);
  console.log('🔍 Amount regex match:', amountMatch);
  console.log('🔍 Amount Alt regex match:', amountAltMatch);
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    console.log('✅ Extracted amount:', amount);
  } else if (amountAltMatch) {
    amount = parseFloat(amountAltMatch[1].replace(/,/g, ''));
    console.log('✅ Extracted amount (alt):', amount);
  } else {
    console.log('❌ No amount match found');
  }
  
  // Extract date
  const dateMatch = cleanText.match(opayPatterns.date);
  const dateAltMatch = cleanText.match(opayPatterns.dateAlt);
  console.log('🔍 Date regex match:', dateMatch);
  console.log('🔍 Date Alt regex match:', dateAltMatch);
  
  if (dateMatch) {
    dateStr = dateMatch[1];
    console.log('✅ Extracted date:', dateStr);
  } else if (dateAltMatch) {
    dateStr = dateAltMatch[1];
    console.log('✅ Extracted date (alt):', dateStr);
  } else {
    console.log('❌ No date match found');
  }
  
  // Extract time
  const timeMatch = cleanText.match(opayPatterns.time);
  const timeAltMatch = cleanText.match(opayPatterns.timeAlt);
  console.log('🔍 Time regex match:', timeMatch);
  console.log('🔍 Time Alt regex match:', timeAltMatch);
  
  if (timeMatch) {
    timeStr = timeMatch[1];
    console.log('✅ Extracted time:', timeStr);
  } else if (timeAltMatch) {
    timeStr = timeAltMatch[1];
    console.log('✅ Extracted time (alt):', timeStr);
  } else {
    console.log('❌ No time match found');
  }
  
  // Extract reference/transaction number
  const referenceMatch = cleanText.match(opayPatterns.reference);
  const transactionNoMatch = cleanText.match(opayPatterns.transactionNo);
  console.log('🔍 Reference regex match:', referenceMatch);
  console.log('🔍 Transaction No regex match:', transactionNoMatch);
  
  if (referenceMatch) {
    reference = referenceMatch[1];
    console.log('✅ Extracted reference:', reference);
  } else if (transactionNoMatch) {
    reference = transactionNoMatch[1];
    console.log('✅ Extracted transaction number:', reference);
  }
  
  // Extract narration/description
  const narrationMatch = cleanText.match(opayPatterns.narration);
  console.log('🔍 Narration regex match:', narrationMatch);
  if (narrationMatch && narrationMatch[1]) {
    narration = narrationMatch[1].trim();
    console.log('✅ Extracted narration:', narration);
  } else {
    narration = reference || 'Opay payment transaction';
    console.log('❌ No narration match found, using reference or default');
  }
  
  // Create structured transactionDate object
  let transactionDate = undefined;
  if (dateStr) {
    try {
      let parsedDate: Date;
      
      // Handle "Dec 20th, 2025" or "Dec 20th; 2025" format
      if (dateStr.match(/\w+\s+\d{1,2}[a-z]*[;,]\s+\d{4}/)) {
        // Remove ordinal suffixes (th, st, nd, rd) and replace semicolon with comma
        const cleanDateStr = dateStr.replace(/(\d{1,2})(?:th|st|nd|rd)/, '$1').replace(';', ',');
        parsedDate = new Date(cleanDateStr);
        console.log('🔍 Parsing date with ordinal format:', cleanDateStr);
      } else {
        parsedDate = new Date(dateStr);
        console.log('🔍 Parsing standard date format:', dateStr);
      }
      
      if (!isNaN(parsedDate.getTime())) {
        transactionDate = {
          year: parsedDate.getFullYear(),
          month: parsedDate.getMonth() + 1,
          day: parsedDate.getDate(),
          weekday: parsedDate.toLocaleDateString('en-US', { weekday: 'long' }),
          time: timeStr || parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        console.log('✅ Created transactionDate object:', transactionDate);
      } else {
        console.log('❌ Invalid date format');
      }
    } catch (error) {
      console.log('❌ Error parsing date:', error);
    }
  }

  const result = {
    beneficiaryName: beneficiaryName || 'Unknown Beneficiary',
    amount: amount,
    transactionDate: transactionDate,
    narration: narration || 'Opay payment transaction',
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };

  console.log('🏁 Final Opay OCR Result:', result);
  return result;
}

/**
 * Parse Moniepoint receipt format
 */
function parseMoniepointReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing Moniepoint receipt format...`);
  
  // Extract amount from Moniepoint format
  const amountMatch = text.match(/(?:₦|NGN|N)\s*([\d,]+\.\d{2})/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  
  // Extract merchant name
  const merchantMatch = text.match(/(?:Merchant|Paid to|Store)\s*[:\-]?\s*([^\n]+)/i);
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';
  
  // Extract date and convert to proper format
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  let transactionDate = undefined;
  if (dateMatch) {
    const date = new Date(dateMatch[1]);
    if (!isNaN(date.getTime())) {
      transactionDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
  
  return {
    beneficiaryName: merchant,
    amount: amount,
    transactionDate: transactionDate,
    narration: text.substring(0, 200),
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Generic fallback parser for unknown receipt formats
 */
function parseGenericReceipt(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Parsing generic receipt format...`);
  
  // Extract amount as fallback
  const amountMatch = text.match(/([\d,]+\.\d{2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  
  return {
    beneficiaryName: 'Unknown',
    amount: amount,
    transactionDate: undefined,
    narration: text.substring(0, 200),
    confidence: Math.round(confidence),
    scannedDocument: imageUrl
  };
}

/**
 * Main extraction router - routes to bank-specific parsers
 */
function extractDetailedReceiptData(text: string, confidence: number, imageUrl: string): OCRResult {
  console.log(`🔍 Starting multi-bank receipt extraction...`);
  
  // Clean text for bank detection
  const cleanText = text.replace(/[👤📤📝🏁🔍💰💾✅❌⚠️—]/g, '').replace(/\s+/g, ' ').trim();
  
  // Detect bank type
  const bank = detectBank(cleanText);
  console.log(`🏦 Detected bank: ${bank}`);
  
  // Route to appropriate parser
  switch (bank) {
    case 'providus':
      return parseProvidusReceipt(cleanText, confidence, imageUrl);
      
    case 'zenith':
      return parseZenithReceipt(cleanText, confidence, imageUrl);
      
    case 'gtbank':
      return parseGTBReceipt(cleanText, confidence, imageUrl);
      
    case 'uba':
      return parseUBAReceipt(cleanText, confidence, imageUrl);
      
    case 'access':
      return parseAccessReceipt(cleanText, confidence, imageUrl);
      
    case 'firstbank':
      return parseFirstBankReceipt(cleanText, confidence, imageUrl);
      
    case 'opay':
      return parseOpayReceipt(cleanText, confidence, imageUrl);
      
    case 'moniepoint':
      return parseMoniepointReceipt(cleanText, confidence, imageUrl);
      
    default:
      return parseGenericReceipt(cleanText, confidence, imageUrl);
  }
}

/**
 * Process a receipt image using unified OCR technology
 * @param file - The receipt image file to process
 * @returns Promise<ScannedData> - Extracted receipt data
 */
export async function processReceipt(file: File): Promise<ScannedData> {
  try {
    // Use dual OCR system: PaddleOCR first, Tesseract fallback
    const ocrResult = await processReceiptOCR(file);
    
    console.log('OCR Results:', {
      source: ocrResult.source,
      confidence: ocrResult.confidence,
      processingTime: `${ocrResult.processingTime?.toFixed(2)}ms`,
      textLength: ocrResult.text.length
    });
    
    // Extract structured data from OCR text using ProvidusBank-specific logic
    const extractedData = extractDetailedReceiptData(ocrResult.text, ocrResult.confidence, URL.createObjectURL(file));
    
    // Convert to standard format
    const standardResult = {
      merchant: extractedData.beneficiaryName || 'Unknown Merchant',
      amount: extractedData.amount || 0,
      date: extractedData.transactionDate ? 
        `${extractedData.transactionDate.year}-${String(extractedData.transactionDate.month).padStart(2, '0')}-${String(extractedData.transactionDate.day).padStart(2, '0')}` : 
        new Date().toISOString().split('T')[0],
      items: extractedData.narration ? [extractedData.narration] : [],
      confidence: Math.round(ocrResult.confidence),
      notes: extractedData.narration || ocrResult.text.substring(0, 200) + (ocrResult.text.length > 200 ? '...' : ''),
      // Include extracted fields for frontend
      weekday: extractedData.transactionDate?.weekday || '',
      time: extractedData.transactionDate?.time || '', // Use OCR time, not system time
      transactionDate: extractedData.transactionDate
    };
    
    // Add OCR metadata
    return {
      ...standardResult,
      ocrSource: ocrResult.source,
      processingTime: ocrResult.processingTime
    };
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process receipt with OCR');
  }
}

export default { 
  processReceipt, 
  extractDetailedReceiptData 
};
