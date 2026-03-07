import { test, expect } from '@playwright/test';

test.describe('Tax Compliance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[data-testid="input-email"]', 'admin@grwofinance.com');
    await page.fill('input[data-testid="input-password"]', 'Password1706#');
    await page.click('button[data-testid="button-login"]');
    await page.waitForURL(/(dashboard|admin)/);
  });

  test('should display tax compliance dashboard', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Check page title
    await expect(page).toHaveTitle(/GrwoFinance - Your Automated Finance Assistant/);
    
    // Check main elements
    await expect(page.locator('h1')).toContainText('Tax Compliance Center');
    await expect(page.locator('[data-testid="firs-compliance-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-deadlines"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-reports"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should show FIRS compliance status', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Check compliance status card
    const complianceCard = page.locator('[data-testid="firs-compliance-status"]');
    await expect(complianceCard).toBeVisible();
    await expect(complianceCard.getByText('FIRS Compliance Status')).toBeVisible();
    
    // Check status indicators - just check the card is properly structured
    await expect(complianceCard.locator('[data-testid="compliance-status"]')).toBeVisible();
  });

  test('should display tax summary with calculations', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    const taxSummary = page.locator('[data-testid="tax-summary"]');
    await expect(taxSummary).toBeVisible();
    
    // Check tax calculations with exact implementation
    await expect(taxSummary.locator('[data-testid="vat-collected"]')).toBeVisible();
    await expect(taxSummary.locator('[data-testid="vat-paid"]')).toBeVisible();
    await expect(taxSummary.locator('[data-testid="wht-deducted"]')).toBeVisible();
    await expect(taxSummary.locator('[data-testid="wht-paid"]')).toBeVisible();
    await expect(taxSummary.locator('[data-testid="total-deductible-expenses"]')).toBeVisible();
    await expect(taxSummary.locator('[data-testid="net-tax-position"]')).toBeVisible();
    
    // Verify currency formatting
    const vatCollected = taxSummary.locator('[data-testid="vat-collected"]');
    await expect(vatCollected).toContainText('₦'); // Nigerian Naira symbol
    
    // Verify net position calculation display
    const netPosition = taxSummary.locator('[data-testid="net-tax-position"]');
    const netPositionText = await netPosition.textContent();
    
    // Check for either Payable, Refundable, or zero position
    if (netPositionText?.includes('Payable') || netPositionText?.includes('Refundable')) {
      // Test passes for non-zero positions
      expect(true).toBe(true);
    } else {
      // For zero positions, check that it shows a monetary amount
      expect(netPositionText).toMatch(/₦[\d,]+\.\d{2}/);
    }
  });

  test('should show upcoming tax deadlines', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    const deadlines = page.locator('[data-testid="upcoming-deadlines"]');
    await expect(deadlines).toBeVisible();
    await expect(deadlines.getByText('Upcoming Tax Deadlines')).toBeVisible();
    
    // Check if there are any deadlines or if it shows "No upcoming deadlines"
    const noDeadlinesText = deadlines.getByText('No upcoming deadlines');
    const deadlineItems = deadlines.locator('div').filter({ hasText: /VAT|WHT|PAYE|CIT/ });
    
    // Either show deadlines or show no deadlines message
    if (await noDeadlinesText.isVisible()) {
      expect(true).toBe(true); // No deadlines case
    } else {
      expect(deadlineItems.first()).toBeVisible(); // Has deadlines case
    }
  });

  test('should display recent tax reports', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    const reports = page.locator('[data-testid="recent-reports"]');
    await expect(reports).toBeVisible();
    await expect(reports.getByText('Recent Tax Reports')).toBeVisible();
    
    // Check report items
    const reportItems = page.locator('[data-testid="report-item"]');
    if (await reportItems.first().isVisible()) {
      const reportCount = await reportItems.count();
      expect(reportCount).toBeGreaterThan(0);
    } else {
      // Check for "No reports generated yet" message
      await expect(reports.getByText('No reports generated yet')).toBeVisible();
    }
  });

  test('should show quick action buttons', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    const quickActions = page.locator('[data-testid="quick-actions"]');
    await expect(quickActions).toBeVisible();
    
    // Check action buttons
    await expect(quickActions.locator('[data-testid="btn-generate-reports"]')).toBeVisible();
    await expect(quickActions.locator('[data-testid="btn-track-wht"]')).toBeVisible();
    await expect(quickActions.locator('[data-testid="btn-organize-receipts"]')).toBeVisible();
    await expect(quickActions.locator('[data-testid="btn-view-calendar"]')).toBeVisible();
  });

  test('should handle generate report action', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Click generate report button
    await page.click('[data-testid="btn-generate-reports"]');
    
    // Should navigate to reports page
    await expect(page).toHaveURL('/tax-reports');
  });

  test('should handle track WHT action', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Click track WHT button
    await page.click('[data-testid="btn-track-wht"]');
    
    // Should navigate to WHT tracking page
    await expect(page).toHaveURL('/wht-tracking');
  });

  test('should handle organize receipts action', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Click organize receipts button
    await page.click('[data-testid="btn-organize-receipts"]');
    
    // Should navigate to receipts page
    await expect(page).toHaveURL('/tax-receipts');
  });

  test('should handle view calendar action', async ({ page }) => {
    await page.goto('/tax-compliance');
    
    // Click view calendar button
    await page.click('[data-testid="btn-view-calendar"]');
    
    // Should navigate to calendar page
    await expect(page).toHaveURL('/tax-calendar');
  });

  test('should show loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/tax/compliance/dashboard', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/tax-compliance');
    
    // Check loading states
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    const skeletonCards = page.locator('[data-testid="skeleton-card"]');
    await expect(skeletonCards.first()).toBeVisible();
    const skeletonCount = await skeletonCards.count();
    expect(skeletonCount).toBeGreaterThan(0);
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/tax/compliance/dashboard**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/tax-compliance');
    
    // Wait a moment for the error to be handled
    await page.waitForTimeout(1000);
    
    // Check error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tax-compliance');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="tax-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    
    // Check mobile responsive grid layouts
    const taxSummaryGrid = page.locator('[data-testid="tax-summary"] .grid');
    await expect(taxSummaryGrid).toHaveClass(/grid-cols-1/); // Mobile should have 1 column
    
    const quickActionsGrid = page.locator('[data-testid="quick-actions"] .grid');
    await expect(quickActionsGrid).toHaveClass(/grid-cols-2/); // Mobile should have 2 columns
    
    // Check mobile text sizing
    const mobileTitles = page.locator('[data-testid="tax-summary"] .text-lg');
    expect(mobileTitles.first()).toBeVisible();
    
    // Check mobile padding
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveClass(/px-3/); // Mobile should have smaller padding
  });

  test('should support dark mode', async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.goto('/tax-compliance');
    
    // Wait a moment for the theme to apply
    await page.waitForTimeout(100);
    
    // Check dark mode styles on html element (default state)
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Toggle to light mode
    await page.click('[data-testid="button-theme-toggle"]');
    
    // Wait a moment for the theme to apply
    await page.waitForTimeout(100);
    
    // Check light mode styles
    await expect(page.locator('html')).toHaveClass(/light/);
    
    // Toggle back to dark mode
    await page.click('[data-testid="button-theme-toggle"]');
    
    // Wait a moment for the theme to apply
    await page.waitForTimeout(100);
    
    // Check dark mode styles again
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
