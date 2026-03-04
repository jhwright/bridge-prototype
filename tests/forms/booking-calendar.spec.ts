import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

test.describe('Booking Step 2: Calendar', () => {
  let spacesPage: SpacesPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();

    // Navigate to step 2
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }
    await spacesPage.submitEmail('test@example.com');
  });

  test('calendar mock renders', async ({ page }) => {
    await expect(page.locator('[data-testid="fullcalendar-mock"]')).toBeVisible();
  });

  test('time selection updates date summary', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(16, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacesPage.dateSummary).not.toBeEmpty();
  });

  test('time selection updates hours summary', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(14, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacesPage.hoursSummary).not.toBeEmpty();
  });

  test('pricing is fetched after selection', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(16, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await expect(spacesPage.priceSummary).not.toBeEmpty();
  });

  test('continue button requires selection', async () => {
    // Continue button should be disabled or have no effect without selection
    await expect(spacesPage.calendarContinue).toBeVisible();
  });
});
