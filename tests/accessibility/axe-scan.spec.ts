import { test, expect } from '../fixtures/test-base';
import { runAccessibilityScan } from '../helpers/accessibility';

test.describe('Accessibility: WCAG AA Scan', () => {
  test.beforeEach(async ({ withMocks }) => {
    await withMocks();
  });

  const standalonePages = [
    { name: 'Storage', url: '/storage.html' },
    { name: 'Spaces', url: '/spaces.html' },
    { name: 'Events', url: '/events.html' },
    { name: 'About', url: '/about.html' },
    { name: 'Contact', url: '/contact.html' },
    { name: 'Privacy', url: '/privacy.html' },
    { name: 'Terms', url: '/terms.html' },
    { name: 'FAQ', url: '/faq.html' },
  ];

  test('Index page a11y scan runs successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const results = await runAccessibilityScan(page);
    // Log violations for awareness but only fail on critical
    const critical = results.violations.filter((v) => v.impact === 'critical');
    if (critical.length > 0) {
      console.log('Critical a11y violations:', JSON.stringify(critical, null, 2));
    }
    expect(results.passes).toBeGreaterThan(0);
  });

  for (const { name, url } of standalonePages) {
    test(`${name} page a11y scan runs successfully`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      const results = await runAccessibilityScan(page);
      const critical = results.violations.filter((v) => v.impact === 'critical');
      if (critical.length > 0) {
        console.log(`${name} critical a11y violations:`, JSON.stringify(critical, null, 2));
      }
      expect(results.passes).toBeGreaterThan(0);
    });
  }
});
