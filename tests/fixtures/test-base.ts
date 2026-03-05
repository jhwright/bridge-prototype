import { test as base } from '@playwright/test';
import { setupApiMocks, MockOverrides } from './api-mocks';
import fs from 'fs';
import path from 'path';

const COVERAGE_DIR = path.join(__dirname, '..', 'coverage', 'raw');

type TestFixtures = {
  withMocks: (overrides?: MockOverrides) => Promise<void>;
  collectCoverage: void;
};

export const test = base.extend<TestFixtures>({
  withMocks: async ({ page }, use) => {
    const setupMocks = async (overrides: MockOverrides = {}) => {
      await setupApiMocks(page, overrides);
    };
    await use(setupMocks);
  },

  collectCoverage: [async ({ page, browserName }, use) => {
    const skip = !!process.env.CI || browserName !== 'chromium';
    if (!skip) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }

    await use();

    if (!skip) {
      const coverage = await page.coverage.stopJSCoverage();
      if (coverage.length > 0) {
        fs.mkdirSync(COVERAGE_DIR, { recursive: true });
        const filename = `cov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
        fs.writeFileSync(
          path.join(COVERAGE_DIR, filename),
          JSON.stringify(coverage, null, 2)
        );
      }
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
export type { MockOverrides } from './api-mocks';
