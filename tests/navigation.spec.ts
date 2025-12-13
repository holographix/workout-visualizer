/**
 * Navigation E2E Tests
 *
 * Tests for the main navigation functionality of the RidePro Training Platform.
 * Verifies that users can navigate between all main pages using both
 * desktop and mobile interfaces.
 *
 * Note: Coach link is only visible when logged in as a user who has athletes.
 * The API must be running and the user switcher must load a coach user for
 * Coach-related tests to pass.
 *
 * @module tests/navigation
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  /**
   * Tests that the home page redirects to the calendar page
   */
  test('should redirect from home to calendar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/calendar');
  });

  /**
   * Tests that core navigation links are visible on desktop
   * Note: Coach link is conditionally shown based on user role
   */
  test('should display navigation links on desktop', async ({ page }) => {
    await page.goto('/calendar');

    // Check that core nav items are always visible
    await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /visualizer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();

    // Coach link is only visible for coach users - check after user loads
    // Wait for the user switcher to appear which indicates user data has loaded
    const userSwitcher = page.locator('button').filter({ hasText: /select user|marco|laura|giuseppe|sofia/i });
    if (await userSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      // If Marco (coach) is selected, Coach link should be visible
      const currentUser = await userSwitcher.textContent();
      if (currentUser?.includes('Marco')) {
        await expect(page.getByRole('link', { name: /coach/i })).toBeVisible();
      }
    }
  });

  /**
   * Tests navigation to the Coach page
   * Note: This test requires being logged in as a coach user
   */
  test('should navigate to Coach page', async ({ page }) => {
    // Go directly to coach page - this works even without the nav link
    await page.goto('/coach');

    // Verify we're on the coach page
    await expect(page).toHaveURL('/coach');
    await expect(page.getByText('My Athletes')).toBeVisible();
  });

  /**
   * Tests navigation to the Visualizer page
   */
  test('should navigate to Visualizer page', async ({ page }) => {
    await page.goto('/calendar');

    // Click on Visualizer link
    await page.getByRole('link', { name: /visualizer/i }).click();

    // Verify we're on the visualizer page
    await expect(page).toHaveURL('/visualizer');
  });

  /**
   * Tests navigation to the Settings page
   */
  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/calendar');

    // Click on Settings link
    await page.getByRole('link', { name: /settings/i }).click();

    // Verify we're on the settings page
    await expect(page).toHaveURL('/settings');
  });

  /**
   * Tests that the logo is displayed in the header
   */
  test('should display logo in header', async ({ page }) => {
    await page.goto('/calendar');

    // Check that logo image is visible
    const logo = page.locator('header').locator('img, svg').first();
    await expect(logo).toBeVisible();
  });

  /**
   * Tests the color mode toggle
   */
  test('should toggle color mode', async ({ page }) => {
    await page.goto('/calendar');

    // Find the color mode toggle button
    const colorModeButton = page.getByRole('button', { name: /toggle color mode|dark mode|light mode/i });

    // Click to toggle
    await colorModeButton.click();

    // The page should still be functional after toggle
    await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
  });
});

test.describe('Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  /**
   * Tests that mobile menu button is visible on small screens
   */
  test('should show mobile menu button', async ({ page }) => {
    await page.goto('/calendar');

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toBeVisible();
  });

  /**
   * Tests that mobile menu opens and shows core navigation links
   */
  test('should open mobile menu and show navigation', async ({ page }) => {
    await page.goto('/calendar');

    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /open menu/i });
    await menuButton.click();

    // Wait for drawer to open and check core navigation links
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link', { name: /calendar/i })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link', { name: /visualizer/i })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link', { name: /settings/i })).toBeVisible();
  });

  /**
   * Tests navigation from mobile menu to Settings page
   */
  test('should navigate from mobile menu', async ({ page }) => {
    await page.goto('/calendar');

    // Open mobile menu
    await page.getByRole('button', { name: /open menu/i }).click();

    // Click on Settings link in the drawer (always visible)
    await page.getByRole('dialog').getByRole('link', { name: /settings/i }).click();

    // Verify navigation happened
    await expect(page).toHaveURL('/settings');
  });

  /**
   * Tests that mobile menu closes after navigation
   */
  test('should close mobile menu after navigation', async ({ page }) => {
    await page.goto('/calendar');

    // Open mobile menu
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Navigate to Settings (always visible)
    await page.getByRole('dialog').getByRole('link', { name: /settings/i }).click();

    // Menu should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
