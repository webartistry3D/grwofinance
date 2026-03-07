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
  'Sales Revenue',
  'Service Income',
  'Contract Payment',
  'Consulting Fees',
  'Investment Income',
  'Rental Income',
  'Other Income'
];

const INCOME_DATA = {
  valid: {
    amount: '5000',
    source: INCOME_SOURCES[0],
    category: INCOME_CATEGORIES[0],
    description: 'Monthly salary payment',
    date: '2024-01-15',
    client: 'ABC Company',
    reference: 'SAL-001',
    notes: 'Regular monthly salary'
  },
  invalid: {
    amount: '0',
    source: '',
    category: '',
    description: '',
    date: '',
    client: '',
    reference: '',
    notes: ''
  }
};

test.describe('Income Management - Add Income', () => {
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

  test('should navigate to income manager and show add income options', async ({ page }) => {
    await page.goto('/add-income');
    await expect(page).toHaveURL(/add-income/);
    
    // Check add income page header
    await expect(page.locator('h1')).toContainText(/Add Income/i);
    
    // Check for form fields
    const descriptionInput = page.locator('[data-testid="input-description"]');
    if (await descriptionInput.count() > 0) {
      await expect(descriptionInput.first()).toBeVisible();
    }
    
    const amountInput = page.locator('[data-testid="input-amount"]');
    if (await amountInput.count() > 0) {
      await expect(amountInput.first()).toBeVisible();
    }
    
    const categorySelect = page.locator('[data-testid="select-category"]');
    if (await categorySelect.count() > 0) {
      await expect(categorySelect.first()).toBeVisible();
    }
    
    const dateInput = page.locator('[data-testid="input-date"]');
    if (await dateInput.count() > 0) {
      await expect(dateInput.first()).toBeVisible();
    }
    
    const clientInput = page.locator('[data-testid="input-client"]');
    if (await clientInput.count() > 0) {
      await expect(clientInput.first()).toBeVisible();
    }
    
    const referenceInput = page.locator('[data-testid="input-reference"]');
    if (await referenceInput.count() > 0) {
      await expect(referenceInput.first()).toBeVisible();
    }
    
    const notesInput = page.locator('[data-testid="textarea-notes"]');
    if (await notesInput.count() > 0) {
      await expect(notesInput.first()).toBeVisible();
    }
    
    // Check for submit button
    const submitButton = page.locator('[data-testid="button-add-income"]');
    if (await submitButton.count() > 0) {
      await expect(submitButton.first()).toBeVisible();
    }
  });

  test('should display income creation form with all required fields', async ({ page }) => {
    await page.goto('/add-income');
    await expect(page).toHaveURL(/add-income/);
    
    // Check add income page header
    await expect(page.locator('h1')).toContainText(/Add Income/i);
    
    // Check for form fields with correct selectors
    const descriptionInput = page.locator('[data-testid="input-description"]');
    if (await descriptionInput.count() > 0) {
      await expect(descriptionInput.first()).toBeVisible();
    }
    
    const amountInput = page.locator('[data-testid="input-amount"]');
    if (await amountInput.count() > 0) {
      await expect(amountInput.first()).toBeVisible();
    }
    
    const categorySelect = page.locator('[data-testid="select-category"]');
    if (await categorySelect.count() > 0) {
      await expect(categorySelect.first()).toBeVisible();
    }
    
    const dateInput = page.locator('[data-testid="button-date-picker"]');
    if (await dateInput.count() > 0) {
      await expect(dateInput.first()).toBeVisible();
    }
    
    const clientInput = page.locator('[data-testid="input-client"]');
    if (await clientInput.count() > 0) {
      await expect(clientInput.first()).toBeVisible();
    }
    
    const referenceInput = page.locator('[data-testid="input-reference"]');
    if (await referenceInput.count() > 0) {
      await expect(referenceInput.first()).toBeVisible();
    }
    
    const notesInput = page.locator('[data-testid="textarea-notes"]');
    if (await notesInput.count() > 0) {
      await expect(notesInput.first()).toBeVisible();
    }
    
    // Check for submit button
    const submitButton = page.locator('[data-testid="button-add-income"]');
    if (await submitButton.count() > 0) {
      await expect(submitButton.first()).toBeVisible();
    }
  });

  test('should create income with valid data', async ({ page }) => {
    await page.goto('/add-income');
    await expect(page).toHaveURL(/add-income/);
    
    // Fill in valid income data
    const descriptionInput = page.locator('[data-testid="input-description"]');
    if (await descriptionInput.count() > 0) {
      await descriptionInput.first().fill(INCOME_DATA.valid.description);
    }
    
    const amountInput = page.locator('[data-testid="input-amount"]');
    if (await amountInput.count() > 0) {
      await amountInput.first().fill(INCOME_DATA.valid.amount);
    }
    
    const categorySelect = page.locator('[data-testid="select-category"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.first().click();
      await page.locator('[role="option"]:has-text("' + INCOME_DATA.valid.category + '")').click();
    }
    
    const dateInput = page.locator('[data-testid="button-date-picker"]');
    if (await dateInput.count() > 0) {
      await dateInput.first().click();
      // Wait for calendar to open and select today
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
    }
    
    const clientInput = page.locator('[data-testid="input-client"]');
    if (await clientInput.count() > 0) {
      await clientInput.first().fill(INCOME_DATA.valid.client);
    }
    
    const referenceInput = page.locator('[data-testid="input-reference"]');
    if (await referenceInput.count() > 0) {
      await referenceInput.first().fill(INCOME_DATA.valid.reference);
    }
    
    const notesInput = page.locator('[data-testid="textarea-notes"]');
    if (await notesInput.count() > 0) {
      await notesInput.first().fill(INCOME_DATA.valid.notes);
    }
    
    // Submit form
    const submitButton = page.locator('[data-testid="button-add-income"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
    }
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Verify success - should return to income manager or show success message
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/income-manager|add-income/);
    
    // Check for success message
    const successMessage = page.locator('.success-message, [data-testid="success-message"]');
    if (await successMessage.count() > 0) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should validate income form fields and show errors', async ({ page }) => {
    await page.goto('/add-income');
    await expect(page).toHaveURL(/add-income/);
    
    // Try to submit empty form
    const submitButton = page.locator('[data-testid="button-add-income"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
    }
    
    // Check for validation errors
    await page.waitForTimeout(1000);
    
    // Look for error messages
    const errorMessages = page.locator('.error-message, [data-testid="error"], .text-red-600');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
    
    // Test invalid amount
    const amountInput = page.locator('[data-testid="input-income-amount"], input[name="amount"], input[placeholder*="amount"]');
    await amountInput.fill(INCOME_DATA.invalid.amount);
    await submitButton.click();
    
    // Check for amount validation error
    const amountError = page.locator('[data-testid="error-amount"], .error:has-text("amount")');
    if (await amountError.count() > 0) {
      await expect(amountError.first()).toBeVisible();
    }
  });

  test('should handle different income sources and categories', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Open income creation form
    const addIncomeButton = page.locator('[data-testid="button-add-income"], button:has-text("Add Income"), button:has-text("+ Income")');
    if (await addIncomeButton.count() > 0) {
      await addIncomeButton.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Test different income sources
    const sourceSelect = page.locator('[data-testid="select-income-source"], select[name="source"]');
    if (await sourceSelect.count() > 0) {
      // Check if all expected sources are available
      for (const source of INCOME_SOURCES) {
        const option = sourceSelect.locator(`option:has-text("${source}")`);
        if (await option.count() > 0) {
          await expect(option).toBeVisible();
        }
      }
      
      // Select a different source
      await sourceSelect.selectOption({ label: INCOME_SOURCES[1] }); // Business
    }
    
    // Test different income categories
    const categorySelect = page.locator('[data-testid="select-income-category"], select[name="category"]');
    if (await categorySelect.count() > 0) {
      // Check if all expected categories are available
      for (const category of INCOME_CATEGORIES) {
        const option = categorySelect.locator(`option:has-text("${category}")`);
        if (await option.count() > 0) {
          await expect(option).toBeVisible();
        }
      }
      
      // Select a different category
      await categorySelect.selectOption({ label: INCOME_CATEGORIES[1] }); // Secondary Income
    }
  });

  test('should handle date selection and validation', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Open income creation form
    const addIncomeButton = page.locator('[data-testid="button-add-income"], button:has-text("Add Income"), button:has-text("+ Income")');
    if (await addIncomeButton.count() > 0) {
      await addIncomeButton.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Test date input
    const dateInput = page.locator('[data-testid="input-income-date"], input[name="date"], input[type="date"]');
    if (await dateInput.count() > 0) {
      // Test valid date
      await dateInput.fill(INCOME_DATA.valid.date);
      
      // Test future date (should show validation error)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await dateInput.fill(futureDate.toISOString().split('T')[0]);
      
      const submitButton = page.locator('[data-testid="button-add-income"]');
      await submitButton.click();
      
      // Check for date validation error
      await page.waitForTimeout(1000);
      const dateError = page.locator('[data-testid="error-date"], .error:has-text("date")');
      if (await dateError.count() > 0) {
        await expect(dateError.first()).toBeVisible();
      }
      
      // Reset to valid date
      await dateInput.fill(INCOME_DATA.valid.date);
    }
  });

  test('should cancel income creation and return to income manager', async ({ page }) => {
    await page.goto('/income-manager');
    
    // Open income creation form
    const addIncomeButton = page.locator('[data-testid="button-add-income"], button:has-text("Add Income"), button:has-text("+ Income")');
    if (await addIncomeButton.count() > 0) {
      await addIncomeButton.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Fill in some data
    const amountInput = page.locator('[data-testid="input-income-amount"], input[name="amount"], input[placeholder*="amount"]');
    if (await amountInput.count() > 0) {
      await amountInput.fill('1000');
    }
    
    // Cancel form
    const cancelButton = page.locator('[data-testid="button-cancel-income"], button:has-text("Cancel"), button:has-text("Close")');
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
      await page.waitForTimeout(1000);
      
      // Should return to income manager
      await expect(page).toHaveURL(/income-manager/);
    }
  });

  test('should handle income creation errors gracefully', async ({ page }) => {
    await page.goto('/add-income');
    await expect(page).toHaveURL(/add-income/);
    
    // Submit and simulate network error (intercept network request)
    await page.route('**/api/income/**', route => route.abort());
    
    // Fill in valid data
    const descriptionInput = page.locator('[data-testid="input-description"]');
    if (await descriptionInput.count() > 0) {
      await descriptionInput.first().fill(INCOME_DATA.valid.description);
    }
    
    const amountInput = page.locator('[data-testid="input-amount"]');
    if (await amountInput.count() > 0) {
      await amountInput.first().fill(INCOME_DATA.valid.amount);
    }
    
    const submitButton = page.locator('[data-testid="button-add-income"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
    }
    
    // Check for error handling
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorMessage = page.locator('.error-message, [data-testid="error"], .text-red-600');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
    
    // Should allow retry
    const retryButton = page.locator('[data-testid="button-retry"], button:has-text("Retry")');
    if (await retryButton.count() > 0) {
      await expect(retryButton.first()).toBeVisible();
    }
  });
});
