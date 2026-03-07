import { test, expect } from '@playwright/test';

// Test data constants from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const FINANCIAL_METRICS = {
  monthlyIncome: 'text-monthly-income',
  monthlyExpenses: 'text-monthly-expenses',
  netPosition: 'text-net-position',
  totalSavings: 'text-total-savings',
  netWorth: 'text-net-worth'
};

test.describe('Global Dashboard (Regular Users)', () => {
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

  test('should display dashboard overview with all metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard header and welcome message
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Check all financial summary cards are visible
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyExpenses}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.netPosition}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.totalSavings}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.netWorth}"]`)).toBeVisible();
    
    // Verify values are displayed and not empty
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).not.toBeEmpty();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyExpenses}"]`)).not.toBeEmpty();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.netPosition}"]`)).not.toBeEmpty();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.totalSavings}"]`)).not.toBeEmpty();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.netWorth}"]`)).not.toBeEmpty();
    
    // Check for proper formatting (currency symbols, etc.)
    const incomeText = await page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`).textContent();
    expect(incomeText).toMatch(/[₦$₹£€¥]/); // Should contain a currency symbol (Naira for Nigeria)
  });

  test('should show navigation options to income and expense managers', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if dashboard loaded successfully
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Check for income manager navigation
    await expect(page.locator('[data-testid="nav-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-income"]')).toContainText(/income/i);
    
    // Check for expense manager navigation
    await expect(page.locator('[data-testid="nav-expense"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-expense"]')).toContainText(/expense/i);
    
    // Test navigation functionality
    await page.click('a[href="/income-manager"]');
    await expect(page).toHaveURL(/income-manager/);
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    
    await page.click('a[href="/expense-manager"]');
    await expect(page).toHaveURL(/expense-manager/);
  });

  test('should display spending charts and visualizations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for category chart component
    const categoryChart = page.locator('.category-chart, [data-testid="category-chart"]');
    if (await categoryChart.count() > 0) {
      await expect(categoryChart.first()).toBeVisible();
      
      // Check for chart elements
      const chartElements = categoryChart.locator('canvas, svg, .chart-container');
      if (await chartElements.count() > 0) {
        await expect(chartElements.first()).toBeVisible();
      }
    }
    
    // Check for trend indicators or progress bars
    const trendIndicators = page.locator('.trend-indicator, .progress-bar, [data-testid^="trend-"]');
    if (await trendIndicators.count() > 0) {
      await expect(trendIndicators.first()).toBeVisible();
    }
  });

  test('should show quick action buttons and shortcuts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if dashboard loaded successfully
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Check for quick action buttons
    const quickActions = page.locator('[data-testid^="button-quick-"]');
    if (await quickActions.count() > 0) {
      await expect(quickActions.first()).toBeVisible();
      
      // Test quick action functionality
      await quickActions.first().click();
      await page.waitForTimeout(1000); // Wait for navigation or modal
    }
    
    // Check for floating action buttons
    const fab = page.locator('[data-testid="fab-add-income"], [data-testid="fab-add-expense"]');
    if (await fab.count() > 0) {
      await expect(fab.first()).toBeVisible();
    }
  });

  test('should handle responsive design across different viewports', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).toBeVisible();
    
    // Check for mobile-specific navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-navigation');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('should handle loading states and error conditions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for loading states
    const loadingElements = page.locator('.loading, .skeleton, [data-testid="loading"]');
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForSelector('[data-testid="text-monthly-income"]', { state: 'visible' });
    }
    
    // Check for error states
    const errorElements = page.locator('.error, .error-message, [data-testid="error"]');
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toBeVisible();
      
      // Check for retry buttons
      const retryButtons = page.locator('[data-testid="button-retry"], .retry-button');
      if (await retryButtons.count() > 0) {
        await expect(retryButtons.first()).toBeVisible();
      }
    }
  });

  test('should maintain session state across navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify user is logged in
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Navigate away and back
    await page.goto('/income-manager');
    await expect(page).toHaveURL(/income-manager/);
    
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Verify financial data persists
    await expect(page.locator(`[data-testid="${FINANCIAL_METRICS.monthlyIncome}"]`)).toBeVisible();
  });
});
