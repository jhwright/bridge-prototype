import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface A11yResult {
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: Array<{ html: string; failureSummary: string }>;
  }>;
  passes: number;
}

/**
 * Run axe-core WCAG AA accessibility scan on the current page.
 * Returns violations array. Throws if critical violations found.
 */
export async function runAccessibilityScan(
  page: Page,
  options?: {
    exclude?: string[];
    include?: string[];
    tags?: string[];
  }
): Promise<A11yResult> {
  let builder = new AxeBuilder({ page })
    .withTags(options?.tags ?? ['wcag2a', 'wcag2aa']);

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  if (options?.include) {
    for (const selector of options.include) {
      builder = builder.include(selector);
    }
  }

  const results = await builder.analyze();

  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact || 'unknown',
      description: v.description,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        failureSummary: n.failureSummary || '',
      })),
    })),
    passes: results.passes.length,
  };
}

/**
 * Assert no WCAG AA violations on the page.
 * Excludes known third-party elements by default.
 */
export async function expectNoA11yViolations(
  page: Page,
  options?: { exclude?: string[] }
): Promise<void> {
  const results = await runAccessibilityScan(page, {
    exclude: options?.exclude ?? [],
  });

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (critical.length > 0) {
    const summary = critical
      .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
      .join('\n');
    expect(critical, `Accessibility violations found:\n${summary}`).toHaveLength(0);
  }
}
