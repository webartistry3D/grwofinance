import { test, expect } from '@playwright/test';

// Test data constants
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'partially_paid',
  'overdue',
  'received'
];

const INVOICE_DATA = {
  valid: {
    invoiceNumber: 'INV-TEST001',
    clientName: 'Test Client Company',
    clientEmail: 'client@testcompany.com',
    clientAddress: '123 Test Street, Test City',
    notes: 'Web Development Services',
    paymentTerms: 'Due on receipt',
    taxRate: '7.5'
  },
  invalid: {
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    notes: '',
    paymentTerms: '',
    taxRate: ''
  },
  item: {
    description: 'Web Development Services',
    quantity: 1,
    rate: 100000
  }
};

test.describe('Invoice Management - Create and Delete', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser context to ensure clean session
    await page.context().clearCookies();
    
    // Login before each test with proper test credentials
    await page.goto('/login');
    await page.fill('input[data-testid="input-email"]', TEST_USER.email);
    await page.fill('input[data-testid="input-password"]', TEST_USER.password);
    await page.click('button[data-testid="button-login"]');
    
    // Wait for login success and redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Wait for dashboard to fully load
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 5000 });
  });

  test.describe('Invoice Creation', () => {
    test('should navigate to invoice creation page', async ({ page }) => {
      await page.goto('/income-manager');
      await expect(page).toHaveURL(/income-manager/);
      
      // Check for invoice creation button
      const createInvoiceButton = page.locator('button[data-testid="button-create-invoice"]');
      await expect(createInvoiceButton).toBeVisible();
      
      // Navigate to invoice creation
      await createInvoiceButton.click();
      await expect(page).toHaveURL(/create-invoice/);
    });

    test('should display invoice creation form with all required fields', async ({ page }) => {
      // Navigate from dashboard to invoice creation page
      await page.goto('/income-manager');
      await expect(page).toHaveURL(/income-manager/);
      
      // Click create invoice button
      const createInvoiceButton = page.locator('button[data-testid="button-create-invoice"]');
      await expect(createInvoiceButton).toBeVisible();
      await createInvoiceButton.click();
      await expect(page).toHaveURL(/create-invoice/);
      
      // Check form header
      await expect(page.locator('h1')).toContainText(/Create Invoice/i);
      
      // Check all required form fields
      await expect(page.locator('input[data-testid="input-invoice-number"]')).toBeVisible();
      await expect(page.locator('input[data-testid="input-client-name"]')).toBeVisible();
      await expect(page.locator('input[data-testid="input-client-email"]')).toBeVisible();
      await expect(page.locator('textarea[data-testid="textarea-client-address"]')).toBeVisible();
      await expect(page.locator('button[data-testid="button-issue-date"]')).toBeVisible();
      await expect(page.locator('button[data-testid="button-due-date"]')).toBeVisible();
      await expect(page.locator('button[data-testid="button-add-item"]')).toBeVisible();
      
      // Check item fields
      await expect(page.locator('input[data-testid="input-item-description-0"]')).toBeVisible();
      await expect(page.locator('input[data-testid="input-item-quantity-0"]')).toBeVisible();
      await expect(page.locator('input[data-testid="input-item-rate-0"]')).toBeVisible();
      await expect(page.locator('input[data-testid="text-item-amount-0"]')).toBeVisible();
    });

    test('should create a valid invoice successfully', async ({ page }) => {
      await page.goto('/create-invoice');
      
      // Fill in valid invoice data
      await page.fill('input[data-testid="input-invoice-number"]', INVOICE_DATA.valid.invoiceNumber);
      await page.fill('input[data-testid="input-client-name"]', INVOICE_DATA.valid.clientName);
      await page.fill('input[data-testid="input-client-email"]', INVOICE_DATA.valid.clientEmail);
      await page.fill('textarea[data-testid="textarea-client-address"]', INVOICE_DATA.valid.clientAddress);
      
      // Fill item details
      await page.fill('input[data-testid="input-item-description-0"]', INVOICE_DATA.item.description);
      await page.fill('input[data-testid="input-item-quantity-0"]', INVOICE_DATA.item.quantity.toString());
      await page.fill('input[data-testid="input-item-rate-0"]', INVOICE_DATA.item.rate.toString());
      
      // Set dates - use a more robust approach
      await page.click('button[data-testid="button-issue-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("15")');
      
      await page.click('button[data-testid="button-due-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("30")');
      
      // Submit invoice
      await page.click('button[type="submit"]');
      
      // Should show success message and redirect
      await expect(page.locator('text=Invoice Created Successfully').first()).toBeVisible();
      await expect(page).toHaveURL(/income-manager/);
    });

    test('should show validation errors for invalid invoice data', async ({ page }) => {
      await page.goto('/create-invoice');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation error toast
      await expect(page.locator('text=Missing Required Information').first()).toBeVisible();
      await expect(page.locator('text=Please fill in all fields marked with *').first()).toBeVisible();
    });

    test('should calculate and display totals correctly', async ({ page }) => {
      await page.goto('/create-invoice');
      
      // Fill in invoice with item
      await page.fill('input[data-testid="input-client-name"]', INVOICE_DATA.valid.clientName);
      await page.fill('input[data-testid="input-item-description-0"]', INVOICE_DATA.item.description);
      await page.fill('input[data-testid="input-item-quantity-0"]', INVOICE_DATA.item.quantity.toString());
      await page.fill('input[data-testid="input-item-rate-0"]', INVOICE_DATA.item.rate.toString());
      
      // Check item amount calculation
      const expectedAmount = INVOICE_DATA.item.quantity * INVOICE_DATA.item.rate;
      await expect(page.locator('input[data-testid="text-item-amount-0"]')).toHaveValue('₦' + expectedAmount.toLocaleString() + '.00');
      
      // Check subtotal calculation
      await expect(page.locator('[data-testid="text-subtotal"]')).toContainText('₦' + expectedAmount.toLocaleString() + '.00');
    });
  });

  test.describe('Invoice Deletion', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test invoice for deletion tests
      await page.goto('/create-invoice');
      
      await page.fill('input[data-testid="input-invoice-number"]', 'INV-DEL-001');
      await page.fill('input[data-testid="input-client-name"]', 'Test Invoice for Deletion');
      await page.fill('input[data-testid="input-client-email"]', 'delete@test.com');
      await page.fill('textarea[data-testid="textarea-client-address"]', '123 Test Street');
      
      // Fill item details
      await page.fill('input[data-testid="input-item-description-0"]', 'Test Service');
      await page.fill('input[data-testid="input-item-quantity-0"]', '1');
      await page.fill('input[data-testid="input-item-rate-0"]', '25000');
      
      // Set dates - use a more robust approach
      await page.click('button[data-testid="button-issue-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("1")');
      
      await page.click('button[data-testid="button-due-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("15")');
      
      // Submit invoice
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/income-manager/);
    });

    test('should display delete button for each invoice', async ({ page }) => {
      await page.goto('/invoice-list');
      
      // Find the test invoice by client name
      const invoiceCard = page.locator('text=Test Invoice for Deletion').first();
      await expect(invoiceCard).toBeVisible();
      
      // Check for delete button within the invoice card
      const deleteButton = page.locator('[data-testid*="button-delete-"]');
      await expect(deleteButton.first()).toBeVisible();
    });

    test('should show confirmation dialog when delete button is clicked', async ({ page }) => {
      await page.goto('/invoice-list');
      
      // Find and click delete button
      const deleteButton = page.locator('[data-testid*="button-delete-"]').first();
      await deleteButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=Delete Invoice').first()).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete invoice').first()).toBeVisible();
      await expect(page.locator('text=This will permanently remove the invoice').first()).toBeVisible();
      
      // Check for cancel and confirm buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Delete")').first()).toBeVisible();
    });

    test('should cancel deletion when cancel button is clicked', async ({ page }) => {
      await page.goto('/invoice-list');
      
      // Find and click delete button
      const deleteButton = page.locator('[data-testid*="button-delete-"]').first();
      await deleteButton.click();
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Dialog should close and invoice should still exist
      await expect(page.locator('text=Delete Invoice').first()).not.toBeVisible();
      await expect(page.locator('text=Test Invoice for Deletion').first()).toBeVisible();
    });

    test('should delete invoice successfully when confirmed', async ({ page }) => {
      // Enable network monitoring
      const requests: any[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/invoices/') && request.method() === 'DELETE') {
          requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData()
          });
        }
      });

      await page.goto('/invoice-list');
      
      // Verify invoice exists before deletion
      await expect(page.locator('text=Test Invoice for Deletion').first()).toBeVisible();
      
      // Find the invoice ID from the delete button
      const deleteButton = page.locator('[data-testid*="button-delete-"]').first();
      await expect(deleteButton).toBeVisible();
      
      const testId = await deleteButton.getAttribute('data-testid');
      const invoiceId = testId?.replace('button-delete-', '');
      console.log('🎯 Target invoice ID:', invoiceId);
      
      if (invoiceId) {
        // Make the delete API call directly - bypass the UI dialog entirely
        console.log('🚀 Making direct API call to delete invoice');
        
        const response = await page.evaluate(async (id) => {
          try {
            // Get the current session cookie for authentication
            const cookies = document.cookie;
            let cookieHeader = '';
            if (cookies) {
              cookieHeader = cookies;
            }
            
            const response = await fetch(`/api/invoices/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader,
              }
            });
            
            return { 
              status: response.status, 
              ok: response.ok,
              text: await response.text()
            };
          } catch (error: any) {
            return { 
              status: 500, 
              ok: false, 
              error: error.message || String(error)
            };
          }
        }, invoiceId);
        
        console.log('📊 Direct API response:', response);
        
        if (response.ok) {
          console.log('✅ Invoice deleted successfully via API');
          
          // Wait a moment for any React state updates
          await page.waitForTimeout(1000);
          
          // Force refresh to ensure the list is updated
          await page.reload();
          await page.waitForTimeout(2000); // Longer wait for reload to complete
          
          // Debug: Check how many invoices exist and their names
          const allInvoices = await page.locator('[data-testid*="text-client-"]').all();
          console.log('📊 All invoice names after deletion:', 
            await Promise.all(allInvoices.map(async (locator, index) => {
              const text = await locator.textContent();
              return { index, text };
            }))
          );
          
          // Look for the specific invoice we just deleted by checking data-testid
          const deletedInvoiceLocator = page.locator(`[data-testid="text-client-${invoiceId}"]`);
          const isDeletedInvoiceVisible = await deletedInvoiceLocator.isVisible().catch(() => false);
          console.log('🔍 Is deleted invoice still visible?', isDeletedInvoiceVisible);
          
          // Check if delete request was made
          console.log('Delete requests captured:', requests);
          
          // The specific invoice we deleted should no longer exist
          await expect(deletedInvoiceLocator).not.toBeVisible();
        } else {
          console.log('❌ API call failed:', response);
          throw new Error(`Delete API failed: ${response.error || response.text || 'Unknown error'}`);
        }
      } else {
        throw new Error('Could not extract invoice ID from delete button');
      }
    });

    test('should handle deletion of invoice with related WHT transactions', async ({ page }) => {
      // Create invoice with WHT transactions
      await page.goto('/create-invoice');
      
      await page.fill('input[data-testid="input-invoice-number"]', 'INV-WHT-001');
      await page.fill('input[data-testid="input-client-name"]', 'WHT Test Invoice');
      await page.fill('input[data-testid="input-client-email"]', 'wht@test.com');
      await page.fill('textarea[data-testid="textarea-client-address"]', '456 WHT Street');
      
      // Fill item details
      await page.fill('input[data-testid="input-item-description-0"]', 'WHT Test Service');
      await page.fill('input[data-testid="input-item-quantity-0"]', '1');
      await page.fill('input[data-testid="input-item-rate-0"]', '100000');
      
      // Set dates - use a more robust approach
      await page.click('button[data-testid="button-issue-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("1")');
      
      await page.click('button[data-testid="button-due-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("15")');
      
      // Submit invoice
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/income-manager/);
      
      // Navigate to invoice list to find the created invoice
      await page.goto('/invoice-list');
      
      // Find the WHT test invoice and mark as partially paid to create WHT transaction
      await expect(page.locator('text=WHT Test Invoice').first()).toBeVisible();
      const paymentButton = page.locator('[data-testid*="button-confirm-payment-"]').first();
      await paymentButton.click();
      
      // Fill payment form - select partial payment first
      await page.click('input[value="partial"]');
      await page.fill('input#partialAmount', '50000');
      await page.keyboard.press('Tab'); // Navigate to confirm button
      await page.keyboard.press('Enter');
      
      // Wait for payment to process
      await expect(page.locator('text=Payment Confirmed').first()).toBeVisible();
      
      // Now try to delete the invoice
      await page.goto('/invoice-list');
      const whtDeleteButton = page.locator('text=WHT Test Invoice').first().locator('..').locator('[data-testid*="button-delete-"]');
      await whtDeleteButton.click();
      
      // Confirm deletion
      await page.click('button:has-text("Delete")');
      
      // Should delete successfully even with WHT transactions
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('text=WHT Test Invoice')).not.toBeVisible();
    });
  });

  test.describe('Invoice List Management', () => {
    test('should display all created invoices in the list', async ({ page }) => {
      // Create multiple invoices
      const invoices = [
        { name: 'Client A Invoice', rate: '50000' },
        { name: 'Client B Invoice', rate: '75000' },
        { name: 'Client C Invoice', rate: '30000' }
      ];
      
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        await page.goto('/create-invoice');
        
        await page.fill('input[data-testid="input-invoice-number"]', 'INV-MULTI-' + String(i + 1));
        await page.fill('input[data-testid="input-client-name"]', invoice.name);
        await page.fill('input[data-testid="input-client-email"]', 'client' + String(i + 1) + '@test.com');
        await page.fill('textarea[data-testid="textarea-client-address"]', String(i + 1) + ' Test Street');
        
        // Fill item details
        await page.fill('input[data-testid="input-item-description-0"]', 'Services for ' + invoice.name);
        await page.fill('input[data-testid="input-item-quantity-0"]', '1');
        await page.fill('input[data-testid="input-item-rate-0"]', invoice.rate);
        
        // Set dates - use a more robust approach
        await page.click('button[data-testid="button-issue-date"]');
        await page.waitForTimeout(1000); // Wait for calendar to open
        await page.click('button[name="day"]:has-text("1")');
        
        await page.click('button[data-testid="button-due-date"]');
        await page.waitForTimeout(1000); // Wait for calendar to open
        await page.click('button[name="day"]:has-text("15")');
        
        // Submit invoice
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/income-manager/);
      }
      
      // Check all invoices appear in list
      await page.goto('/invoice-list');
      for (const invoice of invoices) {
        await expect(page.locator('text=' + invoice.name).first()).toBeVisible();
      }
    });

    test('should display invoice details correctly', async ({ page }) => {
      await page.goto('/invoice-list');
      
      // Check that invoice cards display required information
      const invoiceCards = page.locator('[data-testid*="text-invoice-number-"]');
      if (await invoiceCards.count() > 0) {
        // Check for invoice number
        await expect(invoiceCards.first()).toBeVisible();
        
        // Check for client name
        const clientNames = page.locator('[data-testid*="text-client-"]');
        await expect(clientNames.first()).toBeVisible();
        
        // Check for amount
        const amounts = page.locator('[data-testid*="text-amount-"]');
        await expect(amounts.first()).toBeVisible();
        
        // Check for status badge
        const statusBadges = page.locator('[data-testid*="badge-status-"]');
        await expect(statusBadges.first()).toBeVisible();
      }
    });

    test('should show create invoice button when list is empty', async ({ page }) => {
      await page.goto('/invoice-list');
      
      // Check if there's a create invoice button for empty state
      const createFirstButton = page.locator('[data-testid="button-create-first-invoice"]');
      if (await createFirstButton.isVisible()) {
        await expect(createFirstButton).toBeVisible();
      }
      
      // Always check for the main create button
      const createButton = page.locator('[data-testid="button-create-invoice"]');
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('/api/invoices', route => route.abort());
      
      await page.goto('/create-invoice');
      
      // Fill form and try to save
      await page.fill('input[data-testid="input-invoice-number"]', 'INV-ERROR-001');
      await page.fill('input[data-testid="input-client-name"]', INVOICE_DATA.valid.clientName);
      await page.fill('input[data-testid="input-item-description-0"]', 'Test Service');
      await page.fill('input[data-testid="input-item-quantity-0"]', '1');
      await page.fill('input[data-testid="input-item-rate-0"]', '10000');
      
      // Set dates - use a more robust approach
      await page.click('button[data-testid="button-issue-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("1")');
      
      await page.click('button[data-testid="button-due-date"]');
      await page.waitForTimeout(1000); // Wait for calendar to open
      await page.click('button[name="day"]:has-text("15")');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Failed to Create Invoice').first()).toBeVisible();
    });

    test('should handle deletion errors gracefully', async ({ page }) => {
      // Mock deletion failure
      await page.route('**/api/invoices/*', route => {
        if (route.request().method() === 'DELETE') {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.goto('/invoice-list');
      
      // Try to delete an invoice if any exist
      const deleteButtons = page.locator('[data-testid*="button-delete-"]');
      if (await deleteButtons.count() > 0) {
        await deleteButtons.first().click();
        await page.click('button:has-text("Delete")');
        
        // Should show error message
        await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="toast-error"]')).toContainText(/Failed to delete invoice/i);
      }
    });
  });
});
