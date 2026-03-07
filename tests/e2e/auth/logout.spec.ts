import { test, expect } from '@playwright/test';

test.describe('Logout', () => {
  test('should allow user to logout', async ({ page }) => {
    // First register and login
    await page.goto('/register');
    await page.fill('input[data-testid="input-firstname"]', 'Test');
    await page.fill('input[data-testid="input-lastname"]', 'User');
    await page.fill('input[data-testid="input-email"]', 'test@example.com');
    await page.fill('input[data-testid="input-password"]', 'UserPassword123');
    await page.fill('input[data-testid="input-confirm-password"]', 'UserPassword123');
    await page.click('button[data-testid="button-register"]');
    
    // Wait for registration to complete and redirect
    await page.waitForTimeout(3000);
    
    // If still on register page, try login
    if (page.url().includes('register')) {
      await page.goto('/login');
      await page.fill('input[data-testid="input-email"]', 'test@example.com');
      await page.fill('input[data-testid="input-password"]', 'UserPassword123');
      await page.click('button[data-testid="button-login"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to settings to find logout
    await page.goto('/settings');
    
    // Click logout button and wait for modal
    await page.click('button[data-testid="button-sign-out"]');
    
    // Wait for confirmation modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    
    // Click the confirmation button (using text content within dialog footer)
    await page.click('[role="dialog"] button:has-text("Sign Out")');
    
    // Should redirect to login or landing page (both are valid for unauthenticated users)
    await page.waitForURL(/(login|landing)/, { timeout: 5000 });
    await expect(page).toHaveURL(/(login|landing)/);
  });

  test('should clear session on logout', async ({ page }) => {
    // First register and login
    await page.goto('/register');
    await page.fill('input[data-testid="input-firstname"]', 'Test');
    await page.fill('input[data-testid="input-lastname"]', 'User');
    await page.fill('input[data-testid="input-email"]', 'test2@example.com');
    await page.fill('input[data-testid="input-password"]', 'UserPassword123');
    await page.fill('input[data-testid="input-confirm-password"]', 'UserPassword123');
    await page.click('button[data-testid="button-register"]');
    
    // Wait for registration to complete and redirect
    await page.waitForTimeout(3000);
    
    // If still on register page, try login
    if (page.url().includes('register')) {
      await page.goto('/login');
      await page.fill('input[data-testid="input-email"]', 'test2@example.com');
      await page.fill('input[data-testid="input-password"]', 'UserPassword123');
      await page.click('button[data-testid="button-login"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to settings and logout
    await page.goto('/settings');
    
    // Click logout button and wait for modal
    await page.click('button[data-testid="button-sign-out"]');
    
    // Wait for confirmation modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    
    // Click the confirmation button (using text content within dialog footer)
    await page.click('[role="dialog"] button:has-text("Sign Out")');
    
    // Wait for redirect to login or landing page
    await page.waitForURL(/(login|landing)/, { timeout: 5000 });
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login or landing page
    await expect(page).toHaveURL(/(login|landing)/);
  });
});
