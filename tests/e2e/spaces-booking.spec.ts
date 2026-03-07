import { test, expect } from '../fixtures/test-base';
import { SpaceDetailPage } from '../pages/space-detail-page';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';

/**
 * End-to-end spaces booking flow: spaces.html card → per-space page → booking.
 * Tests the redirect-to-space-page pattern with both self-book and apply paths.
 * Self-book path now returns a portal_url with magic link instead of Stripe payment.
 */

test.describe('Spaces Booking Flow - Card to Per-Space Page', () => {
  test('spaces.html card links to per-space page', async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/spaces.html');
    await page.waitForLoadState('domcontentloaded');

    // Gallery card should link to per-space page
    const galleryCard = page.locator('.bg-white.rounded-xl.shadow-md', { hasText: 'Gallery' });
    const link = galleryCard.locator('a', { hasText: /check availability/i });
    await expect(link).toHaveAttribute('href', /spaces\/gallery\.html/);
  });

  test('clicking Check Availability navigates to per-space page', async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
    await page.goto('/spaces.html');
    await page.waitForLoadState('domcontentloaded');

    const galleryCard = page.locator('.bg-white.rounded-xl.shadow-md', { hasText: 'Gallery' });
    const link = galleryCard.locator('a', { hasText: /check availability/i });
    await link.click();
    await page.waitForLoadState('domcontentloaded');

    // Should be on gallery per-space page
    expect(page.url()).toContain('spaces/gallery.html');
    await expect(page.locator('h1')).toContainText('Gallery');
    await expect(page.locator('#space-calendar')).toBeVisible();
  });
});

test.describe('Spaces Booking Flow - Apply Path (Non-Self-Book)', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    // Non-self-book customer
    const noSelfBook = {
      customer_id: 'cust-test-002',
      self_book: {
        gallery: false, courtyard: false, kitchen: false,
        dance_floor: false, lounge: false,
      },
      incomplete_applications: [],
    };
    await withMocks({ customerPermissions: noSelfBook });
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');
  });

  test('full apply flow: select time → fill form → SMS verify → submit', async ({ page }) => {
    // 1. Select time on calendar
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);
    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    // 2. Invoice modal opens
    await expect(spacePage.invoiceModal).toBeVisible();

    // 3. Click apply, fill form
    await spacePage.applyBtn.click();
    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');
    await spacePage.applyDescription.fill('Birthday celebration');
    await spacePage.applyAttendance.fill('50');

    // 4. SMS verify
    const phoneInput = page.locator('#sms-phone');
    await phoneInput.fill('+15105551234');
    const sendBtn = page.locator('#sms-send-btn');
    await sendBtn.scrollIntoViewIfNeeded();
    await sendBtn.click();
    await page.locator('[data-sms-phase="code"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.evaluate(() => {
      const digits = document.querySelectorAll('.sms-digit') as NodeListOf<HTMLInputElement>;
      const code = '123456';
      digits.forEach((input, i) => {
        input.value = code[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await page.locator('[data-sms-phase="verified"]').waitFor({ state: 'visible', timeout: 10000 });

    // 5. Submit application (non-self-book path)
    await expect(spacePage.submitApplication).toBeEnabled({ timeout: 5000 });
    await spacePage.submitApplication.click();

    // 6. Confirmation shown
    await expect(spacePage.bookingConfirmation).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Spaces Booking Flow - Self-Book with Portal Link', () => {
  let spacePage: SpaceDetailPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    // Default customer-permissions.json has self_book.gallery: true
    await withMocks();
    spacePage = new SpaceDetailPage(page);
    await spacePage.goto('spaces/gallery.html');
  });

  test('full booking flow: select time → fill form → SMS verify → portal link', async ({ page }) => {
    // 1. Select time
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);
    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    // 2. Invoice modal opens
    await expect(spacePage.invoiceModal).toBeVisible();

    // 3. Fill form
    await spacePage.applyBtn.click();
    await spacePage.applyName.fill('Test User');
    await spacePage.applyEmail.fill('test@example.com');
    await spacePage.applyEventType.selectOption('private_party');

    // 4. SMS verify
    const phoneInput = page.locator('#sms-phone');
    await phoneInput.fill('+15105551234');
    const sendBtn = page.locator('#sms-send-btn');
    await sendBtn.scrollIntoViewIfNeeded();
    await sendBtn.click();
    await page.locator('[data-sms-phase="code"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.evaluate(() => {
      const digits = document.querySelectorAll('.sms-digit') as NodeListOf<HTMLInputElement>;
      const code = '123456';
      digits.forEach((input, i) => {
        input.value = code[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await page.locator('[data-sms-phase="verified"]').waitFor({ state: 'visible', timeout: 10000 });

    // 5. Book Now button appears (no Stripe card element)
    await expect(spacePage.paymentSection).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="stripe-card-mock"]')).not.toBeVisible();
    await expect(spacePage.payNowBtn).toBeVisible();
    await expect(spacePage.payNowBtn).toHaveText('Book Now');

    // 6. Click Book Now → confirmation with portal link
    await spacePage.payNowBtn.click();
    await expect(spacePage.bookingConfirmation).toBeVisible({ timeout: 5000 });

    // 7. Confirmation shows portal link with magic link URL
    const portalLink = page.locator('.portal-link');
    await expect(portalLink).toBeVisible();
    await expect(portalLink).toHaveText('Complete Your Booking');
    const href = await portalLink.getAttribute('href');
    expect(href).toContain('/magic-link/');
  });
});
