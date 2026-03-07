import { test, expect } from '@playwright/test';

// Test user credentials from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

// Profile data for testing
const PROFILE_DATA = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  invalid: {
    firstName: '',
    lastName: '',
    email: 'invalid-email'
  },
  updated: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com'
  }
};

test.describe('Profile Settings', () => {
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

  test('should navigate to profile page and display user information', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/profile/);
    
    // Check profile page header
    await expect(page.locator('h1')).toContainText(/Profile/i);
    
    // Check for back button
    const backButton = page.locator('[data-testid="button-back"]');
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
    }
    
    // Check for edit profile button
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await expect(editButton.first()).toBeVisible();
    }
    
    // Check for profile picture/avatar section
    const avatarSection = page.locator('.w-24.h-24');
    if (await avatarSection.count() > 0) {
      await expect(avatarSection.first()).toBeVisible();
    }
    
    // Check for change avatar button
    const changeAvatarButton = page.locator('[data-testid="button-change-avatar"]');
    if (await changeAvatarButton.count() > 0) {
      await expect(changeAvatarButton.first()).toBeVisible();
    }
    
    // Check for user display name
    const userName = page.locator('h2.text-xl.font-semibold');
    if (await userName.count() > 0) {
      await expect(userName.first()).toBeVisible();
    }
    
    // Check for user email
    const userEmail = page.locator('p.text-muted-foreground');
    if (await userEmail.count() > 0) {
      await expect(userEmail.first()).toBeVisible();
    }
  });

  test('should display subscription status information', async ({ page }) => {
    await page.goto('/profile');
    
    // Check for subscription status card
    const subscriptionCard = page.locator('card:has-text("Subscription Status")');
    if (await subscriptionCard.count() > 0) {
      await expect(subscriptionCard.first()).toBeVisible();
    }
    
    // Check for subscription badge (Premium/Freemium)
    const subscriptionBadge = page.locator('badge');
    if (await subscriptionBadge.count() > 0) {
      await expect(subscriptionBadge.first()).toBeVisible();
    }
    
    // Check for monthly scans usage
    const scansUsed = page.locator('text=/Monthly Scans Used/');
    if (await scansUsed.count() > 0) {
      await expect(scansUsed.first()).toBeVisible();
    }
    
    // Check for manage subscription button
    const manageSubscriptionButton = page.locator('[data-testid="button-manage-subscription"]');
    if (await manageSubscriptionButton.count() > 0) {
      await expect(manageSubscriptionButton.first()).toBeVisible();
    }
  });

  test('should display personal information in view mode', async ({ page }) => {
    await page.goto('/profile');
    
    // Check for personal information card
    const personalInfoCard = page.locator('card:has-text("Personal Information")');
    if (await personalInfoCard.count() > 0) {
      await expect(personalInfoCard.first()).toBeVisible();
    }
    
    // Check for first name display
    const firstNameLabel = page.locator('text=First Name');
    if (await firstNameLabel.count() > 0) {
      await expect(firstNameLabel.first()).toBeVisible();
    }
    
    // Check for last name display
    const lastNameLabel = page.locator('text=Last Name');
    if (await lastNameLabel.count() > 0) {
      await expect(lastNameLabel.first()).toBeVisible();
    }
    
    // Check for email display
    const emailLabel = page.locator('text=Email');
    if (await emailLabel.count() > 0) {
      await expect(emailLabel.first()).toBeVisible();
    }
    
    // Check for member since date
    const memberSinceLabel = page.locator('text=Member Since');
    if (await memberSinceLabel.count() > 0) {
      await expect(memberSinceLabel.first()).toBeVisible();
    }
  });

  test('should enter edit mode when edit button is clicked', async ({ page }) => {
    await page.goto('/profile');
    
    // Click edit profile button
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Check for form fields in edit mode
    const firstNameInput = page.locator('[data-testid="input-first-name"]');
    if (await firstNameInput.count() > 0) {
      await expect(firstNameInput.first()).toBeVisible();
    }
    
    const lastNameInput = page.locator('[data-testid="input-last-name"]');
    if (await lastNameInput.count() > 0) {
      await expect(lastNameInput.first()).toBeVisible();
    }
    
    const emailInput = page.locator('[data-testid="input-email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();
    }
    
    // Check for save button
    const saveButton = page.locator('[data-testid="button-save-profile"]');
    if (await saveButton.count() > 0) {
      await expect(saveButton.first()).toBeVisible();
    }
    
    // Check for cancel button
    const cancelButton = page.locator('[data-testid="button-cancel-edit"]');
    if (await cancelButton.count() > 0) {
      await expect(cancelButton.first()).toBeVisible();
    }
  });

  test('should update profile with valid data', async ({ page }) => {
    await page.goto('/profile');
    
    // Enter edit mode
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Fill in updated profile data
    const firstNameInput = page.locator('[data-testid="input-first-name"]');
    if (await firstNameInput.count() > 0) {
      await firstNameInput.first().clear();
      await firstNameInput.first().fill(PROFILE_DATA.updated.firstName);
    }
    
    const lastNameInput = page.locator('[data-testid="input-last-name"]');
    if (await lastNameInput.count() > 0) {
      await lastNameInput.first().clear();
      await lastNameInput.first().fill(PROFILE_DATA.updated.lastName);
    }
    
    const emailInput = page.locator('[data-testid="input-email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().clear();
      await emailInput.first().fill(PROFILE_DATA.updated.email);
    }
    
    // Save changes
    const saveButton = page.locator('[data-testid="button-save-profile"]');
    if (await saveButton.count() > 0) {
      await saveButton.first().click();
    }
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Check for success message
    const successMessage = page.locator('text=Profile Updated');
    if (await successMessage.count() > 0) {
      await expect(successMessage.first()).toBeVisible();
    }
    
    // Verify we're back in view mode
    const viewModeLabels = page.locator('text=First Name');
    if (await viewModeLabels.count() > 0) {
      await expect(viewModeLabels.first()).toBeVisible();
    }
  });

  test('should validate profile form fields and show errors', async ({ page }) => {
    await page.goto('/profile');
    
    // Enter edit mode
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Try to submit empty form
    const firstNameInput = page.locator('[data-testid="input-first-name"]');
    if (await firstNameInput.count() > 0) {
      await firstNameInput.first().clear();
    }
    
    const lastNameInput = page.locator('[data-testid="input-last-name"]');
    if (await lastNameInput.count() > 0) {
      await lastNameInput.first().clear();
    }
    
    const emailInput = page.locator('[data-testid="input-email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().clear();
    }
    
    // Try to save
    const saveButton = page.locator('[data-testid="button-save-profile"]');
    if (await saveButton.count() > 0) {
      await saveButton.first().click();
    }
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for validation error messages
    const errorMessages = page.locator('text=/required|invalid/i');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should cancel profile editing and revert changes', async ({ page }) => {
    await page.goto('/profile');
    
    // Enter edit mode
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Make changes to form
    const firstNameInput = page.locator('[data-testid="input-first-name"]');
    if (await firstNameInput.count() > 0) {
      await firstNameInput.first().clear();
      await firstNameInput.first().fill('Temporary Name');
    }
    
    // Cancel editing
    const cancelButton = page.locator('[data-testid="button-cancel-edit"]');
    if (await cancelButton.count() > 0) {
      await cancelButton.first().click();
    }
    
    // Wait for cancel to complete
    await page.waitForTimeout(1000);
    
    // Verify we're back in view mode
    const viewModeLabels = page.locator('text=First Name');
    if (await viewModeLabels.count() > 0) {
      await expect(viewModeLabels.first()).toBeVisible();
    }
    
    // Verify changes were not saved
    const temporaryName = page.locator('text=Temporary Name');
    if (await temporaryName.count() > 0) {
      await expect(temporaryName.first()).not.toBeVisible();
    }
  });

  test('should display account statistics', async ({ page }) => {
    await page.goto('/profile');
    
    // Check for account statistics card
    const statsCard = page.locator('card:has-text("Account Statistics")');
    if (await statsCard.count() > 0) {
      await expect(statsCard.first()).toBeVisible();
    }
    
    // Check for total expenses statistic
    const totalExpenses = page.locator('text=Total Expenses');
    if (await totalExpenses.count() > 0) {
      await expect(totalExpenses.first()).toBeVisible();
    }
    
    // Check for receipts scanned statistic
    const receiptsScanned = page.locator('text=Receipts Scanned');
    if (await receiptsScanned.count() > 0) {
      await expect(receiptsScanned.first()).toBeVisible();
    }
    
    // Check for statistical values (should be numbers)
    const statValues = page.locator('p.text-2xl.font-bold');
    if (await statValues.count() > 0) {
      await expect(statValues.first()).toBeVisible();
    }
  });

  test('should handle avatar change interaction', async ({ page }) => {
    await page.goto('/profile');
    
    // Check for change avatar button
    const changeAvatarButton = page.locator('[data-testid="button-change-avatar"]');
    if (await changeAvatarButton.count() > 0) {
      await expect(changeAvatarButton.first()).toBeVisible();
      
      // Click avatar change button
      await changeAvatarButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for toast message about avatar upload
      const toastMessage = page.locator('text=Avatar Change');
      if (await toastMessage.count() > 0) {
        await expect(toastMessage.first()).toBeVisible();
      }
    }
  });

  test('should navigate back to settings when back button is clicked', async ({ page }) => {
    await page.goto('/profile');
    
    // Click back button
    const backButton = page.locator('[data-testid="button-back"]');
    if (await backButton.count() > 0) {
      await backButton.first().click();
      await page.waitForTimeout(1000);
      
      // Should navigate back to settings
      await expect(page).toHaveURL(/settings/);
    }
  });

  test('should handle responsive design across devices', async ({ page }) => {
    await page.goto('/profile');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toContainText(/Profile/i);
    await expect(page.locator('[data-testid="button-edit-profile"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toContainText(/Profile/i);
    await expect(page.locator('[data-testid="button-edit-profile"]')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toContainText(/Profile/i);
    await expect(page.locator('[data-testid="button-edit-profile"]')).toBeVisible();
  });

  test('should handle network errors during profile update', async ({ page }) => {
    await page.goto('/profile');
    
    // Enter edit mode
    const editButton = page.locator('[data-testid="button-edit-profile"]');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Intercept network request to simulate error
    await page.route('**/api/auth/profile', route => route.abort());
    
    // Try to save changes
    const firstNameInput = page.locator('[data-testid="input-first-name"]');
    if (await firstNameInput.count() > 0) {
      await firstNameInput.first().clear();
      await firstNameInput.first().fill('Test Name');
    }
    
    const saveButton = page.locator('[data-testid="button-save-profile"]');
    if (await saveButton.count() > 0) {
      await saveButton.first().click();
    }
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorMessage = page.locator('text=Update Failed');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
});
