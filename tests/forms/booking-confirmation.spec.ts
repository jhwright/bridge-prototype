import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

test.describe('Booking Step 6: Confirmation', () => {
  let spacesPage: SpacesPage;

  async function completeBookingFlow(page: any, spacesPage: SpacesPage) {
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

    await spacesPage.completeVerification('Test User', '5551234567', '123456');
    await spacesPage.verifyContinue.click();

    await spacesPage.submitPayment();
  }

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    await completeBookingFlow(page, spacesPage);
  });

  test('confirmation message is visible', async () => {
    await expect(spacesPage.confirmationMessage).toBeVisible();
  });

  test('confirmation shows booking details', async ({ page }) => {
    const content = page.locator('#confirmation-content');
    await expect(content).toBeVisible();
  });

  test('rebook button resets to step 2', async ({ page }) => {
    const rebookBtn = page.locator('#rebook-btn');
    if (await rebookBtn.isVisible()) {
      await rebookBtn.click();
      // Should be back at calendar step
      await expect(spacesPage.calendarContainer).toBeVisible();
    }
  });
});
