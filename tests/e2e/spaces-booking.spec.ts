import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

// fixme: booking modal UI not yet implemented in spaces.html
test.describe.fixme('Spaces Booking Flow', () => {
  let spacesPage: SpacesPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
  });

  test('booking modal opens on Check Availability click', async ({ page }) => {
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
      await expect(spacesPage.bookingModal).toBeVisible();
    }
  });

  test('Step 1: email submission advances to step 2', async ({ page }) => {
    // Open booking modal
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }

    await spacesPage.submitEmail('test@example.com');

    // Step 2 calendar should be visible
    await expect(spacesPage.calendarContainer).toBeVisible();
  });

  test('Step 2: calendar renders and selection updates summary', async ({ page }) => {
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }
    await spacesPage.submitEmail('test@example.com');

    // Calendar mock should render
    await expect(page.locator('[data-testid="fullcalendar-mock"]')).toBeVisible();

    // Simulate a time selection (tomorrow 2pm-4pm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(16, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    // Summary should update
    await expect(spacesPage.dateSummary).not.toBeEmpty();
  });

  test('Step 3: event details form has required fields', async ({ page }) => {
    // Navigate to step 3 by completing steps 1-2
    const firstCard = spacesPage.spaceCards.first();
    const heading = await firstCard.locator('h3, h2').first().textContent();
    if (heading) {
      await spacesPage.checkAvailability(heading.trim());
    }
    await spacesPage.submitEmail('test@example.com');

    // Simulate calendar selection
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(16, 0, 0, 0);
    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
    await spacesPage.calendarContinue.click();

    // Step 3 fields should be visible
    await expect(spacesPage.eventType).toBeVisible();
    await expect(spacesPage.eventDescription).toBeVisible();
  });

  test('Step 4: verification requires contact name and SMS', async ({ page }) => {
    // Navigate to step 4
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

    // Fill details
    await spacesPage.fillEventDetails({
      eventType: 'private',
      description: 'Test event',
      attendance: 50,
    });
    await spacesPage.detailsContinue.click();

    // Step 4 fields should be visible
    await expect(spacesPage.contactName).toBeVisible();
    await expect(spacesPage.phoneInput).toBeVisible();
  });

  test('Step 5: payment form renders with Stripe', async ({ page }) => {
    // Navigate to step 5
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

    // Stripe card element should mount
    await expect(page.locator('[data-testid="stripe-card-mock"]')).toBeVisible();
    await expect(spacesPage.paymentSubmit).toBeVisible();
  });

  test('Step 6: confirmation displays after payment', async ({ page }) => {
    // Full booking flow
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

    // Confirmation should be visible
    await expect(spacesPage.confirmationMessage).toBeVisible();
  });
});
