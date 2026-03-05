import { test, expect } from '../fixtures/test-base';
import { mockFullCalendar, simulateCalendarSelect } from '../helpers/fullcalendar-mock';
import path from 'path';
import Tesseract from 'tesseract.js';

const TESSDATA_PATH = path.join(__dirname, '..', 'eng.traineddata');

async function ocrFromScreenshot(screenshotBuffer: Buffer): Promise<string> {
  const { data } = await Tesseract.recognize(screenshotBuffer, 'eng', {
    langPath: path.dirname(TESSDATA_PATH),
  });
  return data.text;
}

test.describe('Per-Space Page OCR', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await mockFullCalendar(page);
    await withMocks();
  });

  test('dance floor page shows space name via OCR', async ({ page }) => {
    await page.goto('/spaces/dance-floor.html');
    await page.waitForLoadState('domcontentloaded');

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    expect(text).toContain('Sprung Dance Floor');
  });

  test('dance floor page shows description text via OCR', async ({ page }) => {
    await page.goto('/spaces/dance-floor.html');
    await page.waitForLoadState('domcontentloaded');

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    expect(text).toMatch(/sprung/i);
    expect(text).toMatch(/guests/i);
  });

  test('dance floor page shows availability heading via OCR', async ({ page }) => {
    await page.goto('/spaces/dance-floor.html');
    await page.waitForLoadState('domcontentloaded');

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    expect(text).toContain('Availability');
  });

  test('courtyard page shows space name via OCR', async ({ page }) => {
    await page.goto('/spaces/courtyard.html');
    await page.waitForLoadState('domcontentloaded');

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    // OCR may break on "&" so check parts
    expect(text).toMatch(/Outdoor/i);
    expect(text).toMatch(/Courtyard/i);
  });

  test('invoice modal shows pricing text via OCR', async ({ page }) => {
    await page.goto('/spaces/dance-floor.html');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('[data-testid="fullcalendar-mock"]').waitFor();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(17, 0, 0, 0);

    await simulateCalendarSelect(page, tomorrow.toISOString(), end.toISOString());

    // Wait for modal and pricing to load
    await page.locator('#invoice-modal:not(.hidden)').waitFor();
    await page.locator('#pricing-lines').waitFor();
    // Small delay for pricing render
    await page.waitForTimeout(500);

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    expect(text).toMatch(/Base rental/i);
    expect(text).toMatch(/surcharge/i);
  });

  test('spaces list page shows heading via OCR', async ({ page }) => {
    await page.goto('/spaces.html');
    await page.waitForLoadState('domcontentloaded');

    const screenshot = await page.screenshot();
    const text = await ocrFromScreenshot(screenshot);

    expect(text).toMatch(/Book a Space/i);
  });
});
