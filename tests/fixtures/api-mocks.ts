import { Page, Route } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const MOCKS_DIR = path.join(__dirname, '..', 'mocks');

function loadMock(name: string): unknown {
  const filePath = path.join(MOCKS_DIR, name);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export interface MockOverrides {
  units?: unknown;
  spacesList?: unknown;
  spaceOptions?: unknown;
  calculatePrice?: unknown;
  smsSend?: unknown;
  smsConfirm?: unknown;
  bookingCreated?: unknown;
  promoValidate?: unknown;
  eventsCalendar?: unknown;
  unitApply?: unknown;
  spaceApply?: unknown;
  // Error overrides
  unitsError?: number;
  spacesError?: number;
  bookingError?: number;
  smsError?: number;
  networkError?: boolean;
}

export async function setupApiMocks(page: Page, overrides: MockOverrides = {}): Promise<void> {
  // Units available endpoint
  await page.route('**/api/units/available.json*', async (route: Route) => {
    if (overrides.networkError) {
      await route.abort('connectionrefused');
      return;
    }
    if (overrides.unitsError) {
      await route.fulfill({
        status: overrides.unitsError,
        contentType: 'application/json',
        body: JSON.stringify(loadMock('error-responses/server-error.json')),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.units ?? loadMock('units.json')),
    });
  });

  // Unit apply (Grab It form)
  await page.route('**/api/units/*/apply/', async (route: Route) => {
    if (overrides.networkError) {
      await route.abort('connectionrefused');
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.unitApply ?? { success: true, message: 'Application submitted' }),
    });
  });

  // Spaces list endpoint
  await page.route('**/public/spaces/list.json', async (route: Route) => {
    if (overrides.spacesError) {
      await route.fulfill({
        status: overrides.spacesError,
        contentType: 'application/json',
        body: JSON.stringify(loadMock('error-responses/server-error.json')),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.spacesList ?? loadMock('spaces-list.json')),
    });
  });

  // Space options endpoint (per-space add-ons)
  await page.route('**/public/spaces/*/options.json', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.spaceOptions ?? loadMock('space-options.json')),
    });
  });

  // Space apply endpoint (application submission)
  await page.route('**/public/spaces/*/apply/', async (route: Route) => {
    if (overrides.networkError) {
      await route.abort('connectionrefused');
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.spaceApply ?? loadMock('space-apply-success.json')),
    });
  });

  // Space calendar endpoint
  await page.route('**/public/spaces/*/calendar.json', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.eventsCalendar ?? loadMock('events-calendar.json')),
    });
  });

  // Calculate price endpoint
  await page.route('**/public/spaces/*/calculate-price/', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.calculatePrice ?? loadMock('calculate-price.json')),
    });
  });

  // SMS send endpoint
  await page.route('**/public/sms/send/', async (route: Route) => {
    if (overrides.smsError) {
      await route.fulfill({
        status: overrides.smsError,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.smsSend ?? loadMock('sms-send.json')),
    });
  });

  // SMS confirm endpoint
  await page.route('**/public/sms/confirm/', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.smsConfirm ?? loadMock('sms-confirm.json')),
    });
  });

  // Booking endpoint
  await page.route('**/public/spaces/*/book-api/', async (route: Route) => {
    if (overrides.bookingError) {
      await route.fulfill({
        status: overrides.bookingError,
        contentType: 'application/json',
        body: JSON.stringify(loadMock('error-responses/booking-failed.json')),
      });
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(overrides.bookingCreated ?? loadMock('booking-created.json')),
    });
  });

  // Promo validate endpoint
  await page.route('**/public/promo/validate/', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.promoValidate ?? loadMock('promo-valid.json')),
    });
  });

  // Payment confirmation endpoint
  await page.route('**/public/spaces/*/payment/', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}
