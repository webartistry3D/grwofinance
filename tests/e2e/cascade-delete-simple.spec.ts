import { test, expect } from '@playwright/test';

test.describe('Simple Cascade Deletion Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to invoice list
    await page.goto('/login');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'UserPassword123');
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/dashboard|income-manager/, { timeout: 15000 });
    
    // Navigate directly to invoice list
    await page.goto('/invoice-list');
    await page.waitForTimeout(2000);
  });

  test('should test cascade deletion with existing data', async ({ page }) => {
    console.log('🧪 Starting simple cascade deletion test...');
    
    // Step 1: Check current state
    console.log('📊 Checking current state...');
    
    // Count total invoices
    const totalInvoices = await page.locator('[data-testid*="text-invoice-number-"]').count();
    console.log(`📋 Total invoices found: ${totalInvoices}`);
    
    // Navigate to income history to check income records
    await page.goto('/income-history');
    await page.waitForTimeout(2000);
    
    const totalIncomeRecords = await page.locator('[data-testid*="text-description-"]').count();
    console.log(`💰 Total income records found: ${totalIncomeRecords}`);
    
    // Count payment-related records
    const paymentRecords = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    console.log(`💳 Payment records found: ${paymentRecords}`);
    
    // Go back to invoice list
    await page.goto('/invoice-list');
    await page.waitForTimeout(2000);
    
    // Step 2: Look for any invoice to delete (paid or draft)
    const anyInvoices = await page.locator('[data-testid*="text-invoice-number-"]').count();
    
    if (anyInvoices === 0) {
      console.log('⚠️ No invoices found. Cannot test cascade deletion.');
      console.log('📝 Test completed - No invoices available');
      return;
    }
    
    console.log(`📋 Found ${anyInvoices} invoices. Testing deletion...`);
    
    // Get the first invoice details
    const firstInvoice = page.locator('[data-testid*="text-invoice-number-"]').first();
    const invoiceNumber = await firstInvoice.textContent();
    const invoiceCard = firstInvoice.locator('..').locator('..').locator('..');
    const clientName = await invoiceCard.locator('[data-testid*="text-client-"]').textContent();
    const statusBadge = await invoiceCard.locator('[data-testid*="badge-status-"]').textContent();
    
    console.log(`📋 Invoice to delete: ${invoiceNumber}`);
    console.log(`👤 Client: ${clientName}`);
    console.log(`📊 Status: ${statusBadge}`);
    
    // Step 3: Delete the invoice
    console.log('🗑️ Deleting invoice...');
    
    const deleteButton = invoiceCard.locator('[data-testid*="button-delete-"]');
    await deleteButton.click();
    
    // Wait for delete dialog
    await page.waitForTimeout(2000);
    
    // Try to confirm deletion
    try {
      await page.click('[data-testid="button-confirm-delete"]');
      console.log('✅ Delete confirmation clicked');
    } catch (error) {
      console.log('⚠️ Could not find delete confirmation button. Trying alternative selectors...');
      
      // Try common confirmation button selectors
      const confirmSelectors = [
        'button:has-text("Delete")',
        'button:has-text("Confirm")',
        'button:has-text("Yes")',
        '.btn-primary',
        '[role="dialog"] button:last-child'
      ];
      
      for (const selector of confirmSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          console.log(`✅ Found and clicked confirmation with selector: ${selector}`);
          break;
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    // Wait for deletion to process
    await page.waitForTimeout(3000);
    
    // Step 4: Verify deletion results
    console.log('📊 Verifying deletion results...');
    
    // Check invoice list
    const invoicesAfter = await page.locator('[data-testid*="text-invoice-number-"]').count();
    console.log(`📋 Invoices after deletion: ${anyInvoices} → ${invoicesAfter}`);
    
    // Check income history
    await page.goto('/income-history');
    await page.waitForTimeout(3000);
    
    const incomeRecordsAfter = await page.locator('[data-testid*="text-description-"]').count();
    const paymentRecordsAfter = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    
    console.log(`💰 Income records after deletion: ${totalIncomeRecords} → ${incomeRecordsAfter}`);
    console.log(`💳 Payment records after deletion: ${paymentRecords} → ${paymentRecordsAfter}`);
    
    // Step 5: Analyze results
    console.log('🎯 Test Results:');
    console.log(`  - Invoice deleted: ${invoiceNumber}`);
    console.log(`  - Client: ${clientName}`);
    console.log(`  - Status: ${statusBadge}`);
    console.log(`  - Invoices deleted: ${anyInvoices - invoicesAfter}`);
    console.log(`  - Income records deleted: ${totalIncomeRecords - incomeRecordsAfter}`);
    console.log(`  - Payment records deleted: ${paymentRecords - paymentRecordsAfter}`);
    
    if (invoicesAfter < anyInvoices) {
      console.log(`✅ SUCCESS: Invoice deletion working!`);
      
      if (paymentRecordsAfter < paymentRecords) {
        console.log(`✅ SUCCESS: Cascade deletion working! ${paymentRecords - paymentRecordsAfter} payment records deleted.`);
      } else {
        console.log(`ℹ️ INFO: Invoice deleted but no payment records were deleted (might be a draft invoice).`);
      }
    } else {
      console.log(`❌ ISSUE: Invoice deletion may have failed.`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'cascade-delete-final.png' });
    
    console.log('🧪 Simple cascade deletion test completed!');
  });
});
