import { test, expect } from '@playwright/test';

test('diagnostic - check component state values', async ({ page }) => {
  // Enable request interception
  await page.route('**/api/tax/compliance/dashboard**', route => {
    console.log('Intercepting tax compliance request - RETURNING 500 ERROR');
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });

  // Login first
  await page.goto('/login');
  await page.fill('input[data-testid="input-email"]', 'admin@grwofinance.com');
  await page.fill('input[data-testid="input-password"]', 'Password1706#');
  await page.click('button[data-testid="button-login"]');
  await page.waitForTimeout(2000);

  // Navigate to tax compliance page
  await page.goto('/tax-compliance');
  
  // Wait for the error to be processed
  await page.waitForTimeout(3000);
  
  // Inject JavaScript to check component state
  const stateCheck = await page.evaluate(() => {
    // Try to find the component's state through React DevTools or other means
    const errorElement = document.querySelector('[data-testid="error-message"]');
    const retryElement = document.querySelector('[data-testid="retry-button"]');
    const loadingElement = document.querySelector('[data-testid="loading-spinner"]');
    const taxSummaryElement = document.querySelector('[data-testid="tax-summary"]');
    
    return {
      errorElementExists: !!errorElement,
      retryElementExists: !!retryElement,
      loadingElementExists: !!loadingElement,
      taxSummaryElementExists: !!taxSummaryElement,
      errorElementVisible: errorElement ? getComputedStyle(errorElement).display !== 'none' : false,
      retryElementVisible: retryElement ? getComputedStyle(retryElement).display !== 'none' : false,
      pageContent: document.body.innerHTML.substring(0, 1000) // First 1000 chars
    };
  });
  
  console.log('=== COMPONENT STATE DIAGNOSTIC ===');
  console.log('Error element exists:', stateCheck.errorElementExists);
  console.log('Retry element exists:', stateCheck.retryElementExists);
  console.log('Loading element exists:', stateCheck.loadingElementExists);
  console.log('Tax summary element exists:', stateCheck.taxSummaryElementExists);
  console.log('Error element visible:', stateCheck.errorElementVisible);
  console.log('Retry element visible:', stateCheck.retryElementVisible);
  console.log('Page content preview:', stateCheck.pageContent);
  
  // Check what's actually visible
  const errorMessage = page.locator('[data-testid="error-message"]');
  const retryButton = page.locator('[data-testid="retry-button"]');
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  const taxSummary = page.locator('[data-testid="tax-summary"]');
  
  console.log('Playwright checks:');
  console.log('Error message visible:', await errorMessage.isVisible());
  console.log('Retry button visible:', await retryButton.isVisible());
  console.log('Loading spinner visible:', await loadingSpinner.isVisible());
  console.log('Tax summary visible:', await taxSummary.isVisible());
  
  // Take screenshot
  await page.screenshot({ path: 'debug-component-state.png' });
});
