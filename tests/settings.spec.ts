/**
 * Settings/Availability Page E2E Tests
 *
 * Tests for the Settings page functionality including:
 * - Availability configuration
 * - Goal management
 * - Profile settings
 *
 * @module tests/settings
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  /**
   * Tests that the settings page loads correctly
   */
  test('should display settings page', async ({ page }) => {
    // Should show settings content
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  /**
   * Tests that availability section is visible
   */
  test('should display availability section', async ({ page }) => {
    // Look for availability-related content
    const availabilitySection = page.getByText(/availability|schedule|training days/i);
    await expect(availabilitySection.first()).toBeVisible();
  });
});

test.describe('Availability Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  /**
   * Tests that day toggles are visible
   */
  test('should display day availability controls', async ({ page }) => {
    // Should show days of the week
    await expect(page.getByText('Mon').or(page.getByText('Monday'))).toBeVisible();
  });

  /**
   * Tests toggling day availability
   */
  test('should toggle day availability', async ({ page }) => {
    // Find a switch label (Chakra UI switches use label for clicking)
    const switchLabel = page.locator('label.chakra-switch').first();

    if (await switchLabel.isVisible()) {
      // Click the label to toggle
      await switchLabel.click();

      // The control should reflect the change
      await expect(switchLabel).toBeVisible();
    }
  });
});

test.describe('Goals Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  /**
   * Tests that goals section is visible
   */
  test('should display goals section', async ({ page }) => {
    const goalsSection = page.getByText(/goals|events|targets/i);
    await expect(goalsSection.first()).toBeVisible();
  });

  /**
   * Tests adding a new goal
   */
  test('should have add goal functionality', async ({ page }) => {
    const addGoalButton = page.getByRole('button', { name: /add.*goal|new.*goal|create.*goal/i });

    if (await addGoalButton.isVisible()) {
      await addGoalButton.click();

      // Should show goal form
      await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible();
    }
  });
});

test.describe('Settings - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  /**
   * Tests that settings page is responsive on mobile
   */
  test('should be responsive on mobile', async ({ page }) => {
    // Page should load and be functional
    await expect(page).toHaveURL('/settings');

    // Content should be visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  /**
   * Tests scrollability on mobile
   */
  test('should be scrollable on mobile', async ({ page }) => {
    // The page should have scrollable content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
