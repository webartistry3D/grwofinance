import { test, expect } from '@playwright/test';

test('diagnostic - check API request interception', async ({ page }) => {
  // Enable request interception logging
  const requests: any[] = [];
  
  await page.route('**/api/tax/compliance/dashboard**', route => {
    requests.push({
      url: route.request().url(),
      method: route.request().method(),
      headers: route.request().headers()
    });
    
    console.log('Intercepted request:', route.request().url());
    
    // Mock a 500 error
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });

  // Navigate to the page
  await page.goto('/tax-compliance');
  
  // Wait for any requests to be made
  await page.waitForTimeout(2000);
  
  console.log('Total requests intercepted:', requests.length);
  console.log('Requests:', requests);
  
  // Check if error elements are present
  const errorMessage = page.locator('[data-testid="error-message"]');
  const retryButton = page.locator('[data-testid="retry-button"]');
  
  console.log('Error message visible:', await errorMessage.isVisible());
  console.log('Retry button visible:', await retryButton.isVisible());
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-error-state.png' });
});
