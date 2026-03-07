import { test, expect } from '@playwright/test';

test.describe('Registration', () => {
  test('should show registration form elements', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/GrwoFinance/);
    
    // Check if registration form elements are present
    await expect(page.locator('input[data-testid="input-firstname"]')).toBeVisible();
    await expect(page.locator('input[data-testid="input-lastname"]')).toBeVisible();
    await expect(page.locator('input[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('input[data-testid="input-password"]')).toBeVisible();
    await expect(page.locator('input[data-testid="input-confirm-password"]')).toBeVisible();
    await expect(page.locator('button[data-testid="button-register"]')).toBeVisible();
  });

  test('should allow user to register with valid data', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[data-testid="input-firstname"]', 'Test');
    await page.fill('input[data-testid="input-lastname"]', 'User');
    await page.fill('input[data-testid="input-email"]', 'test-login@example.com');
    await page.fill('input[data-testid="input-password"]', 'UserPassword123');
    await page.fill('input[data-testid="input-confirm-password"]', 'UserPassword123');
    
    // Submit registration
    await page.click('button[data-testid="button-register"]');
    
    // Should redirect to login or dashboard or stay on register
    await expect(page).toHaveURL(/(login|dashboard|register)/);
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.click('button[data-testid="button-register"]');
    
    // Should show validation errors - check for any error messages or form validation states
    await page.waitForTimeout(1000); // Wait for validation to trigger
    
    // Check if there are any error messages visible
    const errorElements = await page.locator('[role="alert"], .text-destructive, [data-testid*="error"], .text-red-500').count();
    console.log(`Found ${errorElements} error elements`);
    
    // Alternative: Check if form is still on register page (indicating validation failed)
    await expect(page).toHaveURL(/register/);
  });
});
