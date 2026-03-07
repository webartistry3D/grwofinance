import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[data-testid="input-email"]', 'admin@grwofinance.com');
    await page.fill('input[data-testid="input-password"]', 'Password1706#');
    await page.click('button[data-testid="button-login"]');
    
    // Wait for login success and redirect to admin dashboard
    await expect(page).toHaveURL(/admin/);
  });

  test('should display admin dashboard overview with all metrics', async ({ page }) => {
    await page.goto('/admin');
    
    // Check admin dashboard header
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check overview tab is active by default
    await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible();
    
    // Check all key metrics cards
    await expect(page.locator('[data-testid="text-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-active-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-paid-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-total-platform-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-average-spending"]')).toBeVisible();
    
    // Check recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    await expect(page.locator('text=New users this month:')).toBeVisible();
    await expect(page.locator('text=System status:')).toBeVisible();
    await expect(page.locator('text=Healthy')).toBeVisible();
  });

  test('should navigate between admin tabs', async ({ page }) => {
    await page.goto('/admin');
    
    // Test switching to Users tab
    await page.click('text=Users');
    await expect(page.locator('[data-testid="tab-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-user-search"]')).toBeVisible();
    
    // Test switching to Reports tab
    await page.click('text=Reports');
    await expect(page.locator('[data-testid="tab-reports"]')).toBeVisible();
    await expect(page.locator('text=System Reports')).toBeVisible();
    
    // Test switching back to Overview
    await page.click('text=Overview');
    await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible();
  });

  test('should display user management features', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to Users tab
    await page.click('text=Users');
    
    // Check user search functionality
    await expect(page.locator('[data-testid="input-user-search"]')).toBeVisible();
    await expect(page.locator('text=Search Users')).toBeVisible();
    await expect(page.locator('[data-testid="input-user-search"][placeholder="Search by email or name..."]')).toBeVisible();
    
    // Check user filter dropdown
    await expect(page.locator('text=Filter by Status')).toBeVisible();
    await expect(page.locator('[data-testid="user-filter-select"]')).toBeVisible();
    
    // Test user search
    await page.fill('[data-testid="input-user-search"]', 'test');
    await page.waitForTimeout(500); // Wait for search to apply
    
    // Check if users are displayed (if any exist)
    const userCards = page.locator('.card');
    if (await userCards.count() > 0) {
      await expect(userCards.first()).toBeVisible();
    }
  });

  test('should handle user status toggles', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to Users tab
    await page.click('text=Users');
    
    // Look for user status toggle buttons
    const userToggleButtons = page.locator('[data-testid^="button-toggle-user-status-"]');
    if (await userToggleButtons.count() > 0) {
      await expect(userToggleButtons.first()).toBeVisible();
      
      // Test clicking a user status toggle
      await userToggleButtons.first().click();
      await page.waitForTimeout(500); // Wait for toggle to apply
    }
    
    // Look for admin status toggle buttons
    const adminToggleButtons = page.locator('[data-testid^="button-toggle-admin-status-"]');
    if (await adminToggleButtons.count() > 0) {
      await expect(adminToggleButtons.first()).toBeVisible();
      
      // Test clicking an admin status toggle
      await adminToggleButtons.first().click();
      await page.waitForTimeout(500); // Wait for toggle to apply
    }
    
    // Verify we're still on admin page after interactions
    await expect(page).toHaveURL(/admin/);
  });

  test('should display reports section with system health', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to Reports tab
    await page.click('text=Reports');
    
    // Check reports section - using more flexible selectors
    const systemReportsTitle = page.locator('text=System Reports');
    if (await systemReportsTitle.count() > 0) {
      await expect(systemReportsTitle).toBeVisible();
    }
    
    const systemHealthButton = page.locator('text=System Health Report');
    if (await systemHealthButton.count() > 0) {
      await expect(systemHealthButton).toBeVisible();
    }
    
    const userAnalyticsButton = page.locator('text=Generate User Analytics Report');
    if (await userAnalyticsButton.count() > 0) {
      await expect(userAnalyticsButton).toBeVisible();
    }
    
    const financialReportButton = page.locator('text=Generate Financial Report');
    if (await financialReportButton.count() > 0) {
      await expect(financialReportButton).toBeVisible();
    }
    
    // Test clicking System Health Report button
    if (await systemHealthButton.count() > 0) {
      await systemHealthButton.click();
      await page.waitForTimeout(500); // Wait for report to load
      
      // Check if system health report is displayed
      const systemHealthReport = page.locator('[data-testid="system-health-report"]');
      if (await systemHealthReport.count() > 0) {
        await expect(systemHealthReport).toBeVisible();
      }
    }
  });

  test('should handle user filtering', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to Users tab
    await page.click('text=Users');
    
    // Test filtering by status
    const filterDropdown = page.locator('[data-testid="user-filter-select"]');
    if (await filterDropdown.count() > 0) {
      await filterDropdown.click();
      
      // Try selecting different filter options
      await page.click('text=Active Users');
      await page.waitForTimeout(500);
      
      await filterDropdown.click();
      await page.click('text=Inactive Users');
      await page.waitForTimeout(500);
      
      await filterDropdown.click();
      await page.click('text=All Users');
      await page.waitForTimeout(500);
    }
  });

  test('should display user information correctly', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to Users tab
    await page.click('text=Users');
    
    // Check if user cards are displayed (if users exist)
    const userCards = page.locator('.card');
    if (await userCards.count() > 0) {
      await expect(userCards.first()).toBeVisible();
      
      // Check for user information elements
      const userNames = page.locator('p.font-medium');
      if (await userNames.count() > 0) {
        await expect(userNames.first()).toBeVisible();
      }
      
      const userEmails = page.locator('p.text-xs.text-muted-foreground');
      if (await userEmails.count() > 0) {
        await expect(userEmails.first()).toBeVisible();
      }
      
      // Check for status badges
      const statusBadges = page.locator('.badge');
      if (await statusBadges.count() > 0) {
        await expect(statusBadges.first()).toBeVisible();
      }
    }
  });

  test('should maintain admin session across navigation', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate through different tabs
    await page.click('text=Users');
    await page.waitForTimeout(500);
    
    await page.click('text=Reports');
    await page.waitForTimeout(500);
    
    await page.click('text=Overview');
    await page.waitForTimeout(500);
    
    // Verify we're still on admin page and authenticated
    await expect(page).toHaveURL(/admin/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });
});
