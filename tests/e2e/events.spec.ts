import { test, expect } from '../fixtures/test-base';
import { EventsPage } from '../pages/events-page';

test.describe('Events Page', () => {
  let eventsPage: EventsPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
  });

  test('page renders with nav and footer', async () => {
    await expect(eventsPage.nav).toBeVisible();
    await expect(eventsPage.footer).toBeVisible();
  });

  test('events list is visible', async () => {
    await expect(eventsPage.eventsList).toBeVisible();
  });

  test('event cards render', async () => {
    const count = await eventsPage.eventCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('SMS phone input is visible', async () => {
    await expect(eventsPage.smsPhoneInput).toBeVisible();
  });

  test('SMS join button is visible', async () => {
    await expect(eventsPage.smsJoinButton).toBeVisible();
  });

  test('SMS join form submits', async () => {
    await eventsPage.joinViaSms('5551234567');
    // Should trigger SMS send API (mocked)
  });
});
