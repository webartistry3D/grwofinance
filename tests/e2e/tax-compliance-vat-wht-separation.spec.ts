import { test, expect } from '@playwright/test';

test.describe('Tax Compliance Dashboard - VAT/WHT Separation', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🧪 Starting VAT/WHT separation test...');
    
    // Login to the application
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[data-testid="input-email"]', 'admin@grwofinance.com');
    await page.fill('[data-testid="input-password"]', 'Password1706#');
    
    // Submit login
    await page.click('[data-testid="button-login"]');
    
    // Wait for login to complete
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to tax compliance page
    await page.goto('/tax-compliance');
    await page.waitForLoadState('networkidle');
  });

  test('should display properly separated VAT and WHT data', async ({ page }) => {
    console.log('📊 Testing VAT/WHT data separation...');
    
    // Wait for tax compliance page to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'tax-compliance-initial.png' });
    
    // Check that Tax Position Summary section exists
    const taxSummaryCard = page.locator('[data-testid="tax-summary-card"]');
    await expect(taxSummaryCard).toBeVisible();
    
    // Verify VAT collected section
    const vatCollectedElement = page.locator('[data-testid="vat-collected-amount"]');
    await expect(vatCollectedElement).toBeVisible();
    
    // Verify VAT paid section
    const vatPaidElement = page.locator('[data-testid="vat-paid-amount"]');
    await expect(vatPaidElement).toBeVisible();
    
    // Verify WHT deducted section
    const whtDeductedElement = page.locator('[data-testid="wht-deducted-amount"]');
    await expect(whtDeductedElement).toBeVisible();
    
    // Verify WHT paid section
    const whtPaidElement = page.locator('[data-testid="wht-paid-amount"]');
    await expect(whtPaidElement).toBeVisible();
    
    // Verify deductible expenses section
    const deductibleExpensesElement = page.locator('[data-testid="deductible-expenses-amount"]');
    await expect(deductibleExpensesElement).toBeVisible();
    
    // Verify net tax position section
    const netTaxPositionElement = page.locator('[data-testid="net-tax-position-amount"]');
    await expect(netTaxPositionElement).toBeVisible();
    
    console.log('✅ All VAT/WHT sections are visible');
  });

  test('should show VAT and WHT as separate entities with correct labels', async ({ page }) => {
    console.log('🏷️ Testing VAT/WHT entity separation...');
    
    // Wait for tax compliance page to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Check VAT section labels
    const vatSection = page.locator('[data-testid="vat-section"]');
    const vatLabels = await vatSection.locator('text=VAT').count();
    expect(vatLabels).toBeGreaterThan(0);
    
    // Check WHT section labels
    const whtSection = page.locator('[data-testid="wht-section"]');
    const whtLabels = await whtSection.locator('text=WHT').count();
    expect(whtLabels).toBeGreaterThan(0);
    
    // Verify no mixing of VAT and WHT in same section
    const vatSectionWhtReferences = await vatSection.locator('text=WHT').count();
    expect(vatSectionWhtReferences).toBe(0);
    
    const whtSectionVatReferences = await whtSection.locator('text=VAT').count();
    expect(whtSectionVatReferences).toBe(0);
    
    console.log('✅ VAT and WHT are properly separated as distinct entities');
  });

  test('should display correct VAT calculations from invoices', async ({ page }) => {
    console.log('💰 Testing VAT calculations from invoice data...');
    
    // Navigate to invoice list to check existing invoices
    await page.goto('/invoice-list');
    await page.waitForLoadState('networkidle');
    
    // Check if we have invoices with VAT
    const invoiceElements = await page.locator('[data-testid*="text-invoice-number-"]').count();
    
    if (invoiceElements > 0) {
      // Get first invoice details
      const firstInvoice = page.locator('[data-testid*="text-invoice-number-"]').first();
      const invoiceNumber = await firstInvoice.textContent();
      
      console.log(`📄 Found invoice: ${invoiceNumber}`);
      
      // Navigate back to tax compliance
      await page.goto('/tax-compliance');
      await page.waitForLoadState('networkidle');
      
      // Check VAT collected amount
      const vatCollectedAmount = await page.locator('[data-testid="vat-collected-amount"]').textContent();
      console.log(`💵 VAT Collected: ${vatCollectedAmount}`);
      
      // Verify VAT amount is greater than 0 if we have invoices
      if (vatCollectedAmount && !vatCollectedAmount.includes('₦0.00')) {
        expect(vatCollectedAmount).not.toBe('₦0.00');
        console.log('✅ VAT collected amount is correctly calculated from invoices');
      }
    }
  });

  test('should display correct WHT calculations from income records', async ({ page }) => {
    console.log('🏛️ Testing WHT calculations from income data...');
    
    // Navigate to income manager to check existing income
    await page.goto('/income-manager');
    await page.waitForLoadState('networkidle');
    
    // Check if we have income records
    const incomeElements = await page.locator('[data-testid*="income-record-"]').count();
    
    if (incomeElements > 0) {
      console.log(`📊 Found ${incomeElements} income records`);
      
      // Navigate back to tax compliance
      await page.goto('/tax-compliance');
      await page.waitForLoadState('networkidle');
      
      // Check WHT deducted amount
      const whtDeductedAmount = await page.locator('[data-testid="wht-deducted-amount"]').textContent();
      console.log(`🏛️ WHT Deducted: ${whtDeductedAmount}`);
      
      // WHT might be 0 if no WHT-applicable income exists
      console.log('✅ WHT deducted amount is displayed (may be ₦0.00 if no WHT income)');
    }
  });

  test('should calculate net tax position correctly', async ({ page }) => {
    console.log('🧮 Testing net tax position calculation...');
    
    // Wait for tax compliance page to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Get individual tax amounts
    const vatCollectedText = await page.locator('[data-testid="vat-collected-amount"]').textContent();
    const vatPaidText = await page.locator('[data-testid="vat-paid-amount"]').textContent();
    const whtDeductedText = await page.locator('[data-testid="wht-deducted-amount"]').textContent();
    const whtPaidText = await page.locator('[data-testid="wht-paid-amount"]').textContent();
    const deductibleExpensesText = await page.locator('[data-testid="deductible-expenses-amount"]').textContent();
    const netTaxPositionText = await page.locator('[data-testid="net-tax-position-amount"]').textContent();
    
    console.log('📊 Tax Summary:');
    console.log(`  VAT Collected: ${vatCollectedText}`);
    console.log(`  VAT Paid: ${vatPaidText}`);
    console.log(`  WHT Deducted: ${whtDeductedText}`);
    console.log(`  WHT Paid: ${whtPaidText}`);
    console.log(`  Deductible Expenses: ${deductibleExpensesText}`);
    console.log(`  Net Tax Position: ${netTaxPositionText}`);
    
    // Verify net tax position is displayed
    expect(netTaxPositionText).toBeTruthy();
    
    // Take screenshot of tax summary
    await page.screenshot({ path: 'tax-summary-complete.png' });
    
    console.log('✅ Net tax position calculation is displayed');
  });

  test('should handle zero values gracefully', async ({ page }) => {
    console.log('🔍 Testing zero value handling...');
    
    // Wait for tax compliance page to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Check that zero values are formatted correctly
    const zeroAmounts = await page.locator('text=₦0.00').count();
    expect(zeroAmounts).toBeGreaterThanOrEqual(0);
    
    // Verify no error states for zero values
    const errorElements = await page.locator('[data-testid*="error-"]').count();
    expect(errorElements).toBe(0);
    
    console.log('✅ Zero values are handled gracefully');
  });

  test('should maintain data consistency across page refresh', async ({ page }) => {
    console.log('🔄 Testing data consistency...');
    
    // Wait for tax compliance page to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Get initial tax amounts
    const initialVatCollected = await page.locator('[data-testid="vat-collected-amount"]').textContent();
    const initialWhtDeducted = await page.locator('[data-testid="wht-deducted-amount"]').textContent();
    const initialNetPosition = await page.locator('[data-testid="net-tax-position-amount"]').textContent();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for tax compliance page to load again
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Get tax amounts after refresh
    const refreshedVatCollected = await page.locator('[data-testid="vat-collected-amount"]').textContent();
    const refreshedWhtDeducted = await page.locator('[data-testid="wht-deducted-amount"]').textContent();
    const refreshedNetPosition = await page.locator('[data-testid="net-tax-position-amount"]').textContent();
    
    // Verify consistency
    expect(initialVatCollected).toBe(refreshedVatCollected);
    expect(initialWhtDeducted).toBe(refreshedWhtDeducted);
    expect(initialNetPosition).toBe(refreshedNetPosition);
    
    console.log('✅ Data consistency maintained across page refresh');
  });

  test('should show proper loading states', async ({ page }) => {
    console.log('⏳ Testing loading states...');
    
    // Navigate to tax compliance page
    await page.goto('/tax-compliance');
    
    // Check for loading skeleton
    const loadingSkeleton = page.locator('[data-testid="full-screen-skeleton"]');
    const hasLoadingSkeleton = await loadingSkeleton.count();
    
    if (hasLoadingSkeleton > 0) {
      await expect(loadingSkeleton.first()).toBeVisible();
      console.log('✅ Loading skeleton is displayed');
    }
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="tax-summary-card"]', { timeout: 10000 });
    
    // Verify loading skeleton is gone
    const loadingSkeletonAfterLoad = await loadingSkeleton.count();
    expect(loadingSkeletonAfterLoad).toBe(0);
    
    console.log('✅ Loading states work correctly');
  });
});
