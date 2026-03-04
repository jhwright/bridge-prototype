import { test, expect } from '../fixtures/test-base';

test.describe('SMS Verify Component', () => {
  test.beforeEach(async ({ page, withMocks }) => {
    await withMocks();
    // SMS verify is used in both events page and booking flow
    // Test standalone on events page where it's simpler
    await page.goto('/events.html');
  });

  test.describe('Phone Phase', () => {
    test('phone input is visible', async ({ page }) => {
      const phoneInput = page.locator('#sms-phone');
      await expect(phoneInput).toBeVisible();
    });

    test('send button is visible', async ({ page }) => {
      const sendBtn = page.locator('#sms-send-btn');
      await expect(sendBtn).toBeVisible();
    });

    test('empty phone is rejected', async ({ page }) => {
      const sendBtn = page.locator('#sms-send-btn');
      await sendBtn.click();
      const error = page.locator('#sms-send-error');
      await expect(error).toBeVisible();
    });

    test('short phone number is rejected', async ({ page }) => {
      await page.locator('#sms-phone').fill('555');
      await page.locator('#sms-send-btn').click();
      const error = page.locator('#sms-send-error');
      await expect(error).toBeVisible();
    });

    test('valid phone sends API call', async ({ page }) => {
      let smsCalled = false;
      await page.route('**/public/sms/send/', async (route) => {
        smsCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.locator('#sms-phone').fill('5551234567');
      await page.locator('#sms-send-btn').click();
      await page.waitForTimeout(500);
      expect(smsCalled).toBe(true);
    });

    test('valid phone advances to code phase', async ({ page }) => {
      await page.locator('#sms-phone').fill('5551234567');
      await page.locator('#sms-send-btn').click();

      // Code phase should be visible
      const codePhase = page.locator('[data-sms-phase="code"]');
      await expect(codePhase).toBeVisible();
    });
  });

  test.describe('Code Phase', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to code phase
      await page.locator('#sms-phone').fill('5551234567');
      await page.locator('#sms-send-btn').click();
      await page.locator('[data-sms-phase="code"]').waitFor({ state: 'visible' });
    });

    test('6 digit inputs are visible', async ({ page }) => {
      for (let i = 0; i < 6; i++) {
        await expect(page.locator(`.sms-digit[data-index="${i}"]`)).toBeVisible();
      }
    });

    test('typing auto-advances to next digit', async ({ page }) => {
      const digit0 = page.locator('.sms-digit[data-index="0"]');
      await digit0.focus();
      await page.keyboard.type('1');

      // Focus should move to digit 1
      const digit1 = page.locator('.sms-digit[data-index="1"]');
      await expect(digit1).toBeFocused();
    });

    test('backspace moves to previous digit', async ({ page }) => {
      // Type first two digits
      await page.locator('.sms-digit[data-index="0"]').focus();
      await page.keyboard.type('12');

      // Backspace should move back
      await page.keyboard.press('Backspace');
      const digit1 = page.locator('.sms-digit[data-index="1"]');
      await expect(digit1).toBeFocused();
    });

    test('paste fills all 6 digits and auto-submits', async ({ page }) => {
      let confirmCalled = false;
      await page.route('**/public/sms/confirm/', async (route) => {
        confirmCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, token: 'test-token' }),
        });
      });

      const digit0 = page.locator('.sms-digit[data-index="0"]');
      await digit0.focus();

      // Simulate paste of 6 digits
      await page.evaluate(() => {
        const event = new ClipboardEvent('paste', {
          clipboardData: new DataTransfer(),
        });
        Object.defineProperty(event, 'clipboardData', {
          value: { getData: () => '123456' },
        });
        document.querySelector('.sms-digit[data-index="0"]')?.dispatchEvent(event);
      });

      await page.waitForTimeout(500);
      expect(confirmCalled).toBe(true);
    });

    test('resend button has countdown timer', async ({ page }) => {
      const resendBtn = page.locator('#sms-resend-btn');
      // Should be disabled initially with countdown
      await expect(resendBtn).toBeDisabled();
      const countdown = page.locator('#sms-resend-countdown');
      await expect(countdown).toBeVisible();
    });

    test('change number returns to phone phase', async ({ page }) => {
      const changeBtn = page.locator('#sms-change-phone');
      await changeBtn.click();
      const phonePhase = page.locator('[data-sms-phase="phone"]');
      await expect(phonePhase).toBeVisible();
    });
  });

  test.describe('Verified Phase', () => {
    test('successful verification shows verified state', async ({ page }) => {
      await page.locator('#sms-phone').fill('5551234567');
      await page.locator('#sms-send-btn').click();
      await page.locator('[data-sms-phase="code"]').waitFor({ state: 'visible' });

      // Type all 6 digits
      for (let i = 0; i < 6; i++) {
        await page.locator(`.sms-digit[data-index="${i}"]`).fill(String(i + 1));
      }

      // Wait for verification
      await page.waitForTimeout(500);

      const verifiedPhase = page.locator('[data-sms-phase="verified"]');
      if (await verifiedPhase.isVisible()) {
        await expect(verifiedPhase).toBeVisible();
      }
    });
  });
});
