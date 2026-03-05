import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';
import { StoragePage } from '../pages/storage-page';

test.describe('Error Handling: Network Errors', () => {
  test('index page handles network failure on units fetch', async ({ page, withMocks }) => {
    await withMocks({ networkError: true });
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    // Page shell should still render
    await expect(page.locator('body')).toBeVisible();
  });

  test('storage page handles network failure', async ({ page, withMocks }) => {
    await withMocks({ networkError: true });
    const storagePage = new StoragePage(page);
    await storagePage.goto();
    await expect(page.locator('body')).toBeVisible();
  });

  test('page recovers from offline state', async ({ page, withMocks }) => {
    await withMocks();
    const indexPage = new IndexPage(page);
    await indexPage.goto();

    // Go offline
    await page.context().setOffline(true);
    // Attempt navigation
    try {
      await page.goto('/storage.html', { timeout: 3000 });
    } catch {
      // Expected to fail while offline
    }

    // Come back online
    await page.context().setOffline(false);
    await page.goto('/storage.html');
    await expect(page.locator('body')).toBeVisible();
  });

  test('fetch abort does not crash page', async ({ page, withMocks }) => {
    await withMocks();
    // Intercept and abort a request
    await page.route('**/api/units/available*', (route) => route.abort());
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
