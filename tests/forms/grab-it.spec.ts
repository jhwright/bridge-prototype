import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';

test.describe('Grab It Forms', () => {
  let indexPage: IndexPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    // Wait for units to load
    await expect(indexPage.unitsDynamic).toBeVisible();
  });

  test('unit cards render with grab forms', async ({ page }) => {
    const unitCards = indexPage.unitsDynamic.locator('.unit-card');
    const count = await unitCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('grab form has name field', async ({ page }) => {
    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      // Click "Grab It!" button to show the hidden grab form
      const grabBtn = indexPage.unitCard(unitId).locator('button[onclick*="toggleGrabForm"]');
      await grabBtn.click();
      const nameInput = indexPage.unitCard(unitId).locator('.grab-name');
      await expect(nameInput).toBeVisible();
    }
  });

  test('grab form has email field', async ({ page }) => {
    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      const grabBtn = indexPage.unitCard(unitId).locator('button[onclick*="toggleGrabForm"]');
      await grabBtn.click();
      const emailInput = indexPage.unitCard(unitId).locator('.grab-email');
      await expect(emailInput).toBeVisible();
    }
  });

  test('grab form has phone field', async ({ page }) => {
    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      const grabBtn = indexPage.unitCard(unitId).locator('button[onclick*="toggleGrabForm"]');
      await grabBtn.click();
      const phoneInput = indexPage.unitCard(unitId).locator('.grab-phone');
      await expect(phoneInput).toBeVisible();
    }
  });

  test('successful submit shows confirmation', async ({ page }) => {
    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      await indexPage.fillGrabForm(unitId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5559876543',
      });
      await expect(indexPage.grabSuccess(unitId)).toBeVisible();
    }
  });

  test('submit calls POST to unit apply API', async ({ page }) => {
    let apiCalled = false;
    let requestBody: any;
    await page.route('**/api/units/*/apply/', async (route) => {
      apiCalled = true;
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Application submitted' }),
      });
    });

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      await indexPage.fillGrabForm(unitId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5559876543',
      });
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(true);
    }
  });

  test('error response shows error message', async ({ page, withMocks: setupMocks }) => {
    await setupMocks({
      unitApply: { success: false, error: 'Unit no longer available' },
    });
    await indexPage.goto();
    await indexPage.showScreen('store');
    await expect(indexPage.unitsDynamic).toBeVisible();

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      await indexPage.fillGrabForm(unitId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5559876543',
      });
      await expect(indexPage.grabError(unitId)).toBeVisible();
    }
  });
});
