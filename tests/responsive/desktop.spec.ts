import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';
import { StoragePage } from '../pages/storage-page';
import { SpacesPage } from '../pages/spaces-page';
import { EventsPage } from '../pages/events-page';

test.use({ viewport: { width: 1280, height: 720 } });

test.describe('Desktop Viewport (1280px)', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  test.describe('Index Page', () => {
    test('renders full width', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(1280);
    });

    test('all screen tabs are visible', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      await expect(indexPage.screenTabs).toBeVisible();
    });
  });

  test.describe('Storage Page', () => {
    test('full nav is visible (no hamburger)', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      await expect(storagePage.nav).toBeVisible();
      // Hamburger should be hidden at desktop
      await expect(storagePage.hamburgerButton).toBeHidden();
    });

    test('filter bar and units render', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      await expect(storagePage.filterSize).toBeVisible();
      const count = await storagePage.unitCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Spaces Page', () => {
    test('full nav visible', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await expect(spacesPage.nav).toBeVisible();
      await expect(spacesPage.hamburgerButton).toBeHidden();
    });

    test('space cards render', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      const count = await spacesPage.spaceCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Events Page', () => {
    test('renders at full width', async ({ page }) => {
      const eventsPage = new EventsPage(page);
      await eventsPage.goto();
      await expect(eventsPage.nav).toBeVisible();
      await expect(eventsPage.hamburgerButton).toBeHidden();
    });
  });

  test.describe('Static Pages', () => {
    const pages = ['/about.html', '/contact.html', '/privacy.html', '/terms.html', '/faq.html'];

    for (const url of pages) {
      test(`${url} renders at desktop width`, async ({ page }) => {
        await page.goto(url);
        await expect(page.locator('nav')).toBeVisible();
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(1280);
      });
    }
  });
});
