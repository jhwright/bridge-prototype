import { test, expect } from '../fixtures/test-base';

// Helper: open a modal by simulating the openModal() call
async function openBookingModal(page: import('@playwright/test').Page, modalId: string) {
  await page.evaluate((id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  }, modalId);
  // Wait for modal booking JS to initialize the calendar
  await page.waitForTimeout(300);
}

test.describe('Modal Time Grid Structure (Phase 4)', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/index.html');
  });

  test('gallery modal has data-resource-id attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal).toHaveAttribute('data-resource-id', 'b6240b45-54a8-44d5-934e-add2ab04d141');
  });

  test('gallery modal has data-resource-key attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal).toHaveAttribute('data-resource-key', 'gallery');
  });

  test('courtyard modal has data-resource-id attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal).toHaveAttribute('data-resource-id', '2eba6ebb-32e9-41d9-92c0-ba2276514482');
  });

  test('courtyard modal has data-resource-key attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal).toHaveAttribute('data-resource-key', 'courtyard');
  });

  test('kitchen modal has data-resource-id attribute', async ({ page }) => {
    const modal = page.locator('#modal-membership-kitchen');
    await expect(modal).toHaveAttribute('data-resource-id', 'ea5d8524-3777-4d8e-a8dc-868b5c5ab025');
  });

  test('kitchen modal has data-resource-key attribute', async ({ page }) => {
    const modal = page.locator('#modal-membership-kitchen');
    await expect(modal).toHaveAttribute('data-resource-key', 'kitchen');
  });

  test('gallery modal contains booking-cal-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal.locator('.booking-cal-grid')).toBeAttached();
  });

  test('gallery modal contains booking-time-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal.locator('.booking-time-grid')).toBeAttached();
  });

  test('courtyard modal contains booking-cal-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal.locator('.booking-cal-grid')).toBeAttached();
  });

  test('courtyard modal contains booking-time-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal.locator('.booking-time-grid')).toBeAttached();
  });

  test('gallery modal has Continue to Booking button', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal.locator('button:has-text("Continue to Booking")')).toBeAttached();
  });

  test('gallery modal does not have old payment steps', async ({ page }) => {
    // Steps 2 and 3 (payment/confirmation) should be removed
    await expect(page.locator('#gallery-step-2')).not.toBeAttached();
    await expect(page.locator('#gallery-step-3')).not.toBeAttached();
  });

  test('courtyard modal does not have old payment steps', async ({ page }) => {
    await expect(page.locator('#outdoor-step-2')).not.toBeAttached();
    await expect(page.locator('#outdoor-step-3')).not.toBeAttached();
  });

  test('gallery modal has data-space-page attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-gallery');
    await expect(modal).toHaveAttribute('data-space-page', 'spaces/gallery.html');
  });

  test('courtyard modal has data-space-page attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal).toHaveAttribute('data-space-page', 'spaces/courtyard.html');
  });

  test('kitchen modal has data-space-page attribute', async ({ page }) => {
    const modal = page.locator('#modal-membership-kitchen');
    await expect(modal).toHaveAttribute('data-space-page', 'spaces/kitchen.html');
  });

  test('lounge modal has data-resource-id attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal).toHaveAttribute('data-resource-id', 'c8f89097-3719-49b5-9d31-40d61d9757f0');
  });

  test('lounge modal has data-resource-key attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal).toHaveAttribute('data-resource-key', 'lounge');
  });

  test('lounge modal has data-space-page attribute', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal).toHaveAttribute('data-space-page', 'spaces/lounge.html');
  });

  test('lounge modal contains booking-cal-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal.locator('.booking-cal-grid')).toBeAttached();
  });

  test('lounge modal contains booking-time-grid container', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal.locator('.booking-time-grid')).toBeAttached();
  });

  test('lounge modal has Continue to Booking button', async ({ page }) => {
    const modal = page.locator('#modal-booking-lounge');
    await expect(modal.locator('button:has-text("Continue to Booking")')).toBeAttached();
  });
});

