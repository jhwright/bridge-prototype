import { test, expect } from '../fixtures/test-base';
import { BasePage } from '../pages/base-page';

const STATIC_PAGES = [
  { path: '/about.html', name: 'About' },
  { path: '/contact.html', name: 'Contact' },
  { path: '/privacy.html', name: 'Privacy' },
  { path: '/terms.html', name: 'Terms' },
  { path: '/faq.html', name: 'FAQ' },
];

test.describe('Static Pages', () => {
  for (const { path, name } of STATIC_PAGES) {
    test(`${name} page renders with nav and footer`, async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto(path);

      await expect(basePage.nav).toBeVisible();
      await expect(basePage.footer).toBeVisible();
    });

    test(`${name} page has logo`, async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto(path);

      await expect(basePage.logo).toBeVisible();
    });

    test(`${name} page has navigation links`, async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto(path);

      const linkCount = await basePage.navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test(`${name} page has footer links`, async ({ page }) => {
      const basePage = new BasePage(page);
      await page.goto(path);

      const linkCount = await basePage.footerLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });
  }
});
