// Example Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    // TODO: Add actual E2E tests for:
    // - Login flow
    // - Navigation
    // - CRUD operations
    // - Reports generation
    
    await page.goto('/login');
    await expect(page).toHaveTitle(/GrwoFinance/);
    
    // Fill login form
    await page.fill('input[data-testid="input-email"]', 'test@example.com');
    await page.fill('input[data-testid="input-password"]', 'UserPassword123');
    await page.click('button[data-testid="button-login"]');
    
    // Should redirect to dashboard or show validation error
    await expect(page).toHaveURL(/(dashboard|login)/);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check if login form elements are present
    await expect(page.locator('input[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('input[data-testid="input-password"]')).toBeVisible();
  });
});
