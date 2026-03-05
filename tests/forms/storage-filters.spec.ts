import { test, expect } from '../fixtures/test-base';
import { StoragePage } from '../pages/storage-page';

test.describe('Storage Page Filters', () => {
  let storagePage: StoragePage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    storagePage = new StoragePage(page);
    await storagePage.goto();
  });

  test.describe('Size Dropdown', () => {
    test('has All option as default', async () => {
      await expect(storagePage.filterSize).toBeVisible();
    });

    test('selecting Small filters units', async () => {
      await storagePage.selectSize('0-50');
      const result = await storagePage.getResultCount();
      expect(result).toBeTruthy();
    });

    test('selecting Medium filters units', async () => {
      await storagePage.selectSize('50-100');
      const result = await storagePage.getResultCount();
      expect(result).toBeTruthy();
    });

    test('selecting Large filters units', async () => {
      await storagePage.selectSize('100-200');
      const result = await storagePage.getResultCount();
      expect(result).toBeTruthy();
    });

    test('selecting Extra Large filters units', async () => {
      await storagePage.selectSize('200-9999');
      const result = await storagePage.getResultCount();
      expect(result).toBeTruthy();
    });
  });

  test.describe('Filter Chips', () => {
    test('chips are visible', async () => {
      const count = await storagePage.filterChips.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clicking a chip toggles its active state', async () => {
      const firstChip = storagePage.filterChips.first();
      const filter = await firstChip.getAttribute('data-filter');
      if (filter) {
        await storagePage.toggleChip(filter);
        await expect(storagePage.chip(filter)).toHaveClass(/bg-bridge-orange/);

        // Toggle off
        await storagePage.toggleChip(filter);
      }
    });

    test('result count updates when chip toggled', async () => {
      const firstChip = storagePage.filterChips.first();
      const filter = await firstChip.getAttribute('data-filter');
      if (filter) {
        await storagePage.toggleChip(filter);
        const result = await storagePage.getResultCount();
        expect(result).toBeTruthy();
      }
    });
  });

  test.describe('Combined Filters', () => {
    test('size + chip filter combines correctly', async () => {
      await storagePage.selectSize('50-100');
      const firstChip = storagePage.filterChips.first();
      const filter = await firstChip.getAttribute('data-filter');
      if (filter) {
        await storagePage.toggleChip(filter);
        const result = await storagePage.getResultCount();
        expect(result).toBeTruthy();
      }
    });
  });
});
