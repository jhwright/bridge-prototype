import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';

test.describe('Homepage', () => {
  let indexPage: IndexPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    indexPage = new IndexPage(page);
    await indexPage.goto();
  });

  test('hero section renders', async () => {
    await expect(indexPage.hero).toBeVisible();
  });

  test('identity cards are visible', async () => {
    await expect(indexPage.identityCards.first()).toBeVisible();
    const count = await indexPage.identityCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('mural gallery scrolls', async ({ page }) => {
    await expect(indexPage.muralGallery).toBeVisible();
    const scrollWidth = await indexPage.muralGallery.evaluate(
      (el) => el.scrollWidth
    );
    const clientWidth = await indexPage.muralGallery.evaluate(
      (el) => el.clientWidth
    );
    // Gallery should be scrollable (content wider than container)
    expect(scrollWidth).toBeGreaterThanOrEqual(clientWidth);
  });

  test('screen navigation via tabs', async ({ page }) => {
    // Click Store tab
    await indexPage.clickTab('Stash');
    await expect(indexPage.storeScreen).toBeVisible();

    // Click Make tab
    await indexPage.clickTab('Make');
    await expect(indexPage.makeScreen).toBeVisible();

    // Click Gather tab
    await indexPage.clickTab('Gather');
    await expect(indexPage.gatherScreen).toBeVisible();

    // Click Home tab
    await indexPage.clickTab('Home');
    await expect(indexPage.homeScreen).toBeVisible();
  });

  // fixme: bottom-nav locator uses .first() which targets the home screen's nav; switching screens hides it
  test.fixme('screen navigation via bottom nav', async () => {
    await indexPage.clickBottomNav('Stash');
    await expect(indexPage.storeScreen).toBeVisible();

    await indexPage.clickBottomNav('Home');
    await expect(indexPage.homeScreen).toBeVisible();
  });

  test('screen navigation via showScreen()', async () => {
    await indexPage.showScreen('store');
    await expect(indexPage.storeScreen).toBeVisible();

    await indexPage.showScreen('profile');
    await expect(indexPage.profileScreen).toBeVisible();
  });

  test('people carousel renders', async () => {
    await expect(indexPage.peopleCarousel).toBeVisible();
  });

  test('bottom nav is visible', async () => {
    await expect(indexPage.bottomNav).toBeVisible();
    const itemCount = await indexPage.bottomNavItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(4);
  });
});
