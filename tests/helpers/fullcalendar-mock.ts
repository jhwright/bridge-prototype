import { Page } from '@playwright/test';

/**
 * Intercepts FullCalendar CDN scripts and replaces with a minimal mock.
 * The mock exposes a FullCalendar.Calendar constructor that renders a placeholder
 * and provides `simulateSelect(start, end)` for test interaction.
 */
export async function mockFullCalendar(page: Page): Promise<void> {
  // Intercept all FullCalendar CDN requests
  await page.route('**/cdn.jsdelivr.net/npm/fullcalendar*/**', async (route) => {
    // Return the mock JS for the main bundle, empty for CSS/other
    const url = route.request().url();
    if (url.endsWith('.css')) {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: getFullCalendarMock(),
    });
  });

  // Also intercept unpkg CDN variant
  await page.route('**/unpkg.com/fullcalendar*/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: getFullCalendarMock(),
    });
  });
}

function getFullCalendarMock(): string {
  return `
    (function() {
      if (window.FullCalendar) return;

      function Calendar(el, opts) {
        this.el = el;
        this.opts = opts || {};
        this._events = [];
        this._selectCb = opts.select || function(){};
        this._unselectCb = opts.unselect || function(){};
      }

      Calendar.prototype.render = function() {
        this.el.innerHTML = '<div class="fc-mock" data-testid="fullcalendar-mock">Calendar Mock</div>';
        this.el.dataset.rendered = 'true';
        window.__fcInstances = window.__fcInstances || [];
        window.__fcInstances.push(this);
        // Load events if URL provided
        if (this.opts.events && this.opts.events.url) {
          fetch(this.opts.events.url)
            .then(function(r) { return r.json(); })
            .then(function(data) { this._events = data; }.bind(this))
            .catch(function(err) {
              if (this.opts.events.failure) this.opts.events.failure(err);
            }.bind(this));
        }
      };

      Calendar.prototype.changeView = function(view) {
        this._currentView = view;
      };

      Calendar.prototype.refetchEvents = function() {};
      Calendar.prototype.unselect = function() {
        this._unselectCb();
      };
      Calendar.prototype.destroy = function() {
        this.el.innerHTML = '';
      };

      // Test helper: simulate a time selection
      Calendar.prototype.simulateSelect = function(start, end) {
        var info = { start: new Date(start), end: new Date(end) };
        if (this.opts.selectAllow && !this.opts.selectAllow(info)) return false;
        this._selectCb(info);
        return true;
      };

      window.FullCalendar = { Calendar: Calendar };
    })();
  `;
}

/**
 * Helper to trigger a calendar selection from a test.
 * Call after page has loaded and FullCalendar mock is rendered.
 */
export async function simulateCalendarSelect(
  page: Page,
  start: string,
  end: string
): Promise<boolean> {
  return await page.evaluate(
    ({ s, e }) => {
      const calEl = document.querySelector('[data-rendered="true"]');
      if (!calEl) return false;
      // Access the calendar instance via the global tracking
      const calendars = (window as any).__fcInstances;
      if (calendars && calendars.length > 0) {
        return calendars[0].simulateSelect(s, e);
      }
      return false;
    },
    { s: start, e: end }
  );
}
