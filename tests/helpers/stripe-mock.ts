import { Page } from '@playwright/test';

/**
 * Intercepts Stripe.js CDN and replaces with a mock that:
 * - Returns a mock Stripe object from Stripe(key)
 * - Creates mock Elements that mount placeholder divs
 * - confirmCardPayment() resolves successfully
 * - confirmSetup() resolves successfully
 */
export async function mockStripe(page: Page, options?: { failPayment?: boolean }): Promise<void> {
  await page.route('**/js.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: getStripeMock(options?.failPayment ?? false),
    });
  });
}

function getStripeMock(failPayment: boolean): string {
  return `
    (function() {
      if (window.Stripe) return;

      function MockCardElement() {
        this._mounted = false;
        this._listeners = {};
      }

      MockCardElement.prototype.mount = function(el) {
        var target = typeof el === 'string' ? document.querySelector(el) : el;
        if (target) {
          target.innerHTML = '<div data-testid="stripe-card-mock" class="stripe-mock-card">Card Input Mock</div>';
          this._mounted = true;
        }
      };

      MockCardElement.prototype.on = function(event, handler) {
        this._listeners[event] = handler;
      };

      MockCardElement.prototype.destroy = function() {
        this._mounted = false;
      };

      MockCardElement.prototype.update = function() {};

      function MockElements() {}

      MockElements.prototype.create = function(type, opts) {
        if (type === 'card') {
          return new MockCardElement();
        }
        // Payment Element mock
        var el = new MockCardElement();
        el._type = type;
        return el;
      };

      function MockStripe(key) {
        this._key = key;
      }

      MockStripe.prototype.elements = function(opts) {
        return new MockElements();
      };

      MockStripe.prototype.confirmCardPayment = function(clientSecret, data) {
        ${failPayment ? `
        return Promise.resolve({
          error: { message: 'Your card was declined.' },
          paymentIntent: null
        });
        ` : `
        return Promise.resolve({
          error: null,
          paymentIntent: {
            id: 'pi_mock_' + Date.now(),
            status: 'succeeded',
            client_secret: clientSecret
          }
        });
        `}
      };

      MockStripe.prototype.confirmSetup = function(opts) {
        return Promise.resolve({
          error: null,
          setupIntent: {
            id: 'seti_mock_' + Date.now(),
            status: 'succeeded',
            payment_method: 'pm_mock_' + Date.now()
          }
        });
      };

      MockStripe.prototype.confirmPayment = function(opts) {
        return this.confirmCardPayment(opts.clientSecret, opts);
      };

      window.Stripe = function(key) {
        return new MockStripe(key);
      };
    })();
  `;
}
