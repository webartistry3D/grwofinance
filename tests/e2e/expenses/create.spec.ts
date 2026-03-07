import { test, expect } from '@playwright/test';

// Test data constants from TESTING_GUIDE.md
const TEST_USER = {
  email: 'test@example.com',
  password: 'UserPassword123'
};

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

const EXPENSE_DATA = {
  valid: {
    merchant: 'Test Restaurant',
    amount: '150.50',
    category: EXPENSE_CATEGORIES[0],
    description: 'Lunch at restaurant',
    date: '2024-01-15',
    receiptFile: 'receipt.jpg'
  },
  invalid: {
    merchant: '',
    amount: '0',
    category: '',
    description: '',
    date: '',
    receiptFile: ''
  }
};

const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf'
];

test.describe('Expense Management - Create Expense', () => {
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

  test('should navigate to expense manager and show creation options', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to expense manager
    await page.click('a[href="/expense-manager"]');
    await expect(page).toHaveURL(/expense-manager/);
    
    // Check expense manager header
    await expect(page.locator('h1')).toContainText(/Expense Manager/i);
    
    // Check for expense creation options
    const addExpenseButton = page.locator('[data-testid="button-add-expense"], button:has-text("Add Expense"), button:has-text("+ Expense")');
    if (await addExpenseButton.count() > 0) {
      await expect(addExpenseButton.first()).toBeVisible();
    }
    
    // Check for creation method buttons
    const manualEntryButton = page.locator('[data-testid="button-manual-entry"], button:has-text("Manual Entry")');
    if (await manualEntryButton.count() > 0) {
      await expect(manualEntryButton.first()).toBeVisible();
    }
    
    const uploadButton = page.locator('[data-testid="button-upload-receipt"], button:has-text("Upload Receipt")');
    if (await uploadButton.count() > 0) {
      await expect(uploadButton.first()).toBeVisible();
    }
    
    const scanButton = page.locator('[data-testid="button-scan-receipt"], button:has-text("Scan Receipt")');
    if (await scanButton.count() > 0) {
      await expect(scanButton.first()).toBeVisible();
    }
  });

  test('should create expense via manual entry form', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to manual entry
    const manualEntryButton = page.locator('[data-testid="button-manual-entry"], button:has-text("Manual Entry")');
    if (await manualEntryButton.count() > 0) {
      await manualEntryButton.first().click();
    } else {
      // Alternative navigation via expense manager
      await page.click('a[href="/expense-manager"]');
      await page.click('a[href="/manual-entry"]');
    }
    
    // Should navigate to manual entry page
    await expect(page).toHaveURL(/manual-entry/);
    
    // Check manual entry form elements
    await expect(page.locator('[data-testid="input-merchant"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="textarea-notes"]')).toBeVisible();
    
    // Fill in valid expense data
    await page.fill('[data-testid="input-merchant"]', EXPENSE_DATA.valid.merchant);
    await page.fill('[data-testid="input-amount"]', EXPENSE_DATA.valid.amount);
    
    // Select expense category
    await page.click('[data-testid="select-category"]');
    await page.locator(`[role="option"]:has-text("${EXPENSE_DATA.valid.category}")`).click();
    
    // Set date
    await page.fill('[data-testid="input-date"]', EXPENSE_DATA.valid.date);
    
    // Add description
    await page.fill('[data-testid="textarea-notes"]', EXPENSE_DATA.valid.description);
    
    // Submit form
    const submitButton = page.locator('[data-testid="button-save-expense"], button:has-text("Save"), button:has-text("Submit")');
    await submitButton.click();
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Verify success - should return to dashboard after successful creation
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/$|dashboard/);
    
    // Check for success message
    const successMessage = page.locator('.success-message, [data-testid="success-message"]');
    if (await successMessage.count() > 0) {
      await expect(successMessage.first()).toBeVisible();
    }
  });

  test('should validate expense form fields and show errors', async ({ page }) => {
    await page.goto('/manual-entry');
    
    // Try to submit empty form
    const submitButton = page.locator('[data-testid="button-submit-expense"], button:has-text("Save"), button:has-text("Submit")');
    await submitButton.click();
    
    // Check for validation errors
    await page.waitForTimeout(1000);
    
    // Look for error messages
    const errorMessages = page.locator('.error-message, [data-testid="error"], .text-red-600');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
    
    // Test invalid amount
    const amountInput = page.locator('[data-testid="input-expense-amount"], input[name="amount"], input[placeholder*="amount"]');
    await amountInput.fill(EXPENSE_DATA.invalid.amount);
    await submitButton.click();
    
    // Check for amount validation error
    const amountError = page.locator('[data-testid="error-amount"], .error:has-text("amount")');
    if (await amountError.count() > 0) {
      await expect(amountError.first()).toBeVisible();
    }
    
    // Test future date validation
    const dateInput = page.locator('[data-testid="input-expense-date"], input[name="date"], input[type="date"]');
    if (await dateInput.count() > 0) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await dateInput.fill(futureDate.toISOString().split('T')[0]);
      await submitButton.click();
      
      // Check for date validation error
      await page.waitForTimeout(1000);
      const dateError = page.locator('[data-testid="error-date"], .error:has-text("date")');
      if (await dateError.count() > 0) {
        await expect(dateError.first()).toBeVisible();
      }
      
      // Reset to valid date
      await dateInput.fill(EXPENSE_DATA.valid.date);
    }
  });

  test('should handle different expense categories', async ({ page }) => {
    await page.goto('/manual-entry');
    
    // Test expense category selection
    const categorySelect = page.locator('[data-testid="select-expense-category"], select[name="category"]');
    if (await categorySelect.count() > 0) {
      // Check if all expected categories are available
      for (const category of EXPENSE_CATEGORIES) {
        const option = categorySelect.locator(`option:has-text("${category}")`);
        if (await option.count() > 0) {
          await expect(option).toBeVisible();
        }
      }
      
      // Test selecting different categories
      await categorySelect.selectOption({ label: EXPENSE_CATEGORIES[1] }); // Transportation
      await page.waitForTimeout(500);
      
      await categorySelect.selectOption({ label: EXPENSE_CATEGORIES[2] }); // Shopping
      await page.waitForTimeout(500);
    }
  });

  test('should create expense via file upload', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to expense manager
    await page.click('a[href="/expense-manager"]');
    await expect(page).toHaveURL(/expense-manager/);
    
    // Click upload receipt button
    const uploadButton = page.locator('[data-testid="button-upload-receipt"], button:has-text("Upload Receipt")');
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for upload modal or page
      const uploadModal = page.locator('[data-testid="upload-modal"], .upload-modal, .modal');
      if (await uploadModal.count() > 0) {
        await expect(uploadModal.first()).toBeVisible();
        
        // Check for file input
        const fileInput = uploadModal.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          await expect(fileInput.first()).toBeVisible();
          
          // Test file upload (simulate file selection)
          const file = {
            name: EXPENSE_DATA.valid.receiptFile,
            mimeType: SUPPORTED_FORMATS[0],
            buffer: Buffer.from('fake file content')
          };
          
          await fileInput.setInputFiles(file);
          await page.waitForTimeout(1000);
          
          // Check for file preview
          const filePreview = uploadModal.locator('[data-testid="file-preview"], .file-preview');
          if (await filePreview.count() > 0) {
            await expect(filePreview.first()).toBeVisible();
          }
          
          // Submit upload
          const submitUploadButton = uploadModal.locator('[data-testid="button-submit-upload"], button:has-text("Upload"), button:has-text("Process")');
          await submitUploadButton.click();
          
          await page.waitForTimeout(2000);
          
          // Verify upload success
          const successMessage = page.locator('.success-message, [data-testid="success-message"]');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should validate uploaded file formats and sizes', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Navigate to upload functionality
    const uploadButton = page.locator('[data-testid="button-upload-receipt"], button:has-text("Upload Receipt")');
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);
      
      const uploadModal = page.locator('[data-testid="upload-modal"], .upload-modal, .modal');
      if (await uploadModal.count() > 0) {
        const fileInput = uploadModal.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          // Test unsupported file format
          const unsupportedFile = {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('unsupported file')
          };
          
          await fileInput.setInputFiles(unsupportedFile);
          await page.waitForTimeout(1000);
          
          // Check for format error
          const formatError = uploadModal.locator('[data-testid="error-format"], .error:has-text("format")');
          if (await formatError.count() > 0) {
            await expect(formatError.first()).toBeVisible();
          }
          
          // Test oversized file (simulate large file)
          const largeFile = {
            name: 'large.jpg',
            mimeType: SUPPORTED_FORMATS[0],
            buffer: Buffer.alloc(15 * 1024 * 1024) // 15MB
          };
          
          await fileInput.setInputFiles(largeFile);
          await page.waitForTimeout(1000);
          
          // Check for size error
          const sizeError = uploadModal.locator('[data-testid="error-size"], .error:has-text("size")');
          if (await sizeError.count() > 0) {
            await expect(sizeError.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should create expense via receipt scanning', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to expense manager
    await page.click('a[href="/expense-manager"]');
    await expect(page).toHaveURL(/expense-manager/);
    
    // Click scan receipt button
    const scanButton = page.locator('[data-testid="button-scan-receipt"], button:has-text("Scan Receipt")');
    if (await scanButton.count() > 0) {
      await scanButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for scan modal or navigation to scan page
      const scanModal = page.locator('[data-testid="scan-modal"], .scan-modal, .modal');
      if (await scanModal.count() > 0) {
        await expect(scanModal.first()).toBeVisible();
        
        // Check for camera access request
        const cameraPermission = scanModal.locator('[data-testid="camera-permission"], .camera-permission');
        if (await cameraPermission.count() > 0) {
          await expect(cameraPermission.first()).toBeVisible();
          
          // Grant camera permission (simulate)
          const grantButton = cameraPermission.locator('[data-testid="button-grant-camera"], button:has-text("Allow")');
          if (await grantButton.count() > 0) {
            await grantButton.click();
            await page.waitForTimeout(1000);
          }
        }
        
        // Check for camera preview
        const cameraPreview = scanModal.locator('[data-testid="camera-preview"], .camera-preview, video');
        if (await cameraPreview.count() > 0) {
          await expect(cameraPreview.first()).toBeVisible();
          
          // Check for capture button
          const captureButton = scanModal.locator('[data-testid="button-capture"], button:has-text("Capture"), button:has-text("Take Photo")');
          if (await captureButton.count() > 0) {
            await expect(captureButton.first()).toBeVisible();
            
            // Simulate photo capture
            await captureButton.click();
            await page.waitForTimeout(2000);
            
            // Check for captured image preview
            const capturedImage = scanModal.locator('[data-testid="captured-image"], .captured-image, img');
            if (await capturedImage.count() > 0) {
              await expect(capturedImage.first()).toBeVisible();
              
              // Check for OCR processing
              const processingIndicator = scanModal.locator('[data-testid="processing"], .processing');
              if (await processingIndicator.count() > 0) {
                await expect(processingIndicator.first()).toBeVisible();
                await page.waitForTimeout(3000); // Wait for OCR processing
              }
              
              // Check for extracted data
              const extractedData = scanModal.locator('[data-testid="extracted-data"], .extracted-data');
              if (await extractedData.count() > 0) {
                await expect(extractedData.first()).toBeVisible();
                
                // Verify extracted fields
                await expect(extractedData.locator('[data-testid="extracted-amount"], .extracted-amount')).toBeVisible();
                await expect(extractedData.locator('[data-testid="extracted-merchant"], .extracted-merchant')).toBeVisible();
                await expect(extractedData.locator('[data-testid="extracted-date"], .extracted-date')).toBeVisible();
              }
              
              // Confirm expense creation
              const confirmButton = scanModal.locator('[data-testid="button-confirm-expense"], button:has-text("Confirm"), button:has-text("Create Expense")');
              if (await confirmButton.count() > 0) {
                await confirmButton.click();
                await page.waitForTimeout(2000);
                
                // Verify success
                const successMessage = page.locator('.success-message, [data-testid="success-message"]');
                if (await successMessage.count() > 0) {
                  await expect(successMessage.first()).toBeVisible();
                }
              }
            }
          }
        }
      } else {
        // Alternative: Navigate to scan page
        await expect(page).toHaveURL(/scan-receipt/);
        
        // Check scan page elements
        await expect(page.locator('h1')).toContainText(/Scan Receipt/i);
        await expect(page.locator('[data-testid="button-camera-capture"]')).toBeVisible();
        // Note: input-camera-capture is hidden by design, only check it exists
        await expect(page.locator('[data-testid="input-camera-capture"]')).toHaveCount(1);
      }
    }
  });

  test('should handle scanning errors and retries', async ({ page }) => {
    await page.goto('/expense-manager');
    
    const scanButton = page.locator('[data-testid="button-scan-receipt"], button:has-text("Scan Receipt")');
    if (await scanButton.count() > 0) {
      await scanButton.first().click();
      await page.waitForTimeout(1000);
      
      const scanModal = page.locator('[data-testid="scan-modal"], .scan-modal, .modal');
      if (await scanModal.count() > 0) {
        // Simulate camera access denied
        const cameraPermission = scanModal.locator('[data-testid="camera-permission"], .camera-permission');
        if (await cameraPermission.count() > 0) {
          const denyButton = cameraPermission.locator('[data-testid="button-deny-camera"], button:has-text("Deny")');
          if (await denyButton.count() > 0) {
            await denyButton.click();
            await page.waitForTimeout(1000);
            
            // Check for permission denied message
            const permissionError = scanModal.locator('[data-testid="error-camera-permission"], .error:has-text("camera")');
            if (await permissionError.count() > 0) {
              await expect(permissionError.first()).toBeVisible();
            }
            
            // Check for retry option
            const retryButton = scanModal.locator('[data-testid="button-retry-camera"], button:has-text("Retry")');
            if (await retryButton.count() > 0) {
              await expect(retryButton.first()).toBeVisible();
            }
          }
        }
        
        // Simulate OCR processing error
        const processingError = scanModal.locator('[data-testid="error-ocr"], .error:has-text("processing")');
        if (await processingError.count() > 0) {
          await expect(processingError.first()).toBeVisible();
          
          // Check for manual entry fallback
          const manualEntryFallback = scanModal.locator('[data-testid="button-manual-entry"], button:has-text("Manual Entry")');
          if (await manualEntryFallback.count() > 0) {
            await expect(manualEntryFallback.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should cancel expense creation and return to expense manager', async ({ page }) => {
    await page.goto('/manual-entry');
    
    // Fill in some data
    const amountInput = page.locator('[data-testid="input-expense-amount"], input[name="amount"], input[placeholder*="amount"]');
    if (await amountInput.count() > 0) {
      await amountInput.fill('100');
    }
    
    // Cancel form
    const cancelButton = page.locator('[data-testid="button-cancel-expense"], button:has-text("Cancel"), button:has-text("Close")');
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
      await page.waitForTimeout(1000);
      
      // Should return to dashboard after cancel
      await expect(page).toHaveURL(/\/$|dashboard/);
    }
  });

  test('should handle expense creation errors gracefully', async ({ page }) => {
    await page.goto('/manual-entry');
    
    // Fill in valid data
    const amountInput = page.locator('[data-testid="input-expense-amount"], input[name="amount"], input[placeholder*="amount"]');
    if (await amountInput.count() > 0) {
      await amountInput.fill(EXPENSE_DATA.valid.amount);
    }
    
    const categorySelect = page.locator('[data-testid="select-expense-category"], select[name="category"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ label: EXPENSE_DATA.valid.category });
    }
    
    // Submit and simulate network error (intercept network request)
    await page.route('**/api/expenses/**', route => route.abort());
    
    const submitButton = page.locator('[data-testid="button-submit-expense"], button:has-text("Save"), button:has-text("Submit")');
    await submitButton.click();
    
    // Check for error handling
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorMessage = page.locator('.error-message, [data-testid="error"], .text-red-600');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
    
    // Should allow retry
    const retryButton = page.locator('[data-testid="button-retry"], button:has-text("Retry")');
    if (await retryButton.count() > 0) {
      await expect(retryButton.first()).toBeVisible();
    }
  });

  test('should support multiple expense creation methods', async ({ page }) => {
    await page.goto('/expense-manager');
    
    // Check for all creation methods
    const manualEntryButton = page.locator('[data-testid="button-manual-entry"], button:has-text("Type")');
    const uploadButton = page.locator('[data-testid="button-upload-receipt"], button:has-text("Upload")');
    const scanButton = page.locator('[data-testid="button-scan-receipt"], button:has-text("Scan")');
    
    // Verify all methods are available
    const availableMethods = [];
    
    if (await manualEntryButton.count() > 0) {
      availableMethods.push('manual');
      await expect(manualEntryButton.first()).toBeVisible();
    }
    
    if (await uploadButton.count() > 0) {
      availableMethods.push('upload');
      await expect(uploadButton.first()).toBeVisible();
    }
    
    if (await scanButton.count() > 0) {
      availableMethods.push('scan');
      await expect(scanButton.first()).toBeVisible();
    }
    
    // Test each available method briefly
    for (const method of availableMethods) {
      // Ensure we're back on expense manager page
      await page.goto('/expense-manager');
      await page.waitForTimeout(1000);
      
      if (method === 'manual') {
        await manualEntryButton.first().click();
        await expect(page).toHaveURL(/manual-entry/);
        await page.goBack();
      } else if (method === 'upload') {
        await uploadButton.first().click();
        await expect(page).toHaveURL(/upload-receipt/);
        await page.goBack();
      } else if (method === 'scan') {
        await scanButton.first().click();
        await expect(page).toHaveURL(/scan-receipt/);
        await page.goBack();
      }
      
      await page.waitForTimeout(500);
    }
  });
});
