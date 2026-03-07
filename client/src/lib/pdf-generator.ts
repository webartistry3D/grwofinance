import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { formatNaira } from './currency';
import { type Expense } from '@shared/schema';

// Helper function to format currency with Naira sign for PDF
const formatNairaPDF = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₦0.00';
  return `₦${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export function generateReceiptPDF(expense: Expense): string {
  const doc = new jsPDF({
    format: 'a5',
    orientation: 'portrait'
  });
  
  // Set up the document - compact layout for A5
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12; // Reduced margins for A5
  let yPosition = margin;
  
  // Helper function to add text
  const addText = (text: string, fontSize: number = 10, fontStyle: string = 'normal', x: number = margin) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, x, yPosition);
    yPosition += fontSize * 0.35 + 2;
    return yPosition;
  };
  
  // Helper function to add right-aligned text
  const addRightText = (text: string, fontSize: number = 10, fontStyle: string = 'normal') => {
    const textWidth = doc.getTextWidth(text);
    return addText(text, fontSize, fontStyle, pageWidth - margin - textWidth);
  };
  
  // Header Section - Professional for A5
  doc.setFillColor(59, 130, 246); // Blue background
  doc.rect(margin, margin, pageWidth - 2 * margin, 35, 'F'); // Increased height to prevent overlap
  
  // Add border to header
  doc.setDrawColor(41, 98, 184); // Darker blue border
  doc.setLineWidth(1);
  doc.rect(margin, margin, pageWidth - 2 * margin, 35);
  
  // Left side content
  yPosition = margin + 10;
  addText('OFFICIAL RECEIPT', 16, 'bold', margin + 5); // More professional title
  addText('GRWO Finance Ltd.', 10, 'normal', margin + 5); // Added Ltd.
  addText(`Receipt No: ${expense.id.substring(0, 8).toUpperCase()}`, 7, 'normal', margin + 5); // Changed ID to Receipt No
  
  // Right side content - positioned within header bounds
  const rightX = pageWidth - margin - 5;
  let headerRightY = margin + 10;
  
  // Date (right-aligned)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const dateText = format(new Date(expense.date), 'MMM dd, yyyy');
  doc.text(dateText, rightX - doc.getTextWidth(dateText), headerRightY);
  
  // Time (right-aligned, below date)
  headerRightY += 6; // Add spacing before time
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const timeText = `Time: ${format(new Date(), 'HH:mm')}`;
  doc.text(timeText, rightX - doc.getTextWidth(timeText), headerRightY);
  
  yPosition = margin + 40; // Increased to account for larger header
  
  // Main Content Area - Optimized for A5
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 100, 'F'); // Reduced height
  
  yPosition += 8;
  
  // Merchant and Category - Side by side
  addText(`Merchant: ${expense.merchant}`, 10, 'bold'); // Reduced font size
  const categoryY = yPosition;
  addText(`Category: ${expense.category}`, 10, 'normal', pageWidth - margin - 35); // Reduced font size
  
  yPosition = Math.max(yPosition, categoryY) + 6; // Reduced spacing
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6; // Reduced spacing
  
  // Financial Details - Two column layout
  addText('Amount Details:', 10, 'bold'); // Reduced font size
  
  const leftColumn = margin + 5;
  const rightColumn = pageWidth - margin - 5; // Right-aligned column
  let leftY = yPosition;
  let rightY = yPosition;
  
  // Left column - labels
  doc.setFontSize(9); // Reduced font size
  doc.setFont('helvetica', 'normal');
  doc.text('Base Amount:', leftColumn, leftY);
  leftY += 5; // Reduced spacing
  if (expense.vatAmount && parseFloat(expense.vatAmount) > 0) {
    doc.text(`VAT (${expense.vatRate}%):`, leftColumn, leftY);
    leftY += 5;
  }
  if (expense.whtAmount && parseFloat(expense.whtAmount) > 0) {
    doc.text(`WHT (${expense.whtRate}%):`, leftColumn, leftY);
    leftY += 5;
  }
  if (expense.netAmount && parseFloat(expense.netAmount) !== parseFloat(expense.amount)) {
    doc.text('Net Amount:', leftColumn, leftY);
    leftY += 5;
  }
  
  // Right column - amounts (right-aligned)
  doc.setFont('helvetica', 'bold');
  const baseAmount = formatNairaPDF(expense.amount);
  console.log('Base amount formatted:', baseAmount); // Debug log
  doc.text(baseAmount, rightColumn - doc.getTextWidth(baseAmount), rightY); // Right-aligned
  rightY += 5;
  if (expense.vatAmount && parseFloat(expense.vatAmount) > 0) {
    const vatAmount = formatNairaPDF(expense.vatAmount);
    console.log('VAT amount formatted:', vatAmount); // Debug log
    doc.text(vatAmount, rightColumn - doc.getTextWidth(vatAmount), rightY); // Right-aligned
    rightY += 5;
  }
  if (expense.whtAmount && parseFloat(expense.whtAmount) > 0) {
    const whtAmount = formatNairaPDF(expense.whtAmount);
    console.log('WHT amount formatted:', whtAmount); // Debug log
    doc.text(whtAmount, rightColumn - doc.getTextWidth(whtAmount), rightY); // Right-aligned
    rightY += 5;
  }
  if (expense.netAmount && parseFloat(expense.netAmount) !== parseFloat(expense.amount)) {
    const netAmount = formatNairaPDF(expense.netAmount);
    console.log('Net amount formatted:', netAmount); // Debug log
    doc.text(netAmount, rightColumn - doc.getTextWidth(netAmount), rightY); // Right-aligned
    rightY += 5;
  }
  
  yPosition = Math.max(leftY, rightY) + 6; // Reduced spacing
  
  // Total - Highlighted and Right-aligned
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 12, 'F'); // Reduced height
  doc.setTextColor(255, 255, 255);
  const totalAmount = (parseFloat(expense.amount) || 0) + (parseFloat(expense.vatAmount) || 0);
  const totalText = `TOTAL: ${formatNairaPDF(totalAmount)}`;
  console.log('Total amount formatted:', totalText); // Debug log
  addText(totalText, 11, 'bold', margin + 5); // Reduced font size, left-aligned
  doc.setTextColor(0, 0, 0);
  
  yPosition += 15; // Reduced spacing
  
  // Notes section - if available (optimized for A5)
  if (expense.notes && yPosition < pageHeight - 40) { // Check if we have space
    addText('Notes:', 9, 'bold'); // Reduced font size
    doc.setFontSize(8); // Reduced font size
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(expense.notes, pageWidth - 2 * margin - 10);
    // Limit notes to 2 lines for A5
    const limitedNotes = notesLines.slice(0, 2);
    doc.text(limitedNotes, margin + 5, yPosition);
    yPosition += limitedNotes.length * 3.5 + 3; // Reduced spacing
    if (notesLines.length > 2) {
      doc.text('...', margin + 5, yPosition);
      yPosition += 3;
    }
  }
  
  // Items section - if available (optimized for A5)
  if (expense.items && expense.items.length > 0 && yPosition < pageHeight - 35) { // Check if we have space
    addText('Items:', 9, 'bold'); // Reduced font size
    doc.setFontSize(8); // Reduced font size
    doc.setFont('helvetica', 'normal');
    expense.items.slice(0, 2).forEach((item, index) => { // Max 2 items for A5
      doc.text(`${index + 1}. ${item}`, margin + 5, yPosition);
      yPosition += 3.5; // Reduced spacing
    });
    if (expense.items.length > 2) {
      doc.text(`... and ${expense.items.length - 2} more`, margin + 5, yPosition);
      yPosition += 3.5;
    }
  }
  
  // Footer - Professional for A5
  yPosition = pageHeight - 22; // Adjusted for A5
  
  // Add footer background
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 22, 'F');
  
  // Add footer border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 22);
  
  doc.setFontSize(7); // Reduced font size
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and is valid without signature', margin, yPosition + 8);
  doc.text('GRWO Finance Ltd. | Expense Management System', margin, yPosition + 14);
  doc.text(`Receipt ID: ${expense.id.substring(0, 12).toUpperCase()}`, margin, yPosition + 20); // Shortened ID
  
  // Generate the PDF as a data URL
  const pdfDataUri = doc.output('datauristring');
  return pdfDataUri;
}

export function downloadReceiptPDF(expense: Expense) {
  const pdfDataUri = generateReceiptPDF(expense);
  const link = document.createElement('a');
  link.href = pdfDataUri;
  link.download = `receipt-${expense.merchant.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(expense.date), 'yyyy-MM-dd')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
