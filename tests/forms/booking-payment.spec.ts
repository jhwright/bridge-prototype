import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

test.describe('Booking Step 5: Payment', () => {
  let spacesPage: SpacesPage;

  async function navigateToStep5(page: any, spacesPage: SpacesPage) {
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
  }

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    await navigateToStep5(page, spacesPage);
  });

  test('Stripe card element mounts', async ({ page }) => {
    await expect(page.locator('[data-testid="stripe-card-mock"]')).toBeVisible();
  });

  test('payment summary renders', async () => {
    await expect(spacesPage.paymentSummary).toBeVisible();
  });

  test('payment submit button is visible', async () => {
    await expect(spacesPage.paymentSubmit).toBeVisible();
  });

  test('promo code input is visible', async () => {
    await expect(spacesPage.promoInput).toBeVisible();
  });

  test('applying valid promo code', async () => {
    await spacesPage.applyPromo('TESTCODE');
    // Promo remove button should appear
    await expect(spacesPage.promoRemove).toBeVisible();
  });

  test('removing promo code', async () => {
    await spacesPage.applyPromo('TESTCODE');
    await spacesPage.promoRemove.click();
    // Promo input should be visible again
    await expect(spacesPage.promoInput).toBeVisible();
  });

  test('submitting payment triggers booking API', async ({ page }) => {
    let bookingCalled = false;
    await page.route('**/public/spaces/*/book-api/', async (route) => {
      bookingCalled = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          booking_id: 'booking-test-001',
          stripe_client_secret: 'pi_test_secret_abc123',
          stripe_publishable_key: 'pk_test_mock_key',
          is_self_book: true,
          invoice_number: 'INV-2026-0042',
          pricing: { deposit_amount: 75, balance_due: 225 },
        }),
      });
    });

    await spacesPage.submitPayment();
    await page.waitForTimeout(500);
    expect(bookingCalled).toBe(true);
  });
});
