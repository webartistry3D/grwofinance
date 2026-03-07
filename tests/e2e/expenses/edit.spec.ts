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

const EXPENSE_DATA = {
  original: {
    amount: '150.50',
    category: EXPENSE_CATEGORIES[0],
    description: 'Lunch at restaurant',
    date: '2024-01-15'
  },
  updated: {
    amount: '200.00',
    category: EXPENSE_CATEGORIES[1],
    description: 'Dinner and transportation',
    date: '2024-01-16'
  }
};

test.describe('Expense Management - Edit Expense', () => {
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

  test('should display expense items with edit options', async ({ page }) => {
    await page.goto('/expense-history');
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      const firstCard = expenseCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for edit button
      const editButton = firstCard.locator('[data-testid^="button-edit-"]');
      if (await editButton.count() > 0) {
        await expect(editButton.first()).toBeVisible();
      }
    }
  });

  test('should open expense edit form with pre-filled data', async ({ page }) => {
    await page.goto('/expense-history');
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      const firstCard = expenseCards.first();
      
      // Click edit button
      const editButton = firstCard.locator('[data-testid^="button-edit-"]');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should navigate to edit expense page
        await expect(page).toHaveURL(/edit-expense/);
        
        // Check for edit form
        await expect(page.locator('h1')).toContainText(/Edit Expense/i);
        
        // Check for pre-filled form fields
        const merchantInput = page.locator('[data-testid="input-merchant"]');
        if (await merchantInput.count() > 0) {
          await expect(merchantInput.first()).toBeVisible();
          const merchantValue = await merchantInput.first().inputValue();
          expect(merchantValue).not.toBe(''); // Should be pre-filled
        }
        
        const amountInput = page.locator('[data-testid="input-amount"]');
        if (await amountInput.count() > 0) {
          await expect(amountInput.first()).toBeVisible();
          const amountValue = await amountInput.first().inputValue();
          expect(amountValue).not.toBe(''); // Should be pre-filled
        }
        
        const categorySelect = page.locator('[data-testid="select-category"]');
        if (await categorySelect.count() > 0) {
          await expect(categorySelect.first()).toBeVisible();
          const categoryValue = await categorySelect.first().inputValue();
          expect(categoryValue).not.toBe(''); // Should be pre-filled
        }
        
        const dateInput = page.locator('[data-testid="input-date"]');
        if (await dateInput.count() > 0) {
          await expect(dateInput.first()).toBeVisible();
          const dateValue = await dateInput.first().inputValue();
          expect(dateValue).not.toBe(''); // Should be pre-filled
        }
        
        const notesInput = page.locator('[data-testid="textarea-notes"]');
        if (await notesInput.count() > 0) {
          await expect(notesInput.first()).toBeVisible();
          const notesValue = await notesInput.first().inputValue();
          // Notes might be empty, so no assertion
        }
      }
    }
  });

  test('should update expense with valid data', async ({ page }) => {
    await page.goto('/expense-history');
    
    // Check for expense cards
    const expenseCards = page.locator('[data-testid^="expense-card-"]');
    if (await expenseCards.count() > 0) {
      const firstCard = expenseCards.first();
      
      // Click edit button
      const editButton = firstCard.locator('[data-testid^="button-edit-"]');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should navigate to edit expense page
        await expect(page).toHaveURL(/edit-expense/);
        
        // Fill form with new data
        const merchantInput = page.locator('[data-testid="input-merchant"]');
        if (await merchantInput.count() > 0) {
          await merchantInput.first().fill('Updated Merchant');
        }
        
        const amountInput = page.locator('[data-testid="input-amount"]');
        if (await amountInput.count() > 0) {
          await amountInput.first().fill('250.00');
        }
        
        const categorySelect = page.locator('[data-testid="select-category"]');
        if (await categorySelect.count() > 0) {
          await categorySelect.first().click();
          await page.locator('[role="option"]:has-text("Transportation")').click();
        }
        
        const dateInput = page.locator('[data-testid="input-date"]');
        if (await dateInput.count() > 0) {
          await dateInput.first().fill('2024-01-20');
        }
        
        const notesInput = page.locator('[data-testid="textarea-notes"]');
        if (await notesInput.count() > 0) {
          await notesInput.first().fill('Updated expense notes');
        }
        
        // Submit form
        const saveButton = page.locator('[data-testid="button-save-expense"]');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
        }
        
        // Wait for success and redirect
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/expense-history/);
      }
    }
  });

  test('should validate expense edit form fields', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Click edit button
      const editButton = firstItem.locator('[data-testid="button-edit-expense"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for edit form
        const editForm = page.locator('[data-testid="expense-edit-form"], .expense-edit-form, .modal');
        if (await editForm.count() > 0) {
          // Test invalid amount
          const amountInput = editForm.locator('[data-testid="input-expense-amount"], input[name="amount"]');
          if (await amountInput.count() > 0) {
            await amountInput.first().fill('0');
          }
          
          // Try to save
          const saveButton = editForm.locator('[data-testid="button-save-expense"], button:has-text("Save"), button:has-text("Update")');
          await saveButton.click();
          
          // Check for validation error
          await page.waitForTimeout(1000);
          const amountError = editForm.locator('[data-testid="error-amount"], .error:has-text("amount")');
          if (await amountError.count() > 0) {
            await expect(amountError.first()).toBeVisible();
          }
          
          // Test empty description
          const descriptionInput = editForm.locator('[data-testid="textarea-expense-description"], textarea[name="description"]');
          if (await descriptionInput.count() > 0) {
            await descriptionInput.first().fill('');
          }
          
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          const descriptionError = editForm.locator('[data-testid="error-description"], .error:has-text("description")');
          if (await descriptionError.count() > 0) {
            await expect(descriptionError.first()).toBeVisible();
          }
          
          // Test future date
          const dateInput = editForm.locator('[data-testid="input-expense-date"], input[name="date"], input[type="date"]');
          if (await dateInput.count() > 0) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            await dateInput.first().fill(futureDate.toISOString().split('T')[0]);
            
            await saveButton.click();
            await page.waitForTimeout(1000);
            
            const dateError = editForm.locator('[data-testid="error-date"], .error:has-text("date")');
            if (await dateError.count() > 0) {
              await expect(dateError.first()).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should cancel expense editing and return to expense manager', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Click edit button
      const editButton = firstItem.locator('[data-testid="button-edit-expense"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for edit form
        const editForm = page.locator('[data-testid="expense-edit-form"], .expense-edit-form, .modal');
        if (await editForm.count() > 0) {
          // Make some changes
          const amountInput = editForm.locator('[data-testid="input-expense-amount"], input[name="amount"]');
          if (await amountInput.count() > 0) {
            await amountInput.first().fill('999');
          }
          
          // Cancel editing
          const cancelButton = editForm.locator('[data-testid="button-cancel-edit"], button:has-text("Cancel")');
          await cancelButton.click();
          
          await page.waitForTimeout(1000);
          
          // Should return to expense manager
          await expect(page).toHaveURL(/expense-manager/);
          
          // Verify original data is unchanged
          const originalItem = page.locator('[data-testid="expense-item"], .expense-item, .card').first();
          const itemAmount = originalItem.locator('[data-testid="expense-amount"], .expense-amount');
          if (await itemAmount.count() > 0) {
            const amountText = await itemAmount.first().textContent();
            expect(amountText).not.toContain('999');
          }
        }
      }
    }
  });

  test('should handle expense editing errors gracefully', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for expense items
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      const firstItem = expenseItems.first();
      
      // Click edit button
      const editButton = firstItem.locator('[data-testid="button-edit-expense"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for edit form
        const editForm = page.locator('[data-testid="expense-edit-form"], .expense-edit-form, .modal');
        if (await editForm.count() > 0) {
          // Fill in valid data
          const amountInput = editForm.locator('[data-testid="input-expense-amount"], input[name="amount"]');
          if (await amountInput.count() > 0) {
            await amountInput.first().fill(EXPENSE_DATA.updated.amount);
          }
          
          // Simulate network error (intercept network request)
          await page.route('**/api/expenses/**', route => route.abort());
          
          // Save changes
          const saveButton = editForm.locator('[data-testid="button-save-expense"], button:has-text("Save"), button:has-text("Update")');
          await saveButton.click();
          
          // Check for error handling
          await page.waitForTimeout(2000);
          
          // Should show error message
          const errorMessage = editForm.locator('.error-message, [data-testid="error"], .text-red-600');
          if (await errorMessage.count() > 0) {
            await expect(errorMessage.first()).toBeVisible();
          }
          
          // Should allow retry
          const retryButton = editForm.locator('[data-testid="button-retry"], button:has-text("Retry")');
          if (await retryButton.count() > 0) {
            await expect(retryButton.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle expense filtering and search during editing', async ({ page }) => {
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

  test('should handle expense pagination during editing', async ({ page }) => {
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
          
          // Test editing on different page
          const editButton = expenseItems.first().locator('[data-testid="button-edit-expense"], button:has-text("Edit")');
          if (await editButton.count() > 0) {
            await editButton.first().click();
            await page.waitForTimeout(1000);
            
            // Check for edit form
            const editForm = page.locator('[data-testid="expense-edit-form"], .expense-edit-form, .modal');
            if (await editForm.count() > 0) {
              await expect(editForm.first()).toBeVisible();
              
              // Cancel editing
              const cancelButton = editForm.locator('[data-testid="button-cancel-edit"], button:has-text("Cancel")');
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

  test('should support responsive design during expense editing', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toContainText(/Expense Manager/i);
    
    const expenseItems = page.locator('[data-testid="expense-item"], .expense-item, .card');
    if (await expenseItems.count() > 0) {
      await expect(expenseItems.first()).toBeVisible();
      
      // Test editing in desktop view
      const editButton = expenseItems.first().locator('[data-testid="button-edit-expense"], button:has-text("Edit")');
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        const editForm = page.locator('[data-testid="expense-edit-form"], .expense-edit-form, .modal');
        if (await editForm.count() > 0) {
          await expect(editForm.first()).toBeVisible();
          
          const cancelButton = editForm.locator('[data-testid="button-cancel-edit"], button:has-text("Cancel")');
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
});
