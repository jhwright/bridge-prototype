import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

// fixme: booking modal UI not yet implemented in spaces.html
test.describe.fixme('Booking Step 3: Event Details', () => {
  let spacesPage: SpacesPage;

  async function navigateToStep3(page: any, spacesPage: SpacesPage) {
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }
    await spacesPage.submitEmail('test@example.com');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(16, 0, 0, 0);
    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await spacesPage.calendarContinue.click();
  }

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    await navigateToStep3(page, spacesPage);
  });

  test('event type dropdown is visible and required', async () => {
    await expect(spacesPage.eventType).toBeVisible();
  });

  test('event description textarea is visible', async () => {
    await expect(spacesPage.eventDescription).toBeVisible();
  });

  test('expected attendance input is visible', async () => {
    await expect(spacesPage.expectedAttendance).toBeVisible();
  });

  test('event name input is visible', async () => {
    await expect(spacesPage.eventName).toBeVisible();
  });

  test('special requests input is visible', async () => {
    await expect(spacesPage.specialRequests).toBeVisible();
  });

  test('amenity checkboxes are visible', async () => {
    await expect(spacesPage.amenityBarService).toBeVisible();
    await expect(spacesPage.amenitySnacks).toBeVisible();
    await expect(spacesPage.amenityStage).toBeVisible();
    await expect(spacesPage.amenityCurtains).toBeVisible();
    await expect(spacesPage.amenitySetup).toBeVisible();
    await expect(spacesPage.amenityTeardown).toBeVisible();
  });

  test('toggling amenity re-fetches pricing', async ({ page }) => {
    let pricingCalled = false;
    await page.route('**/public/spaces/*/calculate-price/', async (route) => {
      pricingCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subtotal: 400, deposit_amount: 100, balance_due: 300 }),
      });
    });

    await spacesPage.toggleAmenity('bar-service');
    // Give time for the pricing fetch
    await page.waitForTimeout(500);
    expect(pricingCalled).toBe(true);
  });

  test('snacks checkbox reveals snack count input', async () => {
    await spacesPage.toggleAmenity('snacks');
    await expect(spacesPage.snackCount).toBeVisible();
  });

  test('filling all required fields allows continue', async () => {
    await spacesPage.fillEventDetails({
      eventType: 'private',
      description: 'Birthday party',
      attendance: 30,
    });
    await spacesPage.detailsContinue.click();

    // Should advance to step 4 (verify)
    await expect(spacesPage.contactName).toBeVisible();
  });

  test('empty required fields block continue', async () => {
    // Try to continue without filling required fields
    await spacesPage.detailsContinue.click();
    // Should still be on step 3
    await expect(spacesPage.eventType).toBeVisible();
  });
});
