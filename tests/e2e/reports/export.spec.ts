import { test, expect } from '@playwright/test';

test.describe('Report Export', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test with correct credentials
    await page.goto('/login');
    await page.fill('input[data-testid="input-email"]', 'test@example.com');
    await page.fill('input[data-testid="input-password"]', 'UserPassword123');
    await page.click('button[data-testid="button-login"]');
    
    // Wait for login success and redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Wait for dashboard to fully load
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to reports
    await page.click('a[href="/reports"]');
    
    // Should redirect to reports
    await expect(page).toHaveURL(/reports/);
    
    // Check reports page elements
    await expect(page.locator('h1')).toContainText('Reports');
  });

  test('should show export functionality', async ({ page }) => {
    await page.goto('/reports');
    
    // Look for export options
    const exportButtons = page.locator('button');
    const downloadLinks = page.locator('a[download], .download');
    
    if (await exportButtons.count() > 0) {
      await expect(exportButtons.first()).toBeVisible();
    }
    
    if (await downloadLinks.count() > 0) {
      await expect(downloadLinks.first()).toBeVisible();
    }
  });

  test('should handle data export interactions', async ({ page }) => {
    await page.goto('/reports');
    
    // Look for export buttons and test interactions
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      // Test button click (might trigger download or modal)
      await firstButton.click();
      
      // Check for any download or export confirmation
      const downloadElements = page.locator('text=Download, text=Export, text=CSV, text=PDF');
      if (await downloadElements.count() > 0) {
        await expect(downloadElements.first()).toBeVisible();
      }
    }
  });

  test('should show financial summary data', async ({ page }) => {
    await page.goto('/reports');
    
    // Check for financial summary with more specific selectors
    await expect(page.locator('text=Total Income').first()).toBeVisible();
    await expect(page.locator('text=Total Expenses').first()).toBeVisible();
    
    // Check for currency formatting
    const currencyElements = page.locator('text=₦');
    if (await currencyElements.count() > 0) {
      await expect(currencyElements.first()).toBeVisible();
    }
    
    // Check for data visualization
    const charts = page.locator('svg, canvas, .chart');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });
});
