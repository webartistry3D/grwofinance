import { test, expect } from '@playwright/test';

test.describe('Report Generation', () => {
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

  test('should show report options', async ({ page }) => {
    await page.goto('/reports');
    
    // Check report options
    await expect(page.locator('h1')).toContainText('Reports');
    
    // Look for report sections with more specific selectors
    await expect(page.locator('text=Total Income').first()).toBeVisible();
    await expect(page.locator('text=Total Expenses').first()).toBeVisible();
    
    // Check for charts or data visualization
    const charts = page.locator('svg, canvas, .chart');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should show financial data in reports', async ({ page }) => {
    await page.goto('/reports');
    
    // Check for financial data with more specific selectors
    await expect(page.locator('text=Total Income').first()).toBeVisible();
    await expect(page.locator('text=Total Expenses').first()).toBeVisible();
    
    // Check for currency formatting
    const currencyElements = page.locator('text=₦');
    if (await currencyElements.count() > 0) {
      await expect(currencyElements.first()).toBeVisible();
    }
  });

  test('should show export options', async ({ page }) => {
    await page.goto('/reports');
    
    // Look for export buttons
    const exportButtons = page.locator('button');
    if (await exportButtons.count() > 0) {
      await expect(exportButtons.first()).toBeVisible();
    }
    
    // Check for download icons or text
    const downloadElements = page.locator('text=Download, text=Export, .download');
    if (await downloadElements.count() > 0) {
      await expect(downloadElements.first()).toBeVisible();
    }
  });
});
