import { test, expect } from '../fixtures/test-base';

test.describe('Visual Regression: Baseline Screenshots', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  const pages = [
    { name: 'index', url: '/' },
    { name: 'storage', url: '/storage.html' },
    { name: 'spaces', url: '/spaces.html' },
    { name: 'events', url: '/events.html' },
    { name: 'about', url: '/about.html' },
    { name: 'contact', url: '/contact.html' },
    { name: 'privacy', url: '/privacy.html' },
    { name: 'terms', url: '/terms.html' },
    { name: 'faq', url: '/faq.html' },
  ];

  for (const { name, url } of pages) {
    test(`${name} page matches baseline`, async ({ page }) => {
      await page.goto(url);
      // Wait for content to load and settle
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
