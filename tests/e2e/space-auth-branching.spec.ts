import { test, expect } from '../fixtures/test-base';
import { SpaceDetailPage } from '../pages/space-detail-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import { mockStripe } from '../helpers/stripe-mock';

/**
 * Phase 7: Auth branching tests for per-space booking flow.
 * After SMS verify + permissions check:
 * - Self-book customers see Stripe payment form
 * - Non-self-book customers see "Apply for This Time" button
 */

// Helper: open invoice modal with a time selection on gallery page
async function openGalleryInvoice(page: import('@playwright/test').Page) {
  await page.locator('[data-testid="fullcalendar-mock"]').waitFor();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(17, 0, 0, 0);
  await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());
}

// Helper: complete SMS verification flow
async function completeSmsVerify(page: import('@playwright/test').Page) {
  // Enter phone number
  const phoneInput = page.locator('#sms-phone');
  await phoneInput.fill('+15105551234');

  // Click send and wait for code phase
  const sendBtn = page.locator('#sms-send-btn');
  await sendBtn.scrollIntoViewIfNeeded();
  await sendBtn.click();

  // Wait for code entry phase
  await page.locator('[data-sms-phase="code"]').waitFor({ state: 'visible', timeout: 10000 });

  // Fill 6 digit inputs via evaluate to trigger input events properly
  await page.evaluate(() => {
    const digits = document.querySelectorAll('.sms-digit') as NodeListOf<HTMLInputElement>;
    const code = '123456';
    digits.forEach((input, i) => {
      input.value = code[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // Wait for auto-submit to complete and show verified state
  await page.locator('[data-sms-phase="verified"]').waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Self-Book Customer - Payment Flow', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    // Default customer-permissions.json has self_book.gallery: true
    await withMocks();
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');
  });

  test('self-book customer sees payment section after SMS verify', async ({ page }) => {
    await openGalleryInvoice(page);
    await expect(spacePage.invoiceModal).toBeVisible();

    // Click apply to reveal the form
    await spacePage.applyBtn.click();
    await expect(spacePage.applyForm).toBeVisible();

    // Fill required fields
    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');

    // Complete SMS verification (triggers permissions check)
    await completeSmsVerify(page);

    // After SMS verify, payment section should appear for self-book customer
    await expect(spacePage.paymentSection).toBeVisible({ timeout: 5000 });
    // Stripe card mock should be mounted
    await expect(page.locator('[data-testid="stripe-card-mock"]')).toBeVisible();
    // Pay Now button should be visible
    await expect(spacePage.payNowBtn).toBeVisible();
  });

  test('payment section has Stripe card element mounted in container', async ({ page }) => {
    await openGalleryInvoice(page);
    await expect(spacePage.invoiceModal).toBeVisible();

    // Click apply and fill form
    await spacePage.applyBtn.click();
    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');

    // SMS verify
    await completeSmsVerify(page);

    await expect(spacePage.paymentSection).toBeVisible({ timeout: 5000 });
    // Stripe card element should be inside the container
    const stripeCard = page.locator('#stripe-card-container [data-testid="stripe-card-mock"]');
    await expect(stripeCard).toBeVisible();
  });
});

test.describe('Non-Self-Book Customer - Apply Flow', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    // Override permissions to no-self-book variant
    const noSelfBook = {
      customer_id: 'cust-test-002',
      self_book: {
        gallery: false, courtyard: false, kitchen: false,
        dance_floor: false, lounge: false,
      },
      incomplete_applications: ['gallery'],
    };
    await withMocks({ customerPermissions: noSelfBook });
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');
  });

  test('non-self-book customer sees apply button, not payment', async ({ page }) => {
    await openGalleryInvoice(page);
    await expect(spacePage.invoiceModal).toBeVisible();

    // Click apply
    await spacePage.applyBtn.click();
    await expect(spacePage.applyForm).toBeVisible();

    // Fill form
    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');

    // SMS verify
    await completeSmsVerify(page);

    // Payment section should stay hidden for non-self-book customer
    await expect(spacePage.paymentSection).toBeHidden();
    // Submit application button should remain visible
    await expect(spacePage.submitApplication).toBeVisible();
  });

  test('non-self-book customer can submit application', async ({ page }) => {
    await openGalleryInvoice(page);
    await spacePage.applyBtn.click();

    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');
    await spacePage.applyDescription.fill('Birthday party');
    await spacePage.applyAttendance.fill('50');

    // SMS verify
    await completeSmsVerify(page);

    // Submit application should be enabled after SMS verify
    await expect(spacePage.submitApplication).toBeEnabled({ timeout: 5000 });
    await spacePage.submitApplication.click();

    // Should show confirmation
    await expect(spacePage.bookingConfirmation).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Payment Section HTML Structure', () => {
  test('gallery page has payment section elements', async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await mockStripe(page);
    await withMocks();
    const spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');

    // Payment section should exist in DOM (hidden by default)
    await expect(spacePage.paymentSection).toBeAttached();
    await expect(spacePage.stripeCardContainer).toBeAttached();
    await expect(spacePage.payNowBtn).toBeAttached();
    await expect(spacePage.paymentError).toBeAttached();
  });

  test('gallery page has data-resource-key attribute', async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    await page.goto('/spaces/gallery.html');
    await page.waitForLoadState('domcontentloaded');

    const calEl = page.locator('#space-calendar');
    await expect(calEl).toHaveAttribute('data-resource-key', 'gallery');
  });

  test('dance-floor page has data-resource-key attribute', async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    await page.goto('/spaces/dance-floor.html');
    await page.waitForLoadState('domcontentloaded');

    const calEl = page.locator('#space-calendar');
    await expect(calEl).toHaveAttribute('data-resource-key', 'dance_floor');
  });
});