test.describe('Modal Booking Calendar Interaction (Phase 5)', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/index.html');
  });

  test('opening gallery modal renders month calendar', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Should have day cells rendered
    await expect(modal.locator('.booking-cal-grid .cal-day').first()).toBeVisible();
    // Should have month navigation
    await expect(modal.locator('.cal-month')).toBeVisible();
  });

  test('month calendar shows current month name', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const monthLabel = page.locator('#modal-booking-gallery .cal-month span');
    // Should display "March 2026" (test date is 2026-03-05)
    await expect(monthLabel).toContainText('March 2026');
  });

  test('clicking a date renders time grid slots', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click a future available day (e.g. day 10)
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    // Time grid slots should appear
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    await expect(slots.first()).toBeVisible();
  });

  test('time grid has 30-min increments from opening to closing', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click a date with no bookings
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    // space-options.json: opening_time 08:00, closing_time 23:00 = 15 hours * 2 = 30 slots
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    await expect(slots).toHaveCount(30);
  });

  test('booked slots shown as unavailable on day with bookings', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Mock calendar has evt-001 on March 15 (18:00-21:00 = 6 slots)
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '15' }).click();
    await page.waitForTimeout(200);
    const bookedSlots = modal.locator('.booking-time-grid .time-grid-slot.booked');
    // 18:00-21:00 = 6 half-hour slots
    await expect(bookedSlots).toHaveCount(6);
  });

  test('existing bookings display event type and title', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click March 15 which has "Dance Class: Friday Salsa"
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '15' }).click();
    await page.waitForTimeout(200);
    const bookedSlot = modal.locator('.booking-time-grid .time-grid-slot.booked').first();
    await expect(bookedSlot).toContainText('Dance Class: Friday Salsa');
  });

  test('days with bookings show event dot indicators', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // March 15 has an event — should have an event-dot
    const day15 = modal.locator('.booking-cal-grid .cal-day:not(.header)').filter({ hasText: '15' });
    await expect(day15.locator('.event-dot')).toBeVisible();
  });

  test('drag-select highlights time range', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click day 10 (no bookings)
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    // Drag-select: mousedown on slot index 4 (10:00), mousemove to slot 7 (11:30), mouseup
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    const startSlot = slots.nth(4);
    const endSlot = slots.nth(7);
    await startSlot.dispatchEvent('mousedown');
    await endSlot.dispatchEvent('mouseover');
    await endSlot.dispatchEvent('mouseup');
    // 4 slots should be selected (10:00, 10:30, 11:00, 11:30)
    const selected = modal.locator('.booking-time-grid .time-grid-slot.selected');
    await expect(selected).toHaveCount(4);
  });

  test('drag-select cannot cross booked slots', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click March 15 (has booking 18:00-21:00)
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '15' }).click();
    await page.waitForTimeout(200);
    // Try to drag from 17:00 (slot 18) across booked 18:00 (slot 20) to 19:00 (slot 22)
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    const startSlot = slots.nth(18); // 17:00
    const endSlot = slots.nth(22);   // 19:00 (booked)
    await startSlot.dispatchEvent('mousedown');
    await endSlot.dispatchEvent('mouseover');
    await endSlot.dispatchEvent('mouseup');
    // Selection should clamp before the booked slot — only 17:00 and 17:30 selected
    const selected = modal.locator('.booking-time-grid .time-grid-slot.selected');
    const count = await selected.count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test('continue button enables after selection and redirects', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Click day 10
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    // Select a range
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    await slots.nth(4).dispatchEvent('mousedown');
    await slots.nth(7).dispatchEvent('mouseover');
    await slots.nth(7).dispatchEvent('mouseup');
    // Continue button should be enabled
    const btn = modal.locator('.btn-continue-booking');
    await expect(btn).toBeEnabled();
    // Click and check navigation
    const [response] = await Promise.all([
      page.waitForURL(/spaces\/gallery\.html\?date=.*&start=.*&end=.*/),
      btn.click(),
    ]);
  });

  test('courtyard modal also initializes calendar on open', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-outdoor');
    const modal = page.locator('#modal-booking-outdoor');
    await expect(modal.locator('.booking-cal-grid .cal-day').first()).toBeVisible();
  });
});

test.describe('Gallery Modal Cleanup (PR1)', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/index.html');
  });

  test('warrior SVG and gallery config preview are removed', async ({ page }) => {
    await expect(page.locator('#gallery-config-preview')).not.toBeAttached();
  });

  test('gallery room configuration select is removed', async ({ page }) => {
    await expect(page.locator('#gallery-config')).not.toBeAttached();
  });
});

test.describe('Calendar Collapse on Date Selection (PR1)', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    await page.goto('/index.html');
  });

  test('clicking a date collapses the calendar grid', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    const calGrid = modal.locator('.booking-cal-grid');
    // Click a future day
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    await expect(calGrid).toHaveClass(/collapsed/);
  });

  test('selected date bar appears after date selection', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    const dateBar = modal.locator('.selected-date-bar');
    await expect(dateBar).toBeVisible();
    // Should contain the date text
    await expect(dateBar).toContainText('Mar');
    await expect(dateBar).toContainText('10');
  });

  test('selected date bar has a Change link', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    const changeLink = modal.locator('.selected-date-bar .change-date-link');
    await expect(changeLink).toBeVisible();
    await expect(changeLink).toContainText('Change');
  });

  test('clicking Change re-expands the calendar', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    const calGrid = modal.locator('.booking-cal-grid');
    // Select a date
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    await expect(calGrid).toHaveClass(/collapsed/);
    // Click Change
    await modal.locator('.selected-date-bar .change-date-link').click();
    await page.waitForTimeout(200);
    // Calendar should be expanded again
    await expect(calGrid).not.toHaveClass(/collapsed/);
  });

  test('clicking Change hides the date bar', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    await modal.locator('.selected-date-bar .change-date-link').click();
    await page.waitForTimeout(200);
    await expect(modal.locator('.selected-date-bar')).not.toBeVisible();
  });

  test('clicking Change clears time selection', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    // Select date and time
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    const slots = modal.locator('.booking-time-grid .time-grid-slot');
    await slots.nth(4).dispatchEvent('mousedown');
    await slots.nth(7).dispatchEvent('mouseover');
    await slots.nth(7).dispatchEvent('mouseup');
    // Click Change
    await modal.locator('.selected-date-bar .change-date-link').click();
    await page.waitForTimeout(200);
    // Time grid should be cleared
    const timeGrid = modal.locator('.booking-time-grid');
    await expect(timeGrid).toBeEmpty();
  });

  test('cal-legend is hidden when calendar is collapsed', async ({ page }) => {
    await openBookingModal(page, 'modal-booking-gallery');
    const modal = page.locator('#modal-booking-gallery');
    await modal.locator('.booking-cal-grid .cal-day:not(.header):not(.past)').filter({ hasText: '10' }).click();
    await page.waitForTimeout(200);
    const legend = modal.locator('.cal-legend');
    await expect(legend).not.toBeVisible();
  });
});
