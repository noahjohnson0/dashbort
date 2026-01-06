import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'noahjohnson0@gmail.com';
const TEST_PASSWORD = '12345678aA';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check that login form elements are visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('form').getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    // Try to submit without email
    const passwordInput = page.getByLabel('Password');
    await passwordInput.fill(TEST_PASSWORD);
    
    // Try to submit the form
    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    await submitButton.click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeFocused();
  });

  test('should show validation error for empty password', async ({ page }) => {
    // Try to submit without password
    const emailInput = page.getByLabel('Email');
    await emailInput.fill(TEST_EMAIL);
    
    // Try to submit the form
    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    await submitButton.click();

    // HTML5 validation should prevent submission
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeFocused();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await emailInput.fill('invalid-email');
    await passwordInput.fill(TEST_PASSWORD);
    
    // Try to submit - HTML5 validation should prevent
    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    await submitButton.click();

    // Email input should be focused due to validation
    await expect(emailInput).toBeFocused();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Fill in the login form
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Submit the form
    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    await submitButton.click();

    // Wait for the dashboard to load - check for header structure
    // This is more reliable than waiting for the login form to disappear
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    
    // Verify we're on the dashboard - wait for the header avatar button to appear
    const headerAvatar = page.locator('header button').first();
    await expect(headerAvatar).toBeVisible({ timeout: 5000 });
    
    // Verify the login form is no longer visible
    await expect(page.getByLabel('Email')).not.toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill('wrongpassword123');

    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    await submitButton.click();

    // Wait for error message to appear
    await expect(page.getByText(/error|invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
    
    // Login form should still be visible
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    // Initially should be in sign in mode
    await expect(page.locator('form').getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Click the toggle button
    await page.getByRole('button', { name: /don't have an account\? sign up/i }).click();
    
    // Should now be in sign up mode
    await expect(page.locator('form').getByRole('button', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByText(/create an account/i)).toBeVisible();
    
    // Toggle back to sign in
    await page.getByRole('button', { name: /already have an account\? sign in/i }).click();
    
    // Should be back in sign in mode
    await expect(page.locator('form').getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
  });

  test('should display loading state during login', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    const submitButton = page.locator('form').getByRole('button', { name: 'Sign In' });
    
    // Submit the form
    await submitButton.click();
    
    // Check for loading state (button text changes to "Loading...")
    await expect(page.locator('form').getByRole('button', { name: /loading/i })).toBeVisible({ timeout: 1000 });
  });

  test('should have Google sign in button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should disable form during loading', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    const submitButton = page.locator('form button[type="submit"]');
    await submitButton.click();
    
    // During loading, the button should be disabled (button text changes to "Loading...")
    await expect(submitButton).toBeDisabled({ timeout: 2000 });
  });
});

