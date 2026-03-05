import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';
import { StoragePage } from '../pages/storage-page';
import { SpacesPage } from '../pages/spaces-page';
import { EventsPage } from '../pages/events-page';

test.use({ viewport: { width: 768, height: 1024 } });

test.describe('Tablet Viewport (768px)', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  test.describe('Index Page', () => {
    test('renders without overflow', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(768);
    });

    test('screen tabs are functional', async ({ page }) => {
      const indexPage = new IndexPage(page);
      await indexPage.goto();
      await indexPage.showScreen('store');
      await expect(indexPage.unitsDynamic).toBeVisible();
    });
  });

  test.describe('Storage Page', () => {
    test('renders and filters are visible', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      await expect(storagePage.filterSize).toBeVisible();
    });

    test('unit cards may show in grid', async ({ page }) => {
      const storagePage = new StoragePage(page);
      await storagePage.goto();
      const cards = storagePage.unitCards;
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Spaces Page', () => {
    test('renders with nav', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await expect(spacesPage.nav).toBeVisible();
    });

    test('space cards are visible', async ({ page }) => {
      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      const count = await spacesPage.spaceCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Events Page', () => {
    test('renders without overflow', async ({ page }) => {
      const eventsPage = new EventsPage(page);
      await eventsPage.goto();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(768);
    });
  });

  test.describe('Static Pages', () => {
    const pages = ['/about.html', '/contact.html', '/privacy.html', '/terms.html', '/faq.html'];

    for (const url of pages) {
      test(`${url} renders at tablet width`, async ({ page }) => {
        await page.goto(url);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(768);
      });
    }
  });
});
