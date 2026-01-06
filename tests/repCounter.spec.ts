import { test, expect } from '@playwright/test';

test.describe('RepCounter', () => {
  // Helper function to get exercise card by name
  const getExerciseCard = async (page: any, exerciseName: string) => {
    // Find the text element, then navigate to parent card
    // The structure is: card > div > text, so we go up 2 levels
    const exerciseText = page.getByText(exerciseName, { exact: true }).first();
    // Get the parent div that has cursor-pointer class
    return exerciseText.locator('..').locator('..').first();
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    
    // Wait for login and navigate to dashboard
    const emailInput = page.getByLabel('Email');
    if (await emailInput.isVisible()) {
      await emailInput.fill('noahjohnson0@gmail.com');
      await page.getByLabel('Password').fill('12345678aA');
      await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    }
    
    // Clear localStorage for rep counter
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Reload to ensure clean state
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Wait for Rep Counter to be visible
    await expect(page.getByRole('heading', { name: /rep counter/i })).toBeVisible();
  });

  test('should display default exercise types', async ({ page }) => {
    // Check that default exercises are visible
    await expect(page.getByText('pushup', { exact: false })).toBeVisible();
    await expect(page.getByText('squat', { exact: false })).toBeVisible();
    await expect(page.getByText('pullup', { exact: false })).toBeVisible();
  });

  test('should display Rep Counter title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rep counter/i })).toBeVisible();
  });

  test('should display initial count of 0 for each exercise', async ({ page }) => {
    // Each exercise should show 0 - find the cards and check for 0
    const pushupCard = await getExerciseCard(page, 'pushup');
    const squatCard = await getExerciseCard(page, 'squat');
    const pullupCard = await getExerciseCard(page, 'pullup');
    
    // Check that each card contains a 0
    await expect(pushupCard.getByText('0', { exact: true })).toBeVisible();
    await expect(squatCard.getByText('0', { exact: true })).toBeVisible();
    await expect(pullupCard.getByText('0', { exact: true })).toBeVisible();
  });

  test('should increment count when clicking on exercise card', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    
    // Click the card
    await pushupCard.click();
    
    // Count should be 1 - find it within the same card container
    await expect(pushupCard.getByText('1', { exact: true })).toBeVisible({ timeout: 2000 });
  });

  test('should increment multiple times', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    
    // Click 3 times
    await pushupCard.click();
    await pushupCard.click();
    await pushupCard.click();
    
    // Count should be 3
    await expect(pushupCard.getByText('3', { exact: true })).toBeVisible({ timeout: 2000 });
  });

  test('should decrement count when clicking minus button', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    
    // Increment first
    await pushupCard.click();
    await pushupCard.click();
    await expect(pushupCard.getByText('2', { exact: true })).toBeVisible();
    
    // Find and click the decrement button (first one in the card)
    const decrementButton = pushupCard.getByRole('button', { name: '−' }).first();
    await decrementButton.click();
    
    // Count should be 1
    await expect(pushupCard.getByText('1', { exact: true })).toBeVisible();
  });

  test('should not decrement below 0', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    const decrementButton = pushupCard.getByRole('button', { name: '−' }).first();
    
    // Decrement button should be disabled when count is 0
    await expect(decrementButton).toBeDisabled();
    
    // Count should remain 0
    await expect(pushupCard.getByText('0', { exact: true })).toBeVisible();
  });

  test('should highlight exercise card when incrementing', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    
    // Click to increment
    await pushupCard.click();
    
    // Card should have highlight class (green background) - check immediately
    // The highlight is temporary (200ms), so we check right away
    await page.waitForTimeout(50);
    const cardClass = await pushupCard.getAttribute('class');
    expect(cardClass).toMatch(/bg-green-500|bg-green-600/);
  });

  test('should open settings dialog when clicking settings button', async ({ page }) => {
    // Find settings button near the Rep Counter heading
    const repCounterHeading = page.getByRole('heading', { name: /rep counter/i });
    const settingsButton = repCounterHeading.locator('..').getByRole('button').first();
    await settingsButton.click();
    
    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/configure exercise types/i)).toBeVisible();
  });

  test('should add new exercise in settings dialog', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Click Add Exercise button
    await page.getByRole('button', { name: /add exercise/i }).click();
    
    // New input field should appear
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(3); // Should have more than default 3
  });

  test('should remove exercise in settings dialog', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Find remove buttons
    const removeButtons = page.getByRole('button', { name: /remove/i });
    const initialCount = await removeButtons.count();
    
    // Click first remove button
    await removeButtons.first().click();
    
    // Should have one less remove button now
    const newCount = await removeButtons.count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should not allow removing last exercise', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Remove exercises until only one remains
    const removeButtons = page.getByRole('button', { name: /remove/i });
    let count = await removeButtons.count();
    
    while (count > 1) {
      await removeButtons.first().click();
      await page.waitForTimeout(100);
      count = await removeButtons.count();
    }
    
    // Last remove button should be disabled
    await expect(removeButtons.first()).toBeDisabled();
  });

  test('should save exercise configuration', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Add a new exercise
    await page.getByRole('button', { name: /add exercise/i }).click();
    
    // Type in the new exercise name
    const inputs = page.locator('input[type="text"]');
    const lastInput = inputs.last();
    await lastInput.fill('burpee');
    
    // Save configuration
    await page.getByRole('button', { name: /^save$/i }).click();
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // New exercise should appear in the main view
    await expect(page.getByText('burpee', { exact: false })).toBeVisible();
  });

  test('should cancel settings dialog without saving', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Add a new exercise
    await page.getByRole('button', { name: /add exercise/i }).click();
    const inputs = page.locator('input[type="text"]');
    const lastInput = inputs.last();
    await lastInput.fill('burpee');
    
    // Cancel instead of saving
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // New exercise should NOT appear (changes not saved)
    await expect(page.getByText('burpee', { exact: false })).not.toBeVisible();
  });

  test('should persist counts in localStorage', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    
    // Increment a few times
    await pushupCard.click();
    await pushupCard.click();
    await pushupCard.click();
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Re-find elements after reload
    await expect(page.getByRole('heading', { name: /rep counter/i })).toBeVisible();
    const pushupCardAfter = await getExerciseCard(page, 'pushup');
    
    // Count should persist
    await expect(pushupCardAfter.getByText('3', { exact: true })).toBeVisible({ timeout: 2000 });
  });

  test('should handle multiple exercises independently', async ({ page }) => {
    const pushupCard = await getExerciseCard(page, 'pushup');
    const squatCard = await getExerciseCard(page, 'squat');
    
    // Increment pushup
    await pushupCard.click();
    await pushupCard.click();
    
    // Increment squat
    await squatCard.click();
    
    // Check counts are independent
    await expect(pushupCard.getByText('2', { exact: true })).toBeVisible();
    await expect(squatCard.getByText('1', { exact: true })).toBeVisible();
  });

  test('should update exercise name in settings', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /configure rep counter/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Find first exercise input
    const firstInput = page.locator('input[type="text"]').first();
    await firstInput.clear();
    await firstInput.fill('pushups');
    
    // Save
    await page.getByRole('button', { name: /^save$/i }).click();
    
    // Updated name should appear
    await expect(page.getByText('pushups', { exact: false })).toBeVisible();
  });
});

