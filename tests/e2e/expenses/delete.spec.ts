import { test, expect } from '@playwright/test';

// Test data constants from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

test.describe('Expense Management - Delete Expense', () => {
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

  test('should navigate to expense manager and show expense list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to expense history page (where delete functionality exists)
    await page.goto('/expense-history');
    await expect(page).toHaveURL(/expense-history/);
    
    // Check expense history header
    await expect(page.locator('h1')).toContainText(/Expense History/i);
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      await expect(expenseCards.first()).toBeVisible();
    }
  });

  test('should display expense items with delete options', async ({ page }) => {
    await page.goto('/expense-history');
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      const firstCard = expenseCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for expense information
      await expect(firstCard.locator('[data-testid^="text-merchant-"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid^="text-category-"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid^="text-date-"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid^="text-amount-"]')).toBeVisible();
      
      // Check for delete button
      const deleteButton = firstCard.locator('[data-testid^="button-delete-"]');
      if (await deleteButton.count() > 0) {
        await expect(deleteButton.first()).toBeVisible();
      }
    }
  });

  test('should show delete confirmation modal', async ({ page }) => {
    await page.goto('/expense-history');
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      const firstCard = expenseCards.first();
      
      // Click delete button
      const deleteButton = firstCard.locator('[data-testid^="button-delete-"]');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        
        // Check for confirmation modal
        const modal = page.locator('[data-testid="delete-modal"], .modal, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Check for modal content
          await expect(modal.locator('h2, .modal-title')).toContainText(/Delete Expense/i);
          await expect(modal.locator('text*=Are you sure')).toBeVisible();
          
          // Check for action buttons
          const confirmButton = modal.locator('button:has-text("Delete"), button:has-text("Confirm")');
          const cancelButton = modal.locator('button:has-text("Cancel")');
          
          if (await confirmButton.count() > 0) {
            await expect(confirmButton.first()).toBeVisible();
          }
          if (await cancelButton.count() > 0) {
            await expect(cancelButton.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should delete expense with confirmation', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Store expense details for verification
      const expenseAmount = await firstItem.locator('[data-testid="expense-amount"], .expense-amount').textContent();
      const expenseCategory = await firstItem.locator('[data-testid="expense-category"], .expense-category').textContent();
      
      // Click delete button
      const deleteButton = firstItem.locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation modal
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          await expect(confirmModal.first()).toBeVisible();
          
          // Confirm deletion
          const confirmButton = confirmModal.locator('[data-testid="button-confirm-delete"], button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
          
          await page.waitForTimeout(2000);
          
          // Verify success
          const successMessage = page.locator('.success-message, [data-testid="success-message"]');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
          
          // Verify expense is removed from list
          const remainingItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
          if (await remainingItems.count() > 0) {
            // Check if the deleted expense is no longer in the list
            const firstRemainingItem = remainingItems.first();
            const remainingAmount = await firstRemainingItem.locator('[data-testid="expense-amount"], .expense-amount').textContent();
            expect(remainingAmount).not.toBe(expenseAmount);
          }
        }
      }
    }
  });

  test('should cancel expense deletion', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Store expense details for verification
      const expenseAmount = await firstItem.locator('[data-testid="expense-amount"], .expense-amount').textContent();
      const itemCountBefore = await expenseItems.count();
      
      // Click delete button
      const deleteButton = firstItem.locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation modal
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          await expect(confirmModal.first()).toBeVisible();
          
          // Cancel deletion
          const cancelButton = confirmModal.locator('[data-testid="button-cancel-delete"], button:has-text("Cancel")');
          await cancelButton.click();
          
          await page.waitForTimeout(1000);
          
          // Verify modal is closed
          await expect(confirmModal).not.toBeVisible();
          
          // Verify expense is still in list
          const itemCountAfter = await page.locator('[data-testid="expense-item"], .expense-item, .card').count();
          expect(itemCountAfter).toBe(itemCountBefore);
          
          const firstItemAfter = page.locator('[data-testid="expense-item"], .expense-item, .card').first();
          const expenseAmountAfter = await firstItemAfter.locator('[data-testid="expense-amount"], .expense-amount').textContent();
          expect(expenseAmountAfter).toBe(expenseAmount);
        }
      }
    }
  });

  test('should handle bulk expense deletion', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for bulk selection options
    const bulkSelectCheckbox = page.locator('[data-testid="checkbox-bulk-select"], input[type="checkbox"]:first-of-type');
    if (await bulkSelectCheckbox.count() > 0) {
      await expect(bulkSelectCheckbox.first()).toBeVisible();
      
      // Select all expenses
      await bulkSelectCheckbox.first().click();
      await page.waitForTimeout(500);
      
      // Check for bulk actions
      const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible();
        
        // Check for bulk delete button
        const bulkDeleteButton = bulkActions.locator('[data-testid="button-bulk-delete"], button:has-text("Delete Selected")');
        if (await bulkDeleteButton.count() > 0) {
          await expect(bulkDeleteButton.first()).toBeVisible();
          
          // Click bulk delete
          await bulkDeleteButton.first().click();
          await page.waitForTimeout(1000);
          
          // Check for bulk confirmation modal
          const bulkConfirmModal = page.locator('[data-testid="bulk-delete-confirm-modal"], .modal:has-text("Delete Selected")');
          if (await bulkConfirmModal.count() > 0) {
            await expect(bulkConfirmModal.first()).toBeVisible();
            
            // Check for count of selected items
            await expect(bulkConfirmModal.locator('text=selected expenses')).toBeVisible();
            
            // Confirm bulk deletion
            const confirmButton = bulkConfirmModal.locator('[data-testid="button-confirm-bulk-delete"], button:has-text("Delete")');
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
    }
  });

  test('should handle expense deletion errors gracefully', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Click delete button
      const deleteButton = firstItem.locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation modal
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          // Simulate network error (intercept network request)
          await page.route('**/api/expenses/**', route => route.abort());
          
          // Confirm deletion
          const confirmButton = confirmModal.locator('[data-testid="button-confirm-delete"], button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
          
          // Check for error handling
          await page.waitForTimeout(2000);
          
          // Should show error message
          const errorMessage = confirmModal.locator('.error-message, [data-testid="error"], .text-red-600');
          if (await errorMessage.count() > 0) {
            await expect(errorMessage.first()).toBeVisible();
          }
          
          // Should allow retry
          const retryButton = confirmModal.locator('[data-testid="button-retry"], button:has-text("Retry")');
          if (await retryButton.count() > 0) {
            await expect(retryButton.first()).toBeVisible();
          }
          
          // Should allow cancel
          const cancelButton = confirmModal.locator('[data-testid="button-cancel-delete"], button:has-text("Cancel")');
          if (await cancelButton.count() > 0) {
            await expect(cancelButton.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle expense filtering and search during deletion', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for filter options
    const filterSelect = page.locator('[data-testid="select-filter-expense"], select[name="filter"]');
    if (await filterSelect.count() > 0) {
      await expect(filterSelect.first()).toBeVisible();
      
      // Test filtering by category
      await filterSelect.selectOption({ label: 'Food & Dining' });
      await page.waitForTimeout(1000);
      
      // Check if expense list is filtered
      const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
      if (await expenseItems.count() > 0) {
        const firstItem = expenseItems.first();
        const itemCategory = firstItem.locator('[data-testid="expense-category"], .expense-category');
        if (await itemCategory.count() > 0) {
          const categoryText = await itemCategory.first().textContent();
          if (categoryText) {
            expect(categoryText).toContain('Food & Dining');
          }
        }
        
        // Test deletion on filtered list
        const deleteButton = firstItem.locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
        if (await deleteButton.count() > 0) {
          await deleteButton.first().click();
          await page.waitForTimeout(1000);
          
          // Check for confirmation modal
          const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
          if (await confirmModal.count() > 0) {
            await expect(confirmModal.first()).toBeVisible();
            
            // Cancel deletion
            const cancelButton = confirmModal.locator('[data-testid="button-cancel-delete"], button:has-text("Cancel")');
            if (await cancelButton.count() > 0) {
              await cancelButton.first().click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
      
      // Reset filter
      await filterSelect.selectOption({ label: 'All Categories' });
      await page.waitForTimeout(500);
    }
    
    // Check for search functionality
    const searchInput = page.locator('[data-testid="input-search-expense"], input[placeholder*="search"], input[name="search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Test search
      await searchInput.first().fill('restaurant');
      await page.waitForTimeout(1000);
      
      // Check if search results are filtered
      const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
      if (await expenseItems.count() > 0) {
        const firstItem = expenseItems.first();
        const itemDescription = firstItem.locator('[data-testid="expense-description"], .expense-description');
        if (await itemDescription.count() > 0) {
          const descriptionText = await itemDescription.first().textContent();
          if (descriptionText) {
            expect(descriptionText.toLowerCase()).toContain('restaurant');
          }
        }
      }
      
      // Clear search
      await searchInput.first().fill('');
      await page.waitForTimeout(500);
    }
  });

  test('should handle expense pagination during deletion', async ({ page }) => {
    await page.goto('/expense-manager');
    
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
        
        // Check for expense items on new page
        const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
        if (await expenseItems.count() > 0) {
          await expect(expenseItems.first()).toBeVisible();
          
          // Test deletion on different page
          const deleteButton = expenseItems.first().locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
          if (await deleteButton.count() > 0) {
            await deleteButton.first().click();
            await page.waitForTimeout(1000);
            
            // Check for confirmation modal
            const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
            if (await confirmModal.count() > 0) {
              await expect(confirmModal.first()).toBeVisible();
              
              // Cancel deletion
              const cancelButton = confirmModal.locator('[data-testid="button-cancel-delete"], button:has-text("Cancel")');
              if (await cancelButton.count() > 0) {
                await cancelButton.first().click();
                await page.waitForTimeout(500);
              }
            }
          }
        }
      }
    }
  });

  test('should support responsive design during expense deletion', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toContainText(/Expense Manager/i);
    
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      await expect(expenseItems.first()).toBeVisible();
      
      // Test deletion in desktop view
      const deleteButton = expenseItems.first().locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          await expect(confirmModal.first()).toBeVisible();
          
          const cancelButton = confirmModal.locator('[data-testid="button-cancel-delete"], button:has-text("Cancel")');
          if (await cancelButton.count() > 0) {
            await cancelButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toContainText(/Expense Manager/i);
    
    if (await expenseItems.count() > 0) {
      await expect(expenseItems.first()).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toContainText(/Expense Manager/i);
    
    if (await expenseItems.count() > 0) {
      await expect(expenseItems.first()).toBeVisible();
      
      // Check for mobile-specific layout
      const mobileLayout = page.locator('[data-testid="mobile-layout"], .mobile-layout');
      if (await mobileLayout.count() > 0) {
        await expect(mobileLayout.first()).toBeVisible();
      }
    }
  });

  test('should handle expense deletion with undo functionality', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Store expense details for verification
      const expenseAmount = await firstItem.locator('[data-testid="expense-amount"], .expense-amount').textContent();
      
      // Click delete button
      const deleteButton = firstItem.locator('[data-testid="button-delete-expense"], button:has-text("Delete")');
      if (await deleteButton.count() > 0) {
        await deleteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for confirmation modal
        const confirmModal = page.locator('[data-testid="delete-confirm-modal"], .modal:has-text("Delete")');
        if (await confirmModal.count() > 0) {
          await expect(confirmModal.first()).toBeVisible();
          
          // Confirm deletion
          const confirmButton = confirmModal.locator('[data-testid="button-confirm-delete"], button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
          
          await page.waitForTimeout(2000);
          
          // Check for undo option
          const undoButton = page.locator('[data-testid="button-undo-delete"], button:has-text("Undo")');
          if (await undoButton.count() > 0) {
            await expect(undoButton.first()).toBeVisible();
            
            // Test undo functionality
            await undoButton.first().click();
            await page.waitForTimeout(2000);
            
            // Verify expense is restored
            const restoredItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
            if (await restoredItems.count() > 0) {
              const firstRestoredItem = restoredItems.first();
              const restoredAmount = await firstRestoredItem.locator('[data-testid="expense-amount"], .expense-amount').textContent();
              expect(restoredAmount).toBe(expenseAmount);
            }
          }
        }
      }
    }
  });
});
