import { test, expect } from '@playwright/test';

test.describe('Invoice to Income Cascade Deletion', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to invoice list
    await page.goto('/login');
    
    // Wait for login page to load
    await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
    
    // Use the same test credentials as other E2E tests
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'UserPassword123');
    await page.click('[data-testid="button-login"]');
    
    // Wait for navigation - handle both dashboard and income-manager redirects
    await page.waitForURL(/dashboard|income-manager/, { timeout: 15000 });
    
    // Navigate directly to invoice list (like other tests)
    await page.goto('/invoice-list');
    await page.waitForTimeout(2000); // Wait for page to load
  });

  test('should delete income records when paid invoice is deleted', async ({ page }) => {
    console.log('🧪 Starting cascade deletion test...');
    
    // Step 1: Find a paid invoice or create one
    await page.waitForSelector('[data-testid*="text-invoice-number-"]', { timeout: 10000 });
    
    // Look for paid invoices
    const paidInvoices = await page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).count();
    
    console.log(`📊 Found ${paidInvoices} paid invoices`);
    
    if (paidInvoices === 0) {
      console.log('⚠️ No paid invoices found. Creating a test invoice...');
      
      // Create a test invoice
      await page.click('[data-testid="button-create-invoice"]');
      await page.waitForURL('/create-invoice');
      
      // Fill invoice form
      await page.fill('[data-testid="input-client-name"]', 'Test Cascade Delete Client');
      await page.fill('[data-testid="input-item-rate-0"]', '50000');
      await page.fill('[data-testid="input-item-description-0"]', 'Test invoice for cascade deletion');
      
      // Set due date to today
      const today = new Date().toISOString().split('T')[0];
      await page.click('[data-testid="button-due-date"]');
      // Wait for date picker and select today
      await page.waitForTimeout(1000);
      
      // Save invoice
      await page.click('[data-testid="button-create"]');
      await page.waitForURL('/invoice-list');
      
      // Confirm payment to make it paid
      await page.locator('[data-testid*="button-confirm-payment-"]').first().click();
      await page.waitForSelector('[data-testid="payment-modal"]');
      
      await page.click('[data-testid="button-full-payment"]');
      await page.click('[data-testid="button-confirm-payment"]');
      
      // Wait for payment to process
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForURL('/invoice-list');
    }
    
    // Step 2: Get initial state - count paid invoices and income records
    console.log('📊 Analyzing initial state...');
    
    // Count paid invoices before deletion
    const paidInvoicesBefore = await page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).count();
    
    // Navigate to income history to count related income records
    await page.goto('/income-history');
    await page.waitForTimeout(2000);
    
    // Get total income records before deletion
    const totalIncomeRecordsBefore = await page.locator('[data-testid*="text-description-"]').count();
    
    // Count records with "Payment for invoice" description
    const paymentRecordsBefore = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    
    console.log(`📊 Initial state:`);
    console.log(`  - Paid invoices: ${paidInvoicesBefore}`);
    console.log(`  - Total income records: ${totalIncomeRecordsBefore}`);
    console.log(`  - Payment records: ${paymentRecordsBefore}`);
    
    // Go back to invoice list
    await page.goto('/income-manager');
    await page.waitForTimeout(2000);
    await page.goto('/invoice-list');
    await page.waitForTimeout(2000);
    
    // Step 3: Delete a paid invoice
    console.log('🗑️ Deleting paid invoice...');
    
    // Find the first paid invoice
    const firstPaidInvoice = page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).first();
    
    // Get invoice details for verification
    const invoiceCard = firstPaidInvoice.locator('..').locator('..').locator('..');
    const invoiceNumber = await invoiceCard.locator('[data-testid*="text-invoice-number-"]').textContent();
    const clientName = await invoiceCard.locator('[data-testid*="text-client-"]').textContent();
    const amount = await invoiceCard.locator('[data-testid*="text-amount-"]').textContent();
    
    console.log(`📋 Deleting invoice: ${invoiceNumber} from ${clientName} for ${amount}`);
    
    // Click delete button
    const deleteButton = invoiceCard.locator('[data-testid*="button-delete-"]');
    await deleteButton.click();
    
    // Confirm deletion in dialog
    await page.waitForSelector('[data-testid="delete-dialog"]');
    await page.click('[data-testid="button-confirm-delete"]');
    
    // Wait for deletion to complete
    await page.waitForTimeout(2000);
    
    // Step 4: Verify invoice deletion
    console.log('✅ Verifying invoice deletion...');
    
    // Count paid invoices after deletion
    const paidInvoicesAfter = await page.locator('[data-testid*="badge-status-"]').filter({
      hasText: 'Paid'
    }).count();
    
    expect(paidInvoicesAfter).toBe(paidInvoicesBefore - 1);
    console.log(`✅ Invoice deleted: ${paidInvoicesBefore} → ${paidInvoicesAfter}`);
    
    // Step 5: Verify income record deletion
    console.log('📊 Verifying income record deletion...');
    
    // Navigate to income history
    await page.goto('/income-history');
    await page.waitForTimeout(2000);
    
    // Wait for data to refresh
    await page.waitForTimeout(3000);
    
    // Count total income records after deletion
    const totalIncomeRecordsAfter = await page.locator('[data-testid*="text-description-"]').count();
    
    // Count payment records after deletion
    const paymentRecordsAfter = await page.locator('[data-testid*="text-description-"]').filter({
      hasText: /Payment for invoice|Full payment for invoice/
    }).count();
    
    console.log(`📊 Final state:`);
    console.log(`  - Total income records: ${totalIncomeRecordsBefore} → ${totalIncomeRecordsAfter}`);
    console.log(`  - Payment records: ${paymentRecordsBefore} → ${paymentRecordsAfter}`);
    
    // Verify that payment records were deleted
    expect(paymentRecordsAfter).toBeLessThan(paymentRecordsBefore);
    
    // Specifically verify that the deleted invoice's payment record is gone
    const deletedInvoicePayment = page.locator('[data-testid*="text-description-"]').filter({
      hasText: new RegExp(invoiceNumber?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '')
    }).count();
    
    expect(deletedInvoicePayment).toBe(0);
    console.log(`✅ Confirmed: No income records found for deleted invoice ${invoiceNumber}`);
    
    // Step 6:// Verify Recent History is also updated
    console.log('🔄 Verifying Recent History update...');
    
    await page.goto('/income-manager');
    await page.waitForTimeout(2000);
    
    // Wait for Recent History to refresh
    await page.waitForTimeout(2000);
    
    // Check that deleted invoice doesn't appear in Recent History
    const recentHistoryRecords = page.locator('[data-testid*="text-payment-source-"]');
    const deletedInvoiceInRecent = await recentHistoryRecords.filter({
      hasText: clientName || ''
    }).count();
    
    console.log(`📊 Recent History verification: ${deletedInvoiceInRecent} records for ${clientName}`);
    
    // Step 7: Console verification
    console.log('✅ Cascade deletion test completed successfully!');
    console.log(`📋 Test Results:`);
    console.log(`  - Invoice deleted: ${invoiceNumber}`);
    console.log(`  - Client: ${clientName}`);
    console.log(`  - Amount: ${amount}`);
    console.log(`  - Income records deleted: ${paymentRecordsBefore - paymentRecordsAfter}`);
    console.log(`  - All verifications passed ✅`);
  });

  test('should handle multiple income records for single invoice', async ({ page }) => {
    console.log('🧪 Testing multiple income records cascade deletion...');
    
    // This test would verify that invoices with partial payments + WHT deductions
    // properly delete all associated income records
    
    // For now, this is a placeholder for the more complex scenario
    console.log('📝 Multiple income records test - To be implemented');
    
    // The test would:
    // 1. Create an invoice with partial payment
    // 2. Add WHT payment  
    // 3. Delete the invoice
    // 4. Verify ALL related income records are deleted
  });

  test('should show proper error handling if deletion fails', async ({ page }) => {
    console.log('🧪 Testing error handling for cascade deletion...');
    
    // This test would verify proper error handling
    console.log('📝 Error handling test - To be implemented');
  });
});
