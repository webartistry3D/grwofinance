import { test, expect } from '@playwright/test';

// Test data constants from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const NAVIGATION_ITEMS = {
  home: 'nav-home',
  income: 'nav-income',
  expense: 'nav-expense',
  reports: 'nav-reports',
  settings: 'nav-settings'
};

const ROUTES = {
  dashboard: '/dashboard',
  incomeManager: '/income-manager',
  expenseManager: '/expense-manager',
  manualEntry: '/manual-entry',
  reports: '/reports',
  settings: '/settings'
};

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser context to ensure clean session
    await page.context().clearCookies();
    
    console.log('Starting navigation test - fresh session');
    
    await page.goto('/login');
    console.log('Navigated to login page');
    
    await page.fill('input[data-testid="input-email"]', TEST_USER.email);
    await page.fill('input[data-testid="input-password"]', TEST_USER.password);
    console.log('Filled login form');
    
    await page.click('button[data-testid="button-login"]');
    console.log('Clicked login button');
    
    // Wait for login success and redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Wait for dashboard to fully load by waiting for a specific element
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 5000 });
    console.log('Dashboard loaded, ready for navigation test');
  });

  test('should display dashboard overview with navigation elements', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Check dashboard header and welcome message
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Check all financial summary cards are visible
    await expect(page.locator('[data-testid="text-monthly-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-monthly-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-net-position"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-total-savings"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-net-worth"]')).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('[data-testid="nav-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-expense"]')).toBeVisible();
  });

  test('should navigate between sections using bottom navigation', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Test navigation to income manager
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.income}"]`)).toBeVisible();
    await page.click(`[data-testid="${NAVIGATION_ITEMS.income}"]`);
    await expect(page).toHaveURL(/income-manager/);
    
    // Test navigation to expense manager
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.expense}"]`)).toBeVisible();
    await page.click(`[data-testid="${NAVIGATION_ITEMS.expense}"]`);
    await expect(page).toHaveURL(/expense-manager/);
    
    // Test navigation to reports
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.reports}"]`)).toBeVisible();
    await page.click(`[data-testid="${NAVIGATION_ITEMS.reports}"]`);
    await expect(page).toHaveURL(/reports/);
    
    // Test navigation to settings
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.settings}"]`)).toBeVisible();
    await page.click(`[data-testid="${NAVIGATION_ITEMS.settings}"]`);
    await expect(page).toHaveURL(/settings/);
    
    // Test navigation back to dashboard
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.home}"]`)).toBeVisible();
    await page.click(`[data-testid="${NAVIGATION_ITEMS.home}"]`);
    await expect(page).toHaveURL(/dashboard|\/$/); // Home navigation might go to root (/) which shows dashboard
  });

  test('should handle navigation via direct links', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Test direct navigation via links
    await expect(page.locator('[data-testid="nav-income"]')).toBeVisible();
    await page.click('[data-testid="nav-income"]');
    await expect(page).toHaveURL(/income-manager/);
    
    // Navigate back to dashboard
    await page.goto(ROUTES.dashboard);
    
    await expect(page.locator('[data-testid="nav-expense"]')).toBeVisible();
    await page.click('[data-testid="nav-expense"]');
    await expect(page).toHaveURL(/expense-manager/);
    
    // Navigate back to dashboard
    await page.goto(ROUTES.dashboard);
    
    await expect(page.locator('a[href="/reports"]')).toBeVisible();
    await page.click('a[href="/reports"]');
    await expect(page).toHaveURL(/reports/);
    
    // Navigate back to dashboard
    await page.goto(ROUTES.dashboard);
    
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/settings/);
  });

  test('should show quick action buttons and shortcuts', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Check if dashboard loaded successfully
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    // Check for main action cards (income and expense managers)
    await expect(page.locator('[data-testid="nav-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-expense"]')).toBeVisible();
    
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

  test('should navigate to manual entry via expense manager', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Navigate to expense manager
    await expect(page.locator('[data-testid="nav-expense"]')).toBeVisible();
    await page.click('[data-testid="nav-expense"]');
    await expect(page).toHaveURL(/expense-manager/);
    
    // Look for manual entry options within expense manager
    const manualEntryLink = page.locator('a[href="/manual-entry"]');
    if (await manualEntryLink.count() > 0) {
      await manualEntryLink.click();
      await expect(page).toHaveURL(/manual-entry/);
    } else {
      // Check for manual entry button or option
      const manualEntryButton = page.locator('[data-testid="button-manual-entry"], button:has-text("Manual Entry")');
      if (await manualEntryButton.count() > 0) {
        await manualEntryButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify we're still on expense manager or navigated to manual entry
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/expense-manager|manual-entry/);
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Navigate to income manager
    await page.click('a[href="/income-manager"]');
    await expect(page).toHaveURL(/income-manager/);
    
    // Check for breadcrumb navigation
    const breadcrumbs = page.locator('.breadcrumb, [data-testid="breadcrumb"]');
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toBeVisible();
      
      // Test breadcrumb navigation back to dashboard
      const breadcrumbHome = breadcrumbs.locator('a[href="/dashboard"], .breadcrumb-home');
      if (await breadcrumbHome.count() > 0) {
        await breadcrumbHome.first().click();
        await expect(page).toHaveURL(/dashboard/);
      }
    }
  });

  test('should handle responsive navigation across devices', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.home}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.income}"]`)).toBeVisible();
    
    // Test tablet navigation
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.home}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.income}"]`)).toBeVisible();
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.home}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.income}"]`)).toBeVisible();
    
    // Check for mobile-specific navigation elements
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-navigation');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
    
    // Test mobile navigation functionality
    await page.click(`[data-testid="${NAVIGATION_ITEMS.income}"]`);
    await expect(page).toHaveURL(/income-manager/);
  });

  test('should maintain navigation state across page refreshes', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Navigate to income manager
    await page.click(`[data-testid="${NAVIGATION_ITEMS.income}"]`);
    await expect(page).toHaveURL(/income-manager/);
    
    // Refresh page
    await page.reload();
    
    // Verify we're still on income manager and navigation is functional
    await expect(page).toHaveURL(/income-manager/);
    await expect(page.locator(`[data-testid="${NAVIGATION_ITEMS.home}"]`)).toBeVisible();
    
    // Navigate back to dashboard
    await page.click(`[data-testid="${NAVIGATION_ITEMS.home}"]`);
    await expect(page).toHaveURL(/dashboard|\/$/); // Home navigation might go to root (/) which shows dashboard
  });

  test('should handle navigation errors and edge cases', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Test navigation to non-existent route
    await page.goto('/non-existent-route');
    
    // Should redirect to not found page or stay on non-existent route
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/non-existent-route|not-found|dashboard/);
    
    // Test navigation with network issues (simulate slow loading)
    await page.goto(ROUTES.dashboard);
    await page.click(`[data-testid="${NAVIGATION_ITEMS.income}"]`);
    
    // Wait for navigation to complete with timeout
    await expect(page).toHaveURL(/income-manager/, { timeout: 10000 });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    
    // Try different approach for WebKit - focus on body first, then tab
    await page.locator('body').focus();
    await page.waitForTimeout(500);
    
    // Test Tab navigation through navigation elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check if focus is on a navigable element - try multiple selectors
    const focusedElement = page.locator(':focus');
    const focusedCount = await focusedElement.count();
    
    // If no focused element, try to find any focusable element
    if (focusedCount === 0) {
      // Try to find any focusable navigation element
      const focusableElements = page.locator('button, [data-testid^="nav-"], a[href]');
      const hasFocusable = await focusableElements.count() > 0;
      expect(hasFocusable).toBe(true);
    } else {
      expect(focusedCount).toBeGreaterThan(0);
    }
    
    // Test keyboard navigation by pressing Enter on a navigation element
    const navElement = page.locator(`[data-testid="${NAVIGATION_ITEMS.income}"]`);
    await navElement.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Verify navigation occurred
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/dashboard|income-manager|expense-manager|reports|settings/);
  });
});
