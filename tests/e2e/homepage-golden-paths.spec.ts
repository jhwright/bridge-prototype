import { test, expect } from '../fixtures/test-base';
import { IndexPage } from '../pages/index-page';

test.describe('Golden Paths', () => {
  let indexPage: IndexPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    indexPage = new IndexPage(page);
    await indexPage.goto();
  });

  test('FAB button is visible', async () => {
    await expect(indexPage.gpFab).toBeVisible();
  });

  test('clicking FAB opens overlay', async () => {
    await indexPage.openGoldenPaths();
    await expect(indexPage.gpOverlay).toBeVisible();
  });

  test('overlay shows golden path cards', async () => {
    await indexPage.openGoldenPaths();
    const cardCount = await indexPage.gpCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('selecting a path opens tracker', async () => {
    await indexPage.openGoldenPaths();
    await indexPage.selectGoldenPath(0);
    await expect(indexPage.gpTracker).toBeVisible();
    await expect(indexPage.gpTrackerTitle).toBeVisible();
  });

  test('tracker shows steps', async () => {
    await indexPage.openGoldenPaths();
    await indexPage.selectGoldenPath(0);
    await expect(indexPage.gpTrackerSteps).toBeVisible();
  });

  test('next button advances tracker', async () => {
    await indexPage.openGoldenPaths();
    await indexPage.selectGoldenPath(0);

    const initialLabel = await indexPage.gpTrackerLabel.textContent();
    await indexPage.gpNextStep();
    const nextLabel = await indexPage.gpTrackerLabel.textContent();

    // Label should change after advancing
    expect(nextLabel).not.toBe(initialLabel);
  });

  test('prev button goes back in tracker', async () => {
    await indexPage.openGoldenPaths();
    await indexPage.selectGoldenPath(0);

    // Advance one step
    await indexPage.gpNextStep();
    const afterNext = await indexPage.gpTrackerLabel.textContent();

    // Go back
    await indexPage.gpPrevStep();
    const afterPrev = await indexPage.gpTrackerLabel.textContent();

    expect(afterPrev).not.toBe(afterNext);
  });
});
