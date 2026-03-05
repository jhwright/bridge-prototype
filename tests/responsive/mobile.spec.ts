import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';
import { StoragePage } from '../pages/storage-page';
import { SpacesPage } from '../pages/spaces-page';
import { EventsPage } from '../pages/events-page';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Mobile Viewport (375px)', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  test.describe('Index Page', () => {
    test('renders without overflow', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      const body = page.locator('body');
      const box = await body.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(375);
    });

    test('bottom nav is visible', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      await expect(indexPage.bottomNav).toBeVisible();
    });

    test('golden path FAB is tappable', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      const fab = indexPage.gpFab;
      if (await fab.isVisible()) {
        const box = await fab.boundingBox();
        expect(box).toBeTruthy();
        // Minimum touch target 44px
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Storage Page', () => {
    test('renders without horizontal scroll', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375);
    });

    test('unit cards stack vertically', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      const cards = storagePage.unitCards;
      const count = await cards.count();
      if (count >= 2) {
        const first = await cards.nth(0).boundingBox();
        const second = await cards.nth(1).boundingBox();
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        // Second card should be below first (stacked)
        expect(second!.y).toBeGreaterThan(first!.y);
      }
    });
  });

  test.describe('Spaces Page', () => {
    test('renders and nav is present', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await expect(spacesPage.nav).toBeVisible();
    });

    test('hamburger menu is visible', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await expect(spacesPage.hamburgerButton).toBeVisible();
    });
  });

  test.describe('Events Page', () => {
    test('renders without overflow', async ({ page }) => {
      const eventsPage = new EventsPage(page);
      await eventsPage.goto();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Static Pages', () => {
    const pages = ['/about.html', '/contact.html', '/privacy.html', '/terms.html', '/faq.html'];

    for (const url of pages) {
      test(`${url} renders without overflow`, async ({ page }) => {
        await page.goto(url);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(375);
      });
    }
  });
});
