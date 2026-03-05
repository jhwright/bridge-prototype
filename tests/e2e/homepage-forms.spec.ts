import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';

test.describe('Homepage Forms', () => {
  let indexPage: IndexPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    indexPage = new IndexPage(page);
    await indexPage.goto();
  });

  test.describe('Store Screen - Grab It Forms', () => {
    test.beforeEach(async () => {
      await indexPage.showScreen('store');
    });

    test('unit cards load from API', async () => {
      // Wait for units to render
      await expect(indexPage.unitsDynamic).toBeVisible();
      await expect(indexPage.unitsSpinner).toBeHidden();
    });

    test('grab form submits successfully', async ({ page }) => {
      // Wait for dynamic units to load
      await expect(indexPage.unitsDynamic).toBeVisible();

      // Find first unit card with a grab form
      const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
      await expect(firstCard).toBeVisible();

      const unitId = await firstCard.getAttribute('data-unit-id');
      if (unitId) {
        // Click to expand the card and show grab form
        await firstCard.click();

        // Fill form fields
        await indexPage.fillGrabForm(unitId, {
          name: 'Test User',
          email: 'test@example.com',
          phone: '5551234567',
        });

        // Should show success message
        await expect(indexPage.grabSuccess(unitId)).toBeVisible();
      }
    });

    test('grab form shows error on failure', async ({ page, withMocks: setupMocks }) => {
      await setupMocks();
      await indexPage.goto();
      await indexPage.showScreen('store');
      await expect(indexPage.unitsDynamic).toBeVisible();
      // Register error route AFTER setupMocks so it takes priority (LIFO)
      await page.route('**/api/units/*/apply/', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unit no longer available' }),
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
        await expect(indexPage.grabError(unitId)).toBeVisible();
      }
    });
  });

  test.describe('Gather Screen - SMS Join', () => {
    test.beforeEach(async () => {
      await indexPage.showScreen('gather');
    });

    // fixme: sms-input-row visibility depends on mobile-first layout not active on desktop viewport
    test.fixme('SMS input row is visible', async () => {
      await expect(indexPage.smsInputRow).toBeVisible();
    });
  });

  test.describe('Profile Screen - Login Form', () => {
    test.beforeEach(async () => {
      await indexPage.showScreen('profile');
    });

    test('portal login view is visible', async () => {
      await expect(indexPage.portalLoginView).toBeVisible();
    });

    test('login form exists', async () => {
      await expect(indexPage.loginForm).toBeVisible();
    });
  });
});
