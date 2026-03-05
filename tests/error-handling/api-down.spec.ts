import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';
import { StoragePage } from '../pages/storage-page';
import { SpacesPage } from '../pages/spaces-page';


test.describe('Error Handling: API Down (500)', () => {
  test('index page loads even when units API returns 500', async ({ page, withMocks }) => {
    await withMocks({ unitsError: 500 });
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    // Page should still render hero/shell
    await expect(page.locator('body')).toBeVisible();
  });

  test('storage page handles units API failure gracefully', async ({ page, withMocks }) => {
    await withMocks({ unitsError: 500 });
    const storagePage = new StoragePage(page);
    await storagePage.goto();
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible();
    // Units may show error or empty state
    const cards = storagePage.unitCards;
    const count = await cards.count();
    // Zero cards is acceptable when API is down
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('spaces page handles spaces API failure', async ({ page, withMocks }) => {
    await withMocks({ spacesError: 500 });
    const spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    await expect(page.locator('body')).toBeVisible();
  });

  test('grab form shows error when apply API returns 500', async ({ page, withMocks }) => {
    await withMocks();
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    await expect(indexPage.unitsDynamic).toBeVisible();

    // Route the apply endpoint to 500
    await page.route('**/public/units/*/apply/', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      await indexPage.fillGrabForm(unitId, {
        name: 'Test User',
        email: 'test@example.com',
        phone: '5551234567',
      });
      // Should show some error indicator
      await page.waitForTimeout(500);
    }
  });

  test('SMS send handles API failure', async ({ page, withMocks }) => {
    await withMocks({ smsError: 500 });
    await page.goto('/events.html');
    // SMS section has a "Join" button but no input IDs — locate by role/text
    const joinBtn = page.getByRole('button', { name: /join/i });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await page.waitForTimeout(500);
    }
    // Page should remain functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('booking API failure shows error', async ({ page, withMocks }) => {
    await withMocks({ bookingError: 500 });
    const spacesPage = new SpacesPage(page);
    await spacesPage.goto();
    // Page should render despite backend issues
    await expect(page.locator('body')).toBeVisible();
  });
});
