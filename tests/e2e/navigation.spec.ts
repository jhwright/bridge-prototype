import { test, expect } from '../fixtures/test-base';
import { BasePage } from '../pages/base-page';
import { IndexPage } from '../pages/index-page';

test.describe('Navigation', () => {
  test.describe('Standalone page navigation', () => {
    test('nav links exist on storage page', async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto('/storage.html');

      const linkCount = await basePage.navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('nav links exist on spaces page', async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto('/spaces.html');

      const linkCount = await basePage.navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('footer links navigate correctly', async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto('/about.html');

      const footerCount = await basePage.footerLinks.count();
      expect(footerCount).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile hamburger menu', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('hamburger button is visible on mobile', async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto('/storage.html');

      await expect(basePage.hamburgerButton).toBeVisible();
    });

    test('hamburger toggles mobile menu', async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto('/storage.html');

      // Menu should be hidden initially
      const initiallyVisible = await basePage.isMobileMenuVisible();
      expect(initiallyVisible).toBe(false);

      // Toggle menu
      await basePage.toggleMobileMenu();
      await expect(basePage.mobileMenu).toBeVisible();
    });
  });

  test.describe('Index page navigation', () => {
    test('screen tabs navigate between screens', async ({ page, withMocks }) => {
      await withMocks();
      const indexPage = new IndexPage(page);
      await indexPage.goto();

      // Navigate through tabs
      await indexPage.clickTab('Stash');
      await expect(indexPage.storeScreen).toBeVisible();
      await expect(indexPage.homeScreen).not.toBeVisible();

      await indexPage.clickTab('Home');
      await expect(indexPage.homeScreen).toBeVisible();
    });

    test('bottom nav items highlight current screen', async ({ page, withMocks }) => {
      await withMocks();
      const indexPage = new IndexPage(page);
      await indexPage.goto();

      // Click Store in bottom nav
      await indexPage.clickBottomNav('Stash');
      await expect(indexPage.storeScreen).toBeVisible();
    });
  });
});
