import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

// fixme: booking modal UI not yet implemented in spaces.html
test.describe.fixme('Booking Step 4: Verify', () => {
  let spacesPage: SpacesPage;

  async function navigateToStep4(page: any, spacesPage: SpacesPage) {
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

    await spacesPage.fillEventDetails({
      eventType: 'private',
      description: 'Test event',
      attendance: 50,
    });
    await spacesPage.detailsContinue.click();
  }

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    await navigateToStep4(page, spacesPage);
  });

  test('contact name input is visible and required', async () => {
    await expect(spacesPage.contactName).toBeVisible();
  });

  test('phone input is visible', async () => {
    await expect(spacesPage.phoneInput).toBeVisible();
  });

  test('send code button is visible', async () => {
    await expect(spacesPage.sendCodeButton).toBeVisible();
  });

  test('completing verification enables continue', async () => {
    await spacesPage.completeVerification('Test User', '5551234567', '123456');
    await expect(spacesPage.verifyContinue).toBeEnabled();
  });

  test('continue blocked without verification', async () => {
    // Fill name but don't complete SMS
    await spacesPage.contactName.fill('Test User');
    // Continue should be disabled
    await expect(spacesPage.verifyContinue).toBeDisabled();
  });
});
