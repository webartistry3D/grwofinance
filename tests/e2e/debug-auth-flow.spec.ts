import { test, expect } from '@playwright/test';

test('diagnostic - check auth state and API call flow', async ({ page }) => {
  // Enable comprehensive request logging
  const allRequests: any[] = [];
  const apiRequests: any[] = [];
  
  // Log ALL requests
  await page.route('**/*', route => {
    const request = route.request();
    allRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
    
    // Check if it's an API request
    if (request.url().includes('/api/')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      
      console.log('API Request:', request.url());
      
      // Mock tax compliance endpoint with error
      if (request.url().includes('/api/tax/compliance/dashboard')) {
        console.log('Intercepting tax compliance request - RETURNING 500 ERROR');
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    } else {
      route.continue();
    }
  });

  // Check page content before navigation
  await page.goto('/login');
  console.log('On login page');
  
  // Login first
  await page.fill('input[data-testid="input-email"]', 'admin@grwofinance.com');
  await page.fill('input[data-testid="input-password"]', 'Password1706#');
  await page.click('button[data-testid="button-login"]');
  
  // Wait for login to complete
  await page.waitForTimeout(2000);
  
  console.log('Logged in, navigating to tax compliance...');
  
  // Navigate to tax compliance page
  await page.goto('/tax-compliance');
  
  // Wait for page to load and API calls
  await page.waitForTimeout(5000);
  
  console.log('=== DIAGNOSTIC RESULTS ===');
  console.log('Total requests made:', allRequests.length);
  console.log('API requests made:', apiRequests.length);
  console.log('All requests:', allRequests.map(r => `${r.method} ${r.url}`));
  console.log('API requests:', apiRequests.map(r => `${r.method} ${r.url}`));
  
  // Check page content and state
  const pageContent = await page.content();
  console.log('Page contains error message:', pageContent.includes('error-message'));
  console.log('Page contains retry button:', pageContent.includes('retry-button'));
  console.log('Page contains loading spinner:', pageContent.includes('loading-spinner'));
  
  // Check for specific elements
  const errorMessage = page.locator('[data-testid="error-message"]');
  const retryButton = page.locator('[data-testid="retry-button"]');
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  const taxSummary = page.locator('[data-testid="tax-summary"]');
  
  console.log('Error message visible:', await errorMessage.isVisible());
  console.log('Retry button visible:', await retryButton.isVisible());
  console.log('Loading spinner visible:', await loadingSpinner.isVisible());
  console.log('Tax summary visible:', await taxSummary.isVisible());
  
  // Check for any console errors
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-auth-flow.png' });
});
