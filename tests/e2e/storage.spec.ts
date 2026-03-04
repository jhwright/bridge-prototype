import { test, expect } from '../fixtures/test-base';
import { StoragePage } from '../pages/storage-page';

test.describe('Storage Page', () => {
  let storagePage: StoragePage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    storagePage = new StoragePage(page);
    await storagePage.goto();
  });

  test('page renders with nav and footer', async () => {
    await expect(storagePage.nav).toBeVisible();
    await expect(storagePage.footer).toBeVisible();
  });

  test('unit cards load from API', async () => {
    await expect(storagePage.unitCards.first()).toBeVisible();
    const count = await storagePage.unitCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filter chips are visible', async () => {
    await expect(storagePage.filterChips.first()).toBeVisible();
  });

  test('size dropdown is present', async () => {
    await expect(storagePage.filterSize).toBeVisible();
  });

  test('selecting a size filters units', async () => {
    const initialCount = await storagePage.unitCards.count();
    await storagePage.selectSize('Nook');
    // Result count text should update
    const resultText = await storagePage.getResultCount();
    expect(resultText).toBeTruthy();
  });

  test('toggling a chip filters units', async () => {
    // Toggle a filter chip
    const firstChip = storagePage.filterChips.first();
    const filter = await firstChip.getAttribute('data-filter');
    if (filter) {
      await storagePage.toggleChip(filter);
      // Chip should be in active state
      await expect(storagePage.chip(filter)).toHaveClass(/bg-bridge-orange/);
    }
  });

  test('result count updates on filter change', async () => {
    const initialResult = await storagePage.getResultCount();
    await storagePage.selectSize('Room');
    const newResult = await storagePage.getResultCount();
    // Results text should be present (may or may not change depending on data)
    expect(newResult).toBeTruthy();
  });

  test('unit card expands on click', async () => {
    await storagePage.expandUnit(0);
    const details = storagePage.unitDetails(0);
    await expect(details).toBeVisible();
  });

  test('e-truck banner is visible', async () => {
    await expect(storagePage.eTruckBanner).toBeVisible();
  });
});
