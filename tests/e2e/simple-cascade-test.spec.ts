import { test, expect } from '@playwright/test';

test.describe('Simple Cascade Deletion Test', () => {
  test('manual test for cascade deletion', async ({ page }) => {
    console.log('🧪 Starting manual cascade deletion test...');
    
    // Go directly to invoice list (bypass login for now)
    await page.goto('/invoice-list');
    
    // Wait a bit for the page to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot to see what we get
    await page.screenshot({ path: 'invoice-list-page.png' });
    
    // Check if we have invoices or need to login
    const hasInvoiceElements = await page.locator('[data-testid*="text-invoice-number-"]').count();
    
    if (hasInvoiceElements === 0) {
      console.log('📄 No invoices found or login required. Taking screenshot for diagnosis...');
      await page.screenshot({ path: 'no-invoices-found.png' });
      
      // Try to find login form
      const hasLoginForm = await page.locator('[data-testid="input-email"]').count();
      if (hasLoginForm > 0) {
        console.log('🔐 Login form detected. Please check credentials manually.');
        await page.screenshot({ path: 'login-form.png' });
      }
      
      return; // End test if we can't proceed
    }
    
    console.log(`📊 Found ${hasInvoiceElements} invoices on the page`);
    
    // Look for paid invoices
    const paidInvoices = await page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).count();
    
    console.log(`💰 Found ${paidInvoices} paid invoices`);
    
    if (paidInvoices === 0) {
      console.log('⚠️ No paid invoices found. Cannot test cascade deletion.');
      await page.screenshot({ path: 'no-paid-invoices.png' });
      return;
    }
    
    // Get the first paid invoice details
    const firstPaidInvoice = page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).first();
    
    const invoiceCard = firstPaidInvoice.locator('..').locator('..').locator('..');
    const invoiceNumber = await invoiceCard.locator('[data-testid*="text-invoice-number-"]').textContent();
    const clientName = await invoiceCard.locator('[data-testid*="text-client-"]').textContent();
    const amount = await invoiceCard.locator('[data-testid*="text-amount-"]').textContent();
    
    console.log(`📋 Found paid invoice: ${invoiceNumber} from ${clientName} for ${amount}`);
    
    // Take screenshot before deletion
    await page.screenshot({ path: 'before-deletion.png' });
    
    // Navigate to income history to check initial state
    await page.goto('/income-history');
    await page.waitForTimeout(3000);
    
    // Count income records before deletion
    const incomeRecordsBefore = await page.locator('[data-testid*="text-description-"]').count();
    const paymentRecordsBefore = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    
    console.log(`📊 Income history state before deletion:`);
    console.log(`  - Total records: ${incomeRecordsBefore}`);
    console.log(`  - Payment records: ${paymentRecordsBefore}`);
    
    // Take screenshot of income history
    await page.screenshot({ path: 'income-history-before.png' });
    
    // Go back to invoice list for deletion
    await page.goto('/invoice-list');
    await page.waitForTimeout(3000);
    
    // Find and delete the paid invoice
    const deleteButton = page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).first().locator('..').locator('..').locator('..').locator('[data-testid*="button-delete-"]');
    
    console.log('🗑️ Clicking delete button...');
    await deleteButton.click();
    
    // Wait for delete dialog
    await page.waitForTimeout(2000);
    
    // Take screenshot of delete dialog
    await page.screenshot({ path: 'delete-dialog.png' });
    
    // Try to confirm deletion (this might fail if dialog selector is wrong)
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
    
    // Take screenshot after deletion
    await page.screenshot({ path: 'after-deletion.png' });
    
    // Check income history again
    await page.goto('/income-history');
    await page.waitForTimeout(3000);
    
    // Count income records after deletion
    const incomeRecordsAfter = await page.locator('[data-testid*="text-description-"]').count();
    const paymentRecordsAfter = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    
    console.log(`📊 Income history state after deletion:`);
    console.log(`  - Total records: ${incomeRecordsBefore} → ${incomeRecordsAfter}`);
    console.log(`  - Payment records: ${paymentRecordsBefore} → ${paymentRecordsAfter}`);
    
    // Take screenshot of income history after
    await page.screenshot({ path: 'income-history-after.png' });
    
    // Analyze results
    const paymentRecordsDeleted = paymentRecordsBefore - paymentRecordsAfter;
    console.log(`🎯 Test Results:`);
    console.log(`  - Invoice deleted: ${invoiceNumber}`);
    console.log(`  - Client: ${clientName}`);
    console.log(`  - Amount: ${amount}`);
    console.log(`  - Payment records deleted: ${paymentRecordsDeleted}`);
    
    if (paymentRecordsDeleted > 0) {
      console.log(`✅ SUCCESS: Cascade deletion working! ${paymentRecordsDeleted} payment records were deleted.`);
    } else {
      console.log(`❌ ISSUE: No payment records were deleted. Cascade deletion may not be working.`);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-result.png' });
    
    console.log('🧪 Manual test completed. Check the screenshots for detailed results.');
  });
});
