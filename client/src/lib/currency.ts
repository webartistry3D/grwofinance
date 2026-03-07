export function formatNaira(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '₦0.00';
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'symbol'
  }).format(numericAmount).replace('NGN', '₦');
}

export function parseAmount(value: string): number {
  // Remove currency symbols and commas, then parse
  const cleaned = value.replace(/[₦,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatAmountInput(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/[^0-9]/g, '');
  
  if (!cleaned) return '';
  
  // Add thousand separators for display
  const numericValue = parseInt(cleaned, 10);
  return numericValue.toLocaleString('en-US');
}

export function formatNairaCurrencyInput(value: string): string {
  const formatted = formatAmountInput(value);
  return formatted ? `₦${formatted}` : '';
}
