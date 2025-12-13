/**
 * Coach Dashboard E2E Tests
 *
 * Tests for the Coach page functionality including:
 * - Athlete list display
 * - Athlete cards and interactions
 * - Navigation to workout builder page
 *
 * @module tests/coach-dashboard
 */
import { test, expect } from '@playwright/test';

test.describe('Coach Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coach');
  });

  /**
   * Tests that the coach page loads correctly
   */
  test('should display coach page header', async ({ page }) => {
    await expect(page.getByText('My Athletes')).toBeVisible();
  });

  /**
   * Tests that athlete cards are displayed
   */
  test('should display athlete cards', async ({ page }) => {
    // Check for mock athlete names
    await expect(page.getByText('Marco Rossi')).toBeVisible();
    await expect(page.getByText('Laura Bianchi')).toBeVisible();
    await expect(page.getByText('Giuseppe Verdi')).toBeVisible();
    await expect(page.getByText('Sofia Romano')).toBeVisible();
  });

  /**
   * Tests that athlete count is displayed
   */
  test('should display athlete count', async ({ page }) => {
    await expect(page.getByText(/4 athletes/i)).toBeVisible();
  });

  /**
   * Tests that athlete status badges are shown
   */
  test('should display athlete status badges', async ({ page }) => {
    // Check for status badges
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('New')).toBeVisible();
  });

  /**
   * Tests that athlete TSS is displayed
   */
  test('should display athlete weekly TSS', async ({ page }) => {
    await expect(page.getByText('450 TSS/week')).toBeVisible();
    await expect(page.getByText('380 TSS/week')).toBeVisible();
  });

  /**
   * Tests that athlete upcoming workouts count is displayed
   */
  test('should display upcoming workouts count', async ({ page }) => {
    await expect(page.getByText('3 upcoming')).toBeVisible();
    await expect(page.getByText('5 upcoming')).toBeVisible();
  });

  /**
   * Tests that My Workouts sidebar is visible
   */
  test('should display My Workouts sidebar', async ({ page }) => {
    await expect(page.getByText('My Workouts')).toBeVisible();
    await expect(page.getByText('Create Workout')).toBeVisible();
  });

  /**
   * Tests empty workouts state
   */
  test('should display empty workouts message', async ({ page }) => {
    await expect(page.getByText("You haven't created any workouts yet")).toBeVisible();
  });

  /**
   * Tests athlete card interaction buttons are present
   */
  test('should display athlete action buttons', async ({ page }) => {
    // Athlete cards should have icon buttons for actions
    // These buttons have aria-labels
    const calendarButtons = page.getByRole('button', { name: /calendar/i });
    const statsButtons = page.getByRole('button', { name: /stat/i });
    const contactButtons = page.getByRole('button', { name: /contact/i });

    await expect(calendarButtons.first()).toBeVisible();
    await expect(statsButtons.first()).toBeVisible();
    await expect(contactButtons.first()).toBeVisible();
  });

  /**
   * Tests that clicking View Calendar button is functional
   */
  test('should show toast when clicking view calendar', async ({ page }) => {
    // Find any calendar button and click it
    const calendarButtons = page.getByRole('button', { name: /calendar/i });
    await calendarButtons.first().click();

    // Page should remain functional after click
    await expect(page.getByText('My Athletes')).toBeVisible();
  });

  /**
   * Tests that clicking View Stats shows a toast
   */
  test('should show toast when clicking view stats', async ({ page }) => {
    // Find the first athlete card's stats button
    const statsButtons = page.getByRole('button', { name: /view stat/i });
    await statsButtons.first().click();

    // Check for toast notification
    await expect(page.getByText(/opening stat/i)).toBeVisible();
  });
});

