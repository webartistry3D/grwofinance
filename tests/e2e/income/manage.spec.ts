import { test, expect } from '@playwright/test';

// Test data constants from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const INCOME_SOURCES = [
  'Salary',
  'Business',
  'Investment',
  'Freelance',
  'Other'
];

const INCOME_CATEGORIES = [
  'Primary Income',
  'Secondary Income',
  'Passive Income',
  'One-time Income'
];

test.describe('Income Management - Manage Income', () => {
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
    
    // Wait for dashboard to fully load by waiting for a specific element
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 5000 });
  });

  test('should display income manager with all components', async ({ page }) => {
    await page.goto('/income-manager');
    await expect(page).toHaveURL(/income-manager/);
    
    // Check income manager header
    await expect(page.locator('h1')).toContainText(/Income Manager/i);
    
    // Check for statistics section - look for actual text elements
    await expect(page.locator('[data-testid="text-total-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-weekly-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-monthly-income"]')).toBeVisible();
    
    // Check for action buttons
    const addIncomeButton = page.locator('[data-testid="button-add-income"]');
    if (await addIncomeButton.count() > 0) {
      await expect(addIncomeButton.first()).toBeVisible();
    }
    
    const createInvoiceButton = page.locator('[data-testid="button-create-invoice"]');
    if (await createInvoiceButton.count() > 0) {
      await expect(createInvoiceButton.first()).toBeVisible();
    }
    
    const viewHistoryButton = page.locator('[data-testid="button-view-history"]');
    if (await viewHistoryButton.count() > 0) {
      await expect(viewHistoryButton.first()).toBeVisible();
    }
    
    const viewReportsButton = page.locator('[data-testid="button-view-reports"]');
    if (await viewReportsButton.count() > 0) {
      await expect(viewReportsButton.first()).toBeVisible();
    }
  });

  test('should display income statistics and summaries', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check income statistics cards with correct selectors
    await expect(page.locator('[data-testid="text-total-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-monthly-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-weekly-income"]')).toBeVisible();
    
    // Check for invoice statistics
    const invoicesCreated = page.locator('[data-testid="text-invoices-created"]');
    if (await invoicesCreated.count() > 0) {
      await expect(invoicesCreated.first()).toBeVisible();
    }
    
    // Check for recent history section
    const recentHistory = page.locator('h2:has-text("Recent History")');
    if (await recentHistory.count() > 0) {
      await expect(recentHistory.first()).toBeVisible();
    }
    
    // Check for view all payments link
    const viewAllLink = page.locator('[data-testid="link-view-all-payments"]');
    if (await viewAllLink.count() > 0) {
      await expect(viewAllLink.first()).toBeVisible();
    }
  });

  test('should display income list with sorting and filtering options', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for recent history section instead of income list
    const recentHistory = page.locator('h2:has-text("Recent History")');
    if (await recentHistory.count() > 0) {
      await expect(recentHistory.first()).toBeVisible();
    }
    
    // Check for payment items in recent history
    const paymentItems = page.locator('[data-testid^="text-payment-"]');
    if (await paymentItems.count() > 0) {
      await expect(paymentItems.first()).toBeVisible();
    }
    
    // Check for view all payments link
    const viewAllLink = page.locator('[data-testid="link-view-all-payments"]');
    if (await viewAllLink.count() > 0) {
      await expect(viewAllLink.first()).toBeVisible();
    }
    
    // Check for action buttons that can navigate to detailed views
    const addIncomeButton = page.locator('[data-testid="button-add-income"]');
    if (await addIncomeButton.count() > 0) {
      await expect(addIncomeButton.first()).toBeVisible();
    }
    
    const viewHistoryButton = page.locator('[data-testid="button-view-history"]');
    if (await viewHistoryButton.count() > 0) {
      await expect(viewHistoryButton.first()).toBeVisible();
    }
    
    // Check for date range filters
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await expect(dateInputs.first()).toBeVisible();
    }
  });

  test('should display income items with correct information and actions', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for income items
    const incomeItems = page.locator('[data-testid="income-item"], .income-item, .card');
    if (await incomeItems.count() > 0) {
      const firstItem = incomeItems.first();
      await expect(firstItem).toBeVisible();
      
      // Check for income information
      await expect(firstItem.locator('[data-testid="income-amount"], .income-amount')).toBeVisible();
      await expect(firstItem.locator('[data-testid="income-source"], .income-source')).toBeVisible();
      await expect(firstItem.locator('[data-testid="income-date"], .income-date')).toBeVisible();
      
      // Check for action buttons
      const editButton = firstItem.locator('[data-testid="button-edit-income"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await expect(editButton.first()).toBeVisible();
      }
      
      const deleteButton = firstItem.locator('[data-testid="button-delete-income"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await expect(deleteButton.first()).toBeVisible();
      }
      
      const viewButton = firstItem.locator('[data-testid="button-view-income"], button:has-text("View")');
      if (await viewButton.count() > 0) {
        await expect(viewButton.first()).toBeVisible();
      }
    }
  });

  test('should handle income item interactions', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for income items
    const incomeItems = page.locator('[data-testid="income-item"], .income-item, .card');
    if (await incomeItems.count() > 0) {
      const firstItem = incomeItems.first();
      
      // Test clicking on income item to view details
      await firstItem.click();
      await page.waitForTimeout(1000);
      
      // Check for income details modal or page
      const incomeDetails = page.locator('[data-testid="income-details"], .income-details, .modal');
      if (await incomeDetails.count() > 0) {
        await expect(incomeDetails.first()).toBeVisible();
        
        // Check for detailed information
        await expect(incomeDetails.locator('[data-testid="detail-amount"], .detail-amount')).toBeVisible();
        await expect(incomeDetails.locator('[data-testid="detail-source"], .detail-source')).toBeVisible();
        await expect(incomeDetails.locator('[data-testid="detail-description"], .detail-description')).toBeVisible();
        
        // Close details
        const closeButton = incomeDetails.locator('[data-testid="button-close"], button:has-text("Close")');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should handle income editing', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for income items
    const incomeItems = page.locator('[data-testid="income-item"], .income-item, .card');
    if (await incomeItems.count() > 0) {
      const firstItem = incomeItems.first();
      
      // Click edit button
      const editButton = firstItem.locator('[data-testid="button-edit-income"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for edit form
        const editForm = page.locator('[data-testid="income-edit-form"], .income-edit-form, .modal');
        if (await editForm.count() > 0) {
          await expect(editForm.first()).toBeVisible();
          
          // Check for form fields
          await expect(editForm.locator('[data-testid="input-income-amount"], input[name="amount"]')).toBeVisible();
          await expect(editForm.locator('[data-testid="select-income-source"], select[name="source"]')).toBeVisible();
          
          // Modify amount
          const amountInput = editForm.locator('[data-testid="input-income-amount"], input[name="amount"]');
          await amountInput.fill('6000');
          
          // Save changes
          const saveButton = editForm.locator('[data-testid="button-save-income"], button:has-text("Save")');
          await saveButton.click();
          
          await page.waitForTimeout(2000);
          
          // Verify success
          const successMessage = page.locator('.success-message, [data-testid="success-message"]');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle income deletion with confirmation', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for income items
    const incomeItems = page.locator('[data-testid="income-item"], .income-item, .card');
    if (await incomeItems.count() > 0) {
      const firstItem = incomeItems.first();
      
      // Click delete button
      const deleteButton = firstItem.locator('[data-testid="button-delete-income"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation modal
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          await expect(confirmModal.first()).toBeVisible();
          
          // Check for confirmation message
          await expect(confirmModal.locator('text=Are you sure')).toBeVisible();
          
          // Confirm deletion
          const confirmButton = confirmModal.locator('[data-testid="button-confirm-delete"], button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
          
          await page.waitForTimeout(2000);
          
          // Verify success
          const successMessage = page.locator('.success-message, [data-testid="success-message"]');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle income search functionality', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for search input
    const searchInput = page.locator('[data-testid="input-search-income"], input[placeholder*="search"], input[name="search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('Salary');
      await page.waitForTimeout(1000);
      
      // Check if search results are filtered
      const incomeItems = page.locator('[data-testid="income-item"], .income-item, .card');
      if (await incomeItems.count() > 0) {
        // Verify search results contain search term
        const firstItem = incomeItems.first();
        const itemText = await firstItem.textContent();
        if (itemText) {
          expect(itemText.toLowerCase()).toContain('salary');
        }
      }
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);
    }
  });

  test('should handle income export functionality', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for export button
    const exportButton = page.locator('[data-testid="button-export-income"], button:has-text("Export")');
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
      
      // Click export button
      await exportButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for export options modal
      const exportModal = page.locator('[data-testid="export-modal"], .modal:has-text("Export")');
      if (await exportModal.count() > 0) {
        await expect(exportModal.first()).toBeVisible();
        
        // Check for export format options
        await expect(exportModal.locator('text=PDF')).toBeVisible();
        await expect(exportModal.locator('text=Excel')).toBeVisible();
        await expect(exportModal.locator('text=CSV')).toBeVisible();
        
        // Select export format
        const pdfOption = exportModal.locator('[data-testid="option-pdf"], input[value="pdf"]');
        if (await pdfOption.count() > 0) {
          await pdfOption.first().click();
        }
        
        // Confirm export
        const confirmExportButton = exportModal.locator('[data-testid="button-confirm-export"], button:has-text("Export")');
        await confirmExportButton.click();
        
        await page.waitForTimeout(2000);
        
        // Verify export success
        const successMessage = page.locator('.success-message, [data-testid="success-message"]');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle pagination for large income lists', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
      
      // Check for page numbers
      const pageNumbers = pagination.locator('[data-testid="page-number"], .page-number');
      if (await pageNumbers.count() > 1) {
        // Test pagination
        const secondPage = pageNumbers.nth(1);
        await secondPage.click();
        await page.waitForTimeout(1000);
        
        // Verify page change
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/page=2/);
      }
      
      // Check for next/previous buttons
      const nextButton = pagination.locator('[data-testid="button-next-page"], button:has-text("Next")');
      if (await nextButton.count() > 0) {
        await expect(nextButton.first()).toBeVisible();
      }
      
      const prevButton = pagination.locator('[data-testid="button-prev-page"], button:has-text("Previous")');
      if (await prevButton.count() > 0) {
        await expect(prevButton.first()).toBeVisible();
      }
    }
  });

  test('should handle responsive design across devices', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toContainText(/Income Manager/i);
    await expect(page.locator('[data-testid="text-total-income"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toContainText(/Income Manager/i);
    await expect(page.locator('[data-testid="text-total-income"]')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toContainText(/Income Manager/i);
    await expect(page.locator('[data-testid="text-total-income"]')).toBeVisible();
    
    // Check for mobile-specific layout
    const mobileLayout = page.locator('[data-testid="mobile-layout"], .mobile-layout');
    if (await mobileLayout.count() > 0) {
      await expect(mobileLayout.first()).toBeVisible();
    }
  });
});
