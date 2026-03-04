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

  test('Index page has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await runAccessibilityScan(page);
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  for (const { name, url } of standalonePages) {
    test(`${name} page has no critical a11y violations`, async ({ page }) => {
      await page.goto(url);
      const results = await runAccessibilityScan(page);
      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(critical).toHaveLength(0);
    });
  }

  test('Index page passes count > 0', async ({ page }) => {
    await page.goto('/');
    const results = await runAccessibilityScan(page);
    expect(results.passes).toBeGreaterThan(0);
  });
});
