import { test, expect } from '../fixtures/test-base';
import { SpacesPage } from '../pages/spaces-page';

test.describe('Spaces Page', () => {
  let spacesPage: SpacesPage;

  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    spacesPage = new SpacesPage(page);
    await spacesPage.goto();
  });

  test('page renders with nav and footer', async () => {
    await expect(spacesPage.nav).toBeVisible();
    await expect(spacesPage.footer).toBeVisible();
  });

  test('space cards render', async () => {
    await expect(spacesPage.spaceCards.first()).toBeVisible();
    const count = await spacesPage.spaceCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('space card has Check Availability link', async () => {
    const firstCard = spacesPage.spaceCards.first();
    const btn = firstCard.getByRole('button', { name: /check availability/i });
    await expect(btn).toBeVisible();
  });

  test('space card has Ask a Question link', async () => {
    const firstCard = spacesPage.spaceCards.first();
    const btn = firstCard.getByRole('button', { name: /ask a question/i });
    await expect(btn).toBeVisible();
  });
});
