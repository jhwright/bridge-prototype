/**
 * Bridge Storage — Per-Space Calendar Hero + Invoice Modal
 *
 * Month calendar with existing bookings shaded. Click a day to zoom
 * into week view with drag-select. Drag-select opens an invoice modal
 * with API-driven add-ons and live pricing.
 *
 * Dependencies: FullCalendar v6 (CDN), Flowbite, js/config.js
 */

/* global FullCalendar, BRIDGE_CONFIG, BridgeSMSVerify */

(function () {
  'use strict';

  const API = BRIDGE_CONFIG.API_BASE || '';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    resourceId: null,
    resourceKey: null,
    spaceInfo: null,
    calendar: null,
    selection: null,
    pricing: null,
    options: [],
    optionValues: {},
    promoCode: null,
    smsVerify: null,
    smsToken: null,
    smsPhone: null,
    canSelfBook: false,
    tapStart: null,    // mobile tap-to-select: first tap (start time)
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function isMobile() {
    return window.innerWidth < 768;
  }

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function formatCurrency(n) {
    return '$' + Number(n).toFixed(2);
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  async function apiGet(path) {
    const resp = await fetch(API + path);
    if (!resp.ok) throw new Error('Request failed');
    return resp.json();
  }

  async function apiPost(path, body) {
    const resp = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ---------------------------------------------------------------------------
  // Init: Load space info and render calendar
  // ---------------------------------------------------------------------------

  async function init() {
    const calEl = $('#space-calendar');
    if (!calEl) return;

    state.resourceId = calEl.dataset.resourceId;
    state.resourceKey = calEl.dataset.resourceKey || null;
    if (!state.resourceId) return;

    try {
      state.spaceInfo = await apiGet(`/public/spaces/${state.resourceId}/options.json`);
      state.options = state.spaceInfo.options || [];
      initOptionDefaults();
    } catch (err) {
      console.warn('Could not load space options:', err);
    }

    initCalendar(calEl);
    initModalEvents();

    // URL param auto-open: ?date=YYYY-MM-DD&start=HH:MM&end=HH:MM
    handleUrlParams();
  }

  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    const startTime = params.get('start');
    const endTime = params.get('end');
    if (!date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    state.selection = { start: start, end: end };
    openInvoiceModal();

    // Clean URL
    history.replaceState(null, '', window.location.pathname);
  }

  function initOptionDefaults() {
    state.optionValues = {};
    for (const opt of state.options) {
      state.optionValues[opt.key] = opt.default !== undefined ? opt.default : (opt.type === 'toggle' ? false : '');
    }
  }

  // ---------------------------------------------------------------------------
  // FullCalendar: Month view hero → Week view on dateClick
  // ---------------------------------------------------------------------------

  function initCalendar(calEl) {
    const resourceId = state.resourceId;

    state.calendar = new FullCalendar.Calendar(calEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth',
      },
      height: 'auto',
      nowIndicator: true,
      events: {
        url: `${API}/public/spaces/${resourceId}/calendar.json`,
        failure: function () {
          const errEl = $('#calendar-error');
          if (errEl) {
            errEl.textContent = 'Could not load calendar. Please try again.';
            show(errEl);
          }
        },
      },
      dateClick: function (info) {
        if (info.date < new Date(new Date().toDateString())) return;
        var currentView = state.calendar.view.type;

        // In month view: zoom into day/week
        if (currentView === 'dayGridMonth') {
          var targetView = isMobile() ? 'timeGridDay' : 'timeGridWeek';
          state.calendar.changeView(targetView, info.date);
          state.calendar.setOption('headerToolbar', {
            left: 'prev,next today',
            center: 'title',
            right: 'backToMonth',
          });
          return;
        }

        // In timeGrid views on mobile: tap-to-select flow
        if (isMobile() && currentView.startsWith('timeGrid')) {
          handleMobileTap(info.date);
        }
      },
      customButtons: {
        backToMonth: {
          text: 'Month',
          click: function () {
            state.tapStart = null;
            clearTapHighlight();
            state.calendar.changeView('dayGridMonth');
            state.calendar.setOption('headerToolbar', {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            });
            state.calendar.setOption('selectable', false);
            updateHint('Tap a date to see available times');
          },
        },
      },
      selectable: false,
      selectMirror: true,
      selectOverlap: false,
      slotDuration: '01:00:00',
      slotMinTime: state.spaceInfo ? state.spaceInfo.opening_time + ':00' : '06:00:00',
      slotMaxTime: state.spaceInfo ? state.spaceInfo.closing_time + ':00' : '23:00:00',
      allDaySlot: false,
      selectAllow: function (info) {
        return info.start >= new Date();
      },
      select: function (info) {
        state.selection = { start: info.start, end: info.end };
        openInvoiceModal();
      },
      viewDidMount: function (info) {
        var isTimeGrid = info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay';
        // On mobile, disable drag-select and use tap-to-select instead
        if (isMobile()) {
          state.calendar.setOption('selectable', false);
          if (isTimeGrid) {
            updateHint('Tap a time slot to select your start time');
          }
        } else {
          state.calendar.setOption('selectable', isTimeGrid);
          if (isTimeGrid) {
            updateHint('Click and drag to select your time slot');
          }
        }
        // Reset tap state on view change
        state.tapStart = null;
        clearTapHighlight();
      },
      windowResize: function () {
        var currentView = state.calendar.view.type;
        if (currentView.startsWith('timeGrid')) {
          if (isMobile()) {
            state.calendar.changeView('timeGridDay');
            state.calendar.setOption('selectable', false);
          } else {
            state.calendar.setOption('selectable', true);
          }
        }
      },
    });

    state.calendar.render();

    // Show instruction text
    const hint = $('#calendar-hint');
    if (hint) show(hint);
  }

  // ---------------------------------------------------------------------------
  // Mobile tap-to-select: tap start time, tap end time
  // ---------------------------------------------------------------------------

  function handleMobileTap(date) {
    if (!state.tapStart) {
      // First tap: set start time
      state.tapStart = date;
      highlightTapStart(date);
      updateHint('Now tap an end time (at least 1 hour later)');
    } else {
      // Second tap: set end time
      var start = state.tapStart;
      var end = date;

      // Ensure end is after start; if user tapped earlier, swap
      if (end <= start) {
        var tmp = start;
        start = end;
        end = tmp;
      }

      // Enforce minimum 1 hour
      if ((end - start) < 3600000) {
        end = new Date(start.getTime() + 3600000);
      }

      clearTapHighlight();
      state.tapStart = null;
      updateHint('Tap a time slot to select your start time');

      state.selection = { start: start, end: end };
      openInvoiceModal();
    }
  }

  function highlightTapStart(date) {
    // Add a temporary background event to show the selected start
    state.calendar.addEvent({
      id: '_tap_start',
      start: date,
      end: new Date(date.getTime() + 3600000),
      display: 'background',
      color: '#DF562A',
    });
  }

  function clearTapHighlight() {
    var ev = state.calendar.getEventById('_tap_start');
    if (ev) ev.remove();
  }

  function updateHint(text) {
    var hint = $('#calendar-hint');
    if (hint) hint.textContent = text;
  }

  // ---------------------------------------------------------------------------
  // Invoice Modal
  // ---------------------------------------------------------------------------

  function openInvoiceModal() {
    const modal = $('#invoice-modal');
    if (!modal || !state.selection) return;

    renderSelectionSummary();
    renderAddOns();
    fetchPricing();
    hide($('#apply-section'));
    show($('#pricing-section'));
    show(modal);
  }

  function closeInvoiceModal() {
    hide($('#invoice-modal'));
    if (state.calendar) state.calendar.unselect();
    state.selection = null;
    state.tapStart = null;
    clearTapHighlight();
  }

  function renderSelectionSummary() {
    if (!state.selection) return;
    const { start, end } = state.selection;
    const hours = (end - start) / (1000 * 60 * 60);
    const spaceName = state.spaceInfo ? state.spaceInfo.name : 'Space';

    const el = $('#invoice-summary');
    if (!el) return;
    el.innerHTML = `
      <h3 class="text-lg font-bold text-bridge-dark">${spaceName}</h3>
      <p class="text-sm text-gray-600">${formatDate(start)}</p>
      <p class="text-sm text-gray-600">${formatTime(start)} &ndash; ${formatTime(end)} (${hours} hr${hours !== 1 ? 's' : ''})</p>
    `;
  }

  // ---------------------------------------------------------------------------
  // API-Driven Add-Ons
  // ---------------------------------------------------------------------------

  function renderAddOns() {
    const container = $('#addon-options');
    if (!container) return;
    container.innerHTML = '';

    for (const opt of state.options) {
      if (opt.depends_on && !state.optionValues[opt.depends_on]) continue;

      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center justify-between py-2';

      if (opt.type === 'toggle') {
        wrapper.innerHTML = `
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" data-addon-key="${opt.key}"
              ${state.optionValues[opt.key] ? 'checked' : ''}
              class="w-4 h-4 text-bridge-orange bg-gray-100 border-gray-300 rounded focus:ring-bridge-orange">
            <span class="text-sm text-bridge-dark">${opt.label}</span>
          </label>
          ${opt.price_note ? `<span class="text-xs text-gray-500">${opt.price_note}</span>` : ''}
        `;
      } else if (opt.type === 'select') {
        let optionsHtml = (opt.choices || []).map(c =>
          `<option value="${c.value}" ${state.optionValues[opt.key] === c.value ? 'selected' : ''}>${c.label}</option>`
        ).join('');
        wrapper.innerHTML = `
          <label class="text-sm text-bridge-dark">${opt.label}</label>
          <select data-addon-key="${opt.key}"
            class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-bridge-orange focus:border-bridge-orange">
            ${optionsHtml}
          </select>
        `;
      } else if (opt.type === 'number') {
        wrapper.innerHTML = `
          <label class="text-sm text-bridge-dark">${opt.label}</label>
          <input type="number" min="0" data-addon-key="${opt.key}"
            value="${state.optionValues[opt.key] || 0}"
            class="w-20 text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-center focus:ring-bridge-orange focus:border-bridge-orange">
        `;
      }

      container.appendChild(wrapper);
    }

    // Bind change events
    container.querySelectorAll('[data-addon-key]').forEach(function (el) {
      el.addEventListener('change', function () {
        const key = el.dataset.addonKey;
        if (el.type === 'checkbox') {
          state.optionValues[key] = el.checked;
        } else if (el.type === 'number') {
          state.optionValues[key] = parseInt(el.value, 10) || 0;
        } else {
          state.optionValues[key] = el.value;
        }
        renderAddOns();
        fetchPricing();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Pricing
  // ---------------------------------------------------------------------------

  async function fetchPricing() {
    if (!state.selection) return;
    const el = $('#pricing-lines');
    if (!el) return;

    try {
      const body = {
        start_at: state.selection.start.toISOString(),
        end_at: state.selection.end.toISOString(),
      };

      // Add dynamic add-on values
      for (const key in state.optionValues) {
        body[key] = state.optionValues[key];
      }

      if (state.promoCode) body.promo_code = state.promoCode;

      const pricing = await apiPost(
        `/public/spaces/${state.resourceId}/calculate-price/`,
        body
      );
      state.pricing = pricing;
      renderPricing(pricing);
    } catch (err) {
      console.error('Pricing error:', err);
      el.innerHTML = '<p class="text-sm text-red-600">Could not calculate pricing.</p>';
    }
  }

  function renderPricing(p) {
    const el = $('#pricing-lines');
    if (!el) return;

    let html = '';
    html += pricingLine('Base rental', `${p.hours} hrs × ${formatCurrency(p.hourly_rate)}/hr`, p.base_rental);
    if (p.peak_amount > 0) html += pricingLine('Peak surcharge', '', p.peak_amount);
    if (p.bar_amount > 0) html += pricingLine('Bar service', '', p.bar_amount);
    if (p.snack_amount > 0) html += pricingLine('Snacks', '', p.snack_amount);
    if (p.stage_amount > 0) html += pricingLine('Stage', '', p.stage_amount);
    if (p.curtain_amount > 0) html += pricingLine('Privacy curtains', '', p.curtain_amount);
    if (p.setup_amount > 0) html += pricingLine('Setup', '', p.setup_amount);
    if (p.teardown_amount > 0) html += pricingLine('Teardown', '', p.teardown_amount);

    html += '<div class="border-t border-gray-200 my-2"></div>';
    html += pricingLine('Subtotal', '', p.subtotal, true);

    if (p.discount_amount > 0) {
      html += pricingLine('Promo discount', '', -p.discount_amount, false, 'text-green-600');
    }

    html += '<div class="border-t border-gray-300 my-2"></div>';
    html += pricingLine(`Deposit (${p.deposit_percentage}%)`, 'Due at booking', p.deposit_amount, true, 'text-bridge-orange');
    html += pricingLine('Balance due', 'At event', p.balance_due);

    el.innerHTML = html;

    // Show/hide the apply button
    show($('#apply-section'));
  }

  function pricingLine(label, detail, amount, bold, cls) {
    const w = bold ? 'font-semibold' : '';
    const c = cls || '';
    return `
      <div class="flex justify-between items-center py-1 ${w} ${c}">
        <div>
          <span>${label}</span>
          ${detail ? `<span class="text-xs text-gray-400 ml-1">${detail}</span>` : ''}
        </div>
        <span>${amount < 0 ? '-' : ''}${formatCurrency(Math.abs(amount))}</span>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Promo Code
  // ---------------------------------------------------------------------------

  function initPromoCode() {
    const applyBtn = $('#promo-apply');
    const removeBtn = $('#promo-remove');
    if (!applyBtn) return;

    applyBtn.addEventListener('click', async function () {
      const code = ($('#promo-input') || {}).value;
      if (!code) return;
      state.promoCode = code.trim();
      fetchPricing();
      show($('#promo-applied'));
      hide($('#promo-form'));
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        state.promoCode = null;
        if ($('#promo-input')) $('#promo-input').value = '';
        show($('#promo-form'));
        hide($('#promo-applied'));
        fetchPricing();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Apply Flow (contact info collection)
  // ---------------------------------------------------------------------------

  function initApplyFlow() {
    const applyBtn = $('#apply-btn');
    if (!applyBtn) return;

    applyBtn.addEventListener('click', function () {
      show($('#apply-form'));
      hide($('#apply-btn'));
    });

    // SMS verify
    const smsContainer = $('#apply-sms-verify');
    if (smsContainer) {
      state.smsVerify = new BridgeSMSVerify({
        container: smsContainer,
        apiBase: API,
        onVerified: function (token, phone) {
          state.smsToken = token;
          state.smsPhone = phone;
          checkPermissionsAndBranch();
        },
      });
    }

    // Submit application (non-self-book path)
    const submitBtn = $('#submit-application');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitApplication);
    }

    // Pay Now (self-book path)
    const payBtn = $('#pay-now-btn');
    if (payBtn) {
      payBtn.addEventListener('click', handlePayment);
    }
  }

  // ---------------------------------------------------------------------------
  // Auth Branching: Permissions Check + Payment / Apply
  // ---------------------------------------------------------------------------

  async function checkPermissionsAndBranch() {
    try {
      const resp = await fetch(API + '/public/customer/permissions/', {
        headers: { 'Authorization': 'Bearer ' + state.smsToken },
      });
      if (!resp.ok) throw new Error('Permissions check failed');
      const perms = await resp.json();

      var key = state.resourceKey;
      state.canSelfBook = key && perms.self_book && perms.self_book[key] === true;

      if (state.canSelfBook) {
        // Self-book: show book button (payment happens in portal)
        hide($('#submit-application'));
        show($('#payment-section'));
      } else {
        // Non-self-book: enable application submit
        var submitBtn = $('#submit-application');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      console.warn('Permissions check failed, defaulting to apply flow:', err);
      // Fallback: enable submit button
      var submitBtn = $('#submit-application');
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function handlePayment() {
    var payBtn = $('#pay-now-btn');
    var errEl = $('#payment-error');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing...';
    }
    hide(errEl);

    try {
      // Create booking via book-api
      var bookData = {
        start: state.selection.start.toISOString(),
        end: state.selection.end.toISOString(),
        last_name: ($('#apply-name') || {}).value || '',
        email: ($('#apply-email') || {}).value || '',
        phone: state.smsPhone || '',
        event_type: ($('#apply-event-type') || {}).value || 'other',
      };

      for (var key in state.optionValues) {
        bookData[key] = state.optionValues[key];
      }
      if (state.promoCode) bookData.promo_code = state.promoCode;

      var bookResp = await fetch(API + '/public/spaces/' + state.resourceId + '/book-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.smsToken,
        },
        body: JSON.stringify(bookData),
      });
      var bookResult = await bookResp.json();
      if (!bookResp.ok) throw new Error(bookResult.error || 'Booking failed');

      // Show confirmation with portal link for payment
      hide($('#invoice-modal'));
      showConfirmation(bookResult);
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        show(errEl);
      }
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = 'Book Now';
      }
    }
  }

  async function submitApplication() {
    const submitBtn = $('#submit-application');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      const data = {
        last_name: ($('#apply-name') || {}).value || '',
        email: ($('#apply-email') || {}).value || '',
        phone: state.smsVerify ? state.smsVerify.getPhone() : '',
        event_type: ($('#apply-event-type') || {}).value || 'other',
        event_description: ($('#apply-description') || {}).value || '',
        expected_attendance: parseInt(($('#apply-attendance') || {}).value || '25', 10),
        selected_dates: [{
          start: state.selection.start.toISOString(),
          end: state.selection.end.toISOString(),
        }],
      };

      // Add add-on values
      for (const key in state.optionValues) {
        data[key] = state.optionValues[key];
      }

      if (state.promoCode) data.promo_code = state.promoCode;

      const headers = { 'Content-Type': 'application/json' };
      if (state.smsToken) headers['Authorization'] = 'Bearer ' + state.smsToken;

      const resp = await fetch(API + `/public/spaces/${state.resourceId}/apply/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || result.errors?.email || 'Application failed');

      // Show confirmation
      hide($('#invoice-modal'));
      showConfirmation(result);
    } catch (err) {
      const errEl = $('#apply-error');
      if (errEl) {
        errEl.textContent = err.message;
        show(errEl);
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
      }
    }
  }

  function showConfirmation(result) {
    const el = $('#booking-confirmation');
    if (!el) return;

    const portalUrl = result.portal_url || '/portal/';
    const hasPortalLink = result.portal_url && result.portal_url.includes('/magic-link/');
    const heading = hasPortalLink ? 'Booking Submitted!' : 'Application Submitted';
    const message = hasPortalLink
      ? 'Complete your deposit payment in the portal to confirm your booking.'
      : "We'll review your request and get back to you within 24 hours.";

    el.innerHTML = `
      <div class="bg-green-50 rounded-xl p-6 text-center">
        <svg class="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <h3 class="text-xl font-bold text-bridge-dark mb-2">${heading}</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        ${result.confirmation_number ? `<p class="text-sm text-gray-500 mb-4">Confirmation: <span class="font-medium">${result.confirmation_number}</span></p>` : ''}
        ${result.conflict_warning ? `<p class="text-amber-600 text-sm mb-4">${result.conflict_warning}</p>` : ''}
        ${hasPortalLink ? `
        <a href="${portalUrl}" class="portal-link inline-block text-white bg-bridge-orange hover:bg-orange-700 font-semibold rounded-lg px-6 py-2.5 transition-colors mb-3">
          Complete Your Booking
        </a>
        <br>` : ''}
        <button onclick="location.reload()" class="text-bridge-dark border border-bridge-dark hover:bg-bridge-dark hover:text-white font-semibold rounded-lg px-6 py-2.5 transition-colors">
          Back to Calendar
        </button>
      </div>
    `;
    show(el);
  }

  // ---------------------------------------------------------------------------
  // Modal Events
  // ---------------------------------------------------------------------------

  function initModalEvents() {
    // Close modal
    $$('[data-close-invoice]').forEach(function (btn) {
      btn.addEventListener('click', closeInvoiceModal);
    });

    const modal = $('#invoice-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeInvoiceModal();
      });
    }

    initPromoCode();
    initApplyFlow();
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