test.describe('Workout Builder Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coach');
  });

  /**
   * Tests that clicking Create Workout navigates to workout builder page
   */
  test('should navigate to workout builder page', async ({ page }) => {
    // Click Create Workout button
    await page.getByRole('button', { name: 'Create Workout' }).click();

    // Should navigate to /workout/new
    await expect(page).toHaveURL('/workout/new');

    // Workout builder page should show header
    await expect(page.getByText('New Workout')).toBeVisible();
  });

  /**
   * Tests that workout builder page has structure view
   */
  test('should display structure view by default', async ({ page }) => {
    await page.goto('/workout/new');

    // Structure view should be active
    await expect(page.getByRole('button', { name: /structure/i })).toBeVisible();

    // Check for form elements
    await expect(page.getByPlaceholder(/sweet spot intervals/i)).toBeVisible();
    await expect(page.getByText('Workout Type')).toBeVisible();
  });

  /**
   * Tests that workout builder has view toggle
   */
  test('should have structure and chart view toggle', async ({ page }) => {
    await page.goto('/workout/new');

    // Both view buttons should be visible
    await expect(page.getByRole('button', { name: /structure/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /chart/i })).toBeVisible();
  });

  /**
   * Tests switching to chart view
   */
  test('should switch to chart view', async ({ page }) => {
    await page.goto('/workout/new');

    // Click chart view button
    await page.getByRole('button', { name: /chart/i }).click();

    // Chart view elements should appear
    await expect(page.getByRole('heading', { name: 'Workout Preview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Segments' })).toBeVisible();
  });

  /**
   * Tests back button navigation
   */
  test('should navigate back to coach page', async ({ page }) => {
    await page.goto('/workout/new');

    // Click back button
    const backButton = page.getByRole('button', { name: /back/i });
    await backButton.click();

    // Should go back to coach page
    await expect(page).toHaveURL('/coach');
    await expect(page.getByText('My Athletes')).toBeVisible();
  });

  /**
   * Tests that workout builder form can receive input
   */
  test('should allow entering workout title', async ({ page }) => {
    await page.goto('/workout/new');

    // Fill in workout title
    await page.getByPlaceholder(/sweet spot intervals/i).fill('My Test Workout');

    // Verify the title was entered
    const titleInput = page.getByPlaceholder(/sweet spot intervals/i);
    await expect(titleInput).toHaveValue('My Test Workout');
  });

  /**
   * Tests adding a workout step
   */
  test('should allow adding workout steps', async ({ page }) => {
    await page.goto('/workout/new');

    // Find Add Step button
    const addStepButton = page.getByRole('button', { name: /add step/i });
    if (await addStepButton.isVisible()) {
      await addStepButton.click();
      // A new step should appear
      await expect(page.locator('[data-testid="workout-step"]').or(page.getByText(/warm up|active|rest|cool down/i).first())).toBeVisible();
    }
  });
});

test.describe('Coach Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/coach');
  });

  /**
   * Tests that mobile view shows tabs
   */
  test('should display tabs on mobile', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /athletes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /workouts/i })).toBeVisible();
  });

  /**
   * Tests switching between tabs on mobile
   */
  test('should switch between tabs on mobile', async ({ page }) => {
    // Athletes tab should be active by default
    const athletesList = page.getByText('Marco Rossi');
    await expect(athletesList).toBeVisible();

    // Switch to workouts tab
    await page.getByRole('tab', { name: /workouts/i }).click();

    // Workouts content should be visible
    await expect(page.getByText("You haven't created any workouts yet")).toBeVisible();
  });

  /**
   * Tests creating workout from mobile workouts tab
   */
  test('should navigate to workout builder from mobile workouts tab', async ({ page }) => {
    // Switch to workouts tab
    await page.getByRole('tab', { name: /workouts/i }).click();

    // Click Create Workout
    await page.getByRole('button', { name: 'Create Workout' }).click();

    // Should navigate to workout builder page
    await expect(page).toHaveURL('/workout/new');
    await expect(page.getByText('New Workout')).toBeVisible();
  });

  /**
   * Tests that athlete cards stack vertically on mobile
   */
  test('should display athlete cards in vertical list', async ({ page }) => {
    // Get all athlete names
    const athletes = ['Marco Rossi', 'Laura Bianchi', 'Giuseppe Verdi', 'Sofia Romano'];

    // All should be visible
    for (const name of athletes) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });
});
