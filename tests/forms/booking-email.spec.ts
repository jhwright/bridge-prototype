import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

// fixme: booking modal UI not yet implemented in spaces.html
test.describe.fixme('Booking Step 1: Email', () => {
  let spacesPage: SpacesPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();

    // Open booking modal
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }
  });

  test('email input is visible', async () => {
    await expect(spacesPage.emailInput).toBeVisible();
  });

  test('email submit button is visible', async () => {
    await expect(spacesPage.emailSubmit).toBeVisible();
  });

  test('valid email advances to step 2', async () => {
    await spacesPage.submitEmail('user@example.com');
    await expect(spacesPage.calendarContainer).toBeVisible();
  });

  test('empty email submission is blocked', async ({ page }) => {
    await spacesPage.emailSubmit.click();
    // Should still be on step 1
    await expect(spacesPage.emailInput).toBeVisible();
  });
});
