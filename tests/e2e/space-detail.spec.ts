import { test, expect } from '../fixtures/test-base';
import { SpaceDetailPage } from '../pages/space-detail-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';

test.describe('Per-Space Detail Page', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/dance-floor.html');
  });

  test('page renders with space name and nav', async () => {
    await expect(spacePage.nav).toBeVisible();
    await expect(spacePage.footer).toBeVisible();
    await expect(spacePage.spaceName).toHaveText('Sprung Dance Floor');
  });

  test('shows pricing info', async () => {
    await expect(spacePage.spacePrice).toContainText('$75/hr');
  });

  test('back link navigates to spaces list', async () => {
    await expect(spacePage.backLink).toBeVisible();
    await expect(spacePage.backLink).toHaveAttribute('href', /spaces\.html/);
  });

  test('calendar container renders', async () => {
    await expect(spacePage.availabilityHeading).toBeVisible();
    await expect(spacePage.calendarContainer).toBeVisible();
  });

  test('calendar hint is shown', async () => {
    await expect(spacePage.calendarHint).toBeVisible();
  });

  test('calendar mock loads events from API', async ({ page }) => {
    // The mock FullCalendar fetches from the calendar.json endpoint
    const calEl = page.locator('[data-testid="fullcalendar-mock"]');
    await expect(calEl).toBeVisible();
  });

  test('drag-select opens invoice modal with pricing', async ({ page }) => {
    // Wait for calendar to render
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    // Simulate a time selection (tomorrow 2pm-5pm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    // Invoice modal should appear
    await expect(spacePage.invoiceModal).toBeVisible();
    // Summary should show space name
    await expect(spacePage.invoiceSummary).toContainText('Sprung Dance Floor');
    // Pricing lines should populate
    await expect(spacePage.pricingLines).not.toBeEmpty();
  });

  test('invoice modal shows add-on options from API', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    await expect(spacePage.invoiceModal).toBeVisible();
    // Should show add-on options rendered from options.json mock
    await expect(spacePage.addonOptions).not.toBeEmpty();
    // Bar Service select should be present
    await expect(page.locator('[data-addon-key="bar_service"]')).toBeVisible();
  });

  test('pricing shows base rental and deposit', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    await expect(spacePage.pricingLines).toContainText('Base rental');
    await expect(spacePage.pricingLines).toContainText('Deposit');
  });

  test('apply button appears after pricing loads', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    await expect(spacePage.applyBtn).toBeVisible();
  });

  test('clicking Apply reveals application form', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await spacePage.applyBtn.click();

    await expect(spacePage.applyForm).toBeVisible();
    await expect(spacePage.applyName).toBeVisible();
    await expect(spacePage.applyEmail).toBeVisible();
    await expect(spacePage.applyEventType).toBeVisible();
  });

  test('closing modal hides it', async ({ page }) => {
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacePage.invoiceModal).toBeVisible();

    await spacePage.invoiceClose.click();
    await expect(spacePage.invoiceModal).toBeHidden();
  });
});

test.describe('Per-Space Detail - Courtyard', () => {
  test('courtyard page renders correctly', async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    const spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/courtyard.html');

    await expect(spacePage.spaceName).toHaveText('Outdoor Space & Courtyard');
    await expect(spacePage.spacePrice).toContainText('$50/hr');
    await expect(spacePage.calendarContainer).toBeVisible();
  });
});

test.describe('URL Param Auto-Open (Phase 6)', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
  });

  test('URL params auto-open invoice modal', async ({ page }) => {
    await page.goto('/spaces/gallery.html?date=2026-03-10&start=14:00&end=16:00');
    await page.waitForTimeout(500);
    const spacePage = new SpaceDetailPage(page);
    await expect(spacePage.invoiceModal).toBeVisible();
  });

  test('URL params set correct time selection in summary', async ({ page }) => {
    await page.goto('/spaces/gallery.html?date=2026-03-10&start=14:00&end=16:00');
    await page.waitForTimeout(500);
    const spacePage = new SpaceDetailPage(page);
    await expect(spacePage.invoiceSummary).toContainText('2:00');
    await expect(spacePage.invoiceSummary).toContainText('4:00');
  });

  test('URL params cleaned after modal opens', async ({ page }) => {
    await page.goto('/spaces/gallery.html?date=2026-03-10&start=14:00&end=16:00');
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).not.toContain('date=');
    expect(url).not.toContain('start=');
    expect(url).not.toContain('end=');
  });
});

test.describe('Spaces List - Card Links', () => {
  test('dance floor card links to per-space page', async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/spaces.html');
    await page.waitForLoadState('domcontentloaded');

    const danceCard = page.locator('.bg-white.rounded-xl.shadow-md', { hasText: 'Sprung Dance Floor' });
    const link = danceCard.locator('a', { hasText: 'Check Availability' });
    await expect(link).toHaveAttribute('href', 'spaces/dance-floor.html');
  });

  test('courtyard card links to per-space page', async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/spaces.html');
    await page.waitForLoadState('domcontentloaded');

    const courtyardCard = page.locator('.bg-white.rounded-xl.shadow-md', { hasText: 'Outdoor Space & Courtyard' });
    const link = courtyardCard.locator('a', { hasText: 'Check Availability' });
    await expect(link).toHaveAttribute('href', 'spaces/courtyard.html');
  });
});
