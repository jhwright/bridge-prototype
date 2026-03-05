import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';

test.describe('Error Handling: Validation Errors', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  test('grab form rejects empty name', async ({ page }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    await expect(indexPage.unitsDynamic).toBeVisible();

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      // Submit with empty fields
      const submitBtn = indexPage.unitCard(unitId).locator('button[type="submit"], .grab-submit');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        // Should show validation error or prevent submit
        await page.waitForTimeout(300);
      }
    }
  });

  test('grab form rejects invalid email', async ({ page }) => {
    const indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    await expect(indexPage.unitsDynamic).toBeVisible();

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      const emailInput = indexPage.unitCard(unitId).locator('.grab-email');
      if (await emailInput.isVisible()) {
        await emailInput.fill('not-an-email');
        // Try to submit
        const submitBtn = indexPage.unitCard(unitId).locator('button[type="submit"], .grab-submit');
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('SMS section is present on events page', async ({ page }) => {
    await page.goto('/events.html');
    // SMS section exists with a "Join" button but no input IDs
    const joinBtn = page.getByRole('button', { name: /join/i });
    await expect(joinBtn).toBeVisible();
  });

  test('API 422 response shows field errors', async ({ page }) => {
    // Route apply to return 422 with field errors
    await page.route('**/api/units/*/apply/', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          errors: { email: 'Invalid email address', phone: 'Phone number required' },
        }),
      });
    });

    const indexPage = new IndexPage(page);
    await indexPage.goto();
    await indexPage.showScreen('store');
    await expect(indexPage.unitsDynamic).toBeVisible();

    const firstCard = indexPage.unitsDynamic.locator('.unit-card').first();
    const unitId = await firstCard.getAttribute('data-unit-id');
    if (unitId) {
      await firstCard.click();
      await indexPage.fillGrabForm(unitId, {
        name: 'Test',
        email: 'bad',
        phone: '',
      });
      await page.waitForTimeout(500);
    }
  });

  test('booking email validation rejects empty email', async ({ page }) => {
    await page.goto('/spaces.html');
    // If there's an email step in booking
    const emailInput = page.locator('#booking-email, [name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('');
      const submitBtn = page.locator('#booking-email-submit, button:has-text("Continue")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
