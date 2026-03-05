import { test, expect } from '../fixtures/test-base';
import { SpaceDetailPage } from '../pages/space-detail-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';

/**
 * Per-space calendar booking tests for gallery and kitchen pages.
 * Complements space-detail.spec.ts (which covers dance-floor).
 */

test.describe('Gallery Page - Calendar Booking', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');
  });

  test('page renders with space name', async () => {
    await expect(spacePage.spaceName).toContainText('Gallery');
  });

  test('calendar container has resource attributes', async ({ page }) => {
    const calEl = page.locator('#space-calendar');
    await expect(calEl).toHaveAttribute('data-resource-id', 'b6240b45-54a8-44d5-934e-add2ab04d141');
    await expect(calEl).toHaveAttribute('data-resource-key', 'gallery');
  });

  test('calendar renders and hint shows', async () => {
    await expect(spacePage.calendarContainer).toBeVisible();
    await expect(spacePage.calendarHint).toBeVisible();
  });

  test('drag-select opens invoice modal', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacePage.invoiceModal).toBeVisible();
    await expect(spacePage.pricingLines).not.toBeEmpty();
  });

  test('invoice modal shows add-ons from API', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacePage.addonOptions).not.toBeEmpty();
  });
});

test.describe('Kitchen Page - Calendar Booking', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/kitchen.html');
  });

  test('page renders with space name', async () => {
    await expect(spacePage.spaceName).toContainText('Commercial Kitchen');
  });

  test('calendar container has resource attributes', async ({ page }) => {
    const calEl = page.locator('#space-calendar');
    await expect(calEl).toHaveAttribute('data-resource-id', '78ee7c4b-318b-4a93-9bdf-d98664d385ed');
    await expect(calEl).toHaveAttribute('data-resource-key', 'kitchen');
  });

  test('drag-select opens invoice modal with pricing', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(13, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacePage.invoiceModal).toBeVisible();
    await expect(spacePage.pricingLines).toContainText('Base rental');
    await expect(spacePage.pricingLines).toContainText('Deposit');
  });

  test('apply flow works on kitchen page', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(13, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await spacePage.applyBtn.click();

    await expect(spacePage.applyForm).toBeVisible();
    await expect(spacePage.applyName).toBeVisible();
    await expect(spacePage.applyEmail).toBeVisible();
    await expect(spacePage.applyEventType).toBeVisible();
  });
});
