/**
 * Bridge Storage — Space Booking Flow
 *
 * Handles FullCalendar drag-select, live pricing, promo codes,
 * and booking confirmation with portal handoff.
 *
 * Dependencies: FullCalendar v6 (CDN), Flowbite, js/config.js
 */

/* global FullCalendar, BRIDGE_CONFIG, BridgeSMSVerify */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    resourceId: null,
    spaceName: '',
    spaceCategory: '',
    calendar: null,
    selection: null, // {start, end}
    pricing: null,
    promoCode: null,
    promoDiscount: null,
    bookingId: null,
    portalUrl: null,
    smsVerify: null,
    smsToken: null,
    step: 1, // 1=email, 2=calendar, 3=details, 4=verify, 5=submit, 6=confirmation
  };

  const API = BRIDGE_CONFIG.API_BASE || '';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function show(el) {
    if (el) el.classList.remove('hidden');
  }

  function hide(el) {
    if (el) el.classList.add('hidden');
  }

  function formatCurrency(n) {
    return '$' + Number(n).toFixed(2);
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  async function apiGet(path) {
    const resp = await fetch(API + path);
    if (!resp.ok) throw new Error('Request failed');
    return resp.json();
  }

  // ---------------------------------------------------------------------------
  // Modal Navigation
  // ---------------------------------------------------------------------------

  function goToStep(n) {
    state.step = n;
    for (let i = 1; i <= 6; i++) {
      const stepEl = $(`#booking-step-${i}`);
      if (stepEl) {
        if (i === n) show(stepEl);
        else hide(stepEl);
      }
    }
    // Update step indicators
    $$('.step-indicator').forEach((el) => {
      const s = parseInt(el.dataset.step, 10);
      el.classList.toggle('text-bridge-orange', s <= n);
      el.classList.toggle('font-bold', s === n);
      el.classList.toggle('text-gray-400', s > n);
    });
  }

  // ---------------------------------------------------------------------------
  // Step 1: Email
  // ---------------------------------------------------------------------------

  function initEmailStep() {
    const form = $('#email-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = $('#booking-email').value.trim();
      if (!email) return;
      state.email = email;
      goToStep(2);
      initCalendar();
    });
  }

  // ---------------------------------------------------------------------------
  // Step 2: Calendar + Pricing
  // ---------------------------------------------------------------------------

  function initCalendar() {
    if (state.calendar) {
      state.calendar.refetchEvents();
      return;
    }

    const calEl = $('#booking-calendar');
    if (!calEl) return;

    state.calendar = new FullCalendar.Calendar(calEl, {
      initialView: 'timeGridWeek',
      slotDuration: '01:00:00',
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
      allDaySlot: false,
      selectable: true,
      selectMirror: true,
      selectOverlap: false,
      unselectAuto: false,
      nowIndicator: true,
      height: 'auto',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: '',
      },
      events: {
        url: `${API}/public/spaces/${state.resourceId}/calendar.json`,
        failure: function () {
          showError('Could not load calendar. Please try again.');
        },
      },
      selectAllow: function (info) {
        return info.start >= new Date();
      },
      select: function (info) {
        state.selection = { start: info.start, end: info.end };
        updateSelectionSummary();
        fetchPricing();
      },
      unselect: function () {
        state.selection = null;
        hide($('#selection-summary'));
      },
      // Responsive: on mobile, show single day
      windowResize: function (arg) {
        if (window.innerWidth < 768) {
          state.calendar.changeView('timeGridDay');
        } else {
          state.calendar.changeView('timeGridWeek');
        }
      },
    });

    // Start with day view on mobile
    if (window.innerWidth < 768) {
      state.calendar.changeView('timeGridDay');
    }

    state.calendar.render();
  }

  function updateSelectionSummary() {
    const el = $('#selection-summary');
    if (!el || !state.selection) return;
    show(el);

    const { start, end } = state.selection;
    const hours = (end - start) / (1000 * 60 * 60);

    $('#sel-date').textContent = formatDate(start);
    $('#sel-time').textContent = `${formatTime(start)} – ${formatTime(end)}`;
    $('#sel-hours').textContent = `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  async function fetchPricing() {
    if (!state.selection) return;

    const pricingEl = $('#pricing-breakdown');
    if (!pricingEl) return;

    try {
      // Gather amenity selections from step 3 if they exist
      const body = {
        start_at: state.selection.start.toISOString(),
        end_at: state.selection.end.toISOString(),
        bar_service: getVal('#opt-bar-service') || 'none',
        include_snacks: isChecked('#opt-snacks'),
        snack_guest_count: parseInt(getVal('#opt-snack-count') || '0', 10),
        include_stage: isChecked('#opt-stage'),
        include_privacy_curtains: isChecked('#opt-curtains'),
        include_setup: isChecked('#opt-setup'),
        include_teardown: isChecked('#opt-teardown'),
      };

      if (state.promoCode) {
        body.promo_code = state.promoCode;
      }

      const pricing = await apiPost(
        `/public/spaces/${state.resourceId}/calculate-price/`,
        body
      );

      state.pricing = pricing;
      renderPricing(pricing);
      show(pricingEl);
    } catch (err) {
      console.error('Pricing error:', err);
    }
  }

  function getVal(sel) {
    const el = $(sel);
    return el ? el.value : '';
  }

  function isChecked(sel) {
    const el = $(sel);
    return el ? el.checked : false;
  }

  function renderPricing(p) {
    const lines = $('#pricing-lines');
    if (!lines) return;

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
    html += pricingLine(`Deposit (${p.deposit_percentage}%)`, 'Due now', p.deposit_amount, true, 'text-bridge-orange');
    html += pricingLine('Balance due', 'At event', p.balance_due);

    lines.innerHTML = html;
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
        <span>${formatCurrency(Math.abs(amount))}${amount < 0 ? ' off' : ''}</span>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Step 3: Event Details + Amenities
  // ---------------------------------------------------------------------------

  function initDetailsStep() {
    // When amenity options change, re-fetch pricing
    $$('.amenity-option').forEach((el) => {
      el.addEventListener('change', fetchPricing);
    });

    const nextBtn = $('#details-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        // Validate required fields
        const eventType = getVal('#event-type');
        const desc = getVal('#event-description');
        if (!eventType || !desc) {
          showError('Please fill in event type and description.');
          return;
        }
        goToStep(4);
        initVerifyStep();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3→2 navigation (back to calendar)
  // ---------------------------------------------------------------------------

  function initBackButtons() {
    $$('.btn-back').forEach((btn) => {
      btn.addEventListener('click', function () {
        const target = parseInt(btn.dataset.target, 10);
        goToStep(target);
      });
    });
  }

  // Step 2→3 continue button
  function initCalendarContinue() {
    const btn = $('#calendar-continue');
    if (btn) {
      btn.addEventListener('click', function () {
        if (!state.selection) {
          showError('Please select a time on the calendar.');
          return;
        }
        goToStep(3);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4: Contact Info + SMS Verification
  // ---------------------------------------------------------------------------

  function initVerifyStep() {
    // Initialize SMS verify component once
    if (!state.smsVerify) {
      const container = $('#sms-verify-container');
      if (!container) return;

      state.smsVerify = new BridgeSMSVerify({
        container: container,
        apiBase: API,
        sendEndpoint: BRIDGE_CONFIG.SMS_VERIFY_SEND,
        confirmEndpoint: BRIDGE_CONFIG.SMS_VERIFY_CONFIRM,
        onVerified: function (token, phone) {
          state.smsToken = token;
          // Enable continue button
          const btn = $('#verify-continue');
          if (btn) btn.disabled = false;
        },
      });
    }

    // If already verified this session, show verified state and enable continue
    if (state.smsToken && state.smsVerify.isVerified()) {
      const btn = $('#verify-continue');
      if (btn) btn.disabled = false;
    } else {
      const btn = $('#verify-continue');
      if (btn) btn.disabled = true;
    }

    // Wire continue button
    const continueBtn = $('#verify-continue');
    if (continueBtn && !continueBtn.dataset.wired) {
      continueBtn.dataset.wired = '1';
      continueBtn.addEventListener('click', function () {
        const name = getVal('#contact-name').trim();
        if (!name) {
          showError('Please enter your name.');
          return;
        }
        if (!state.smsVerify || !state.smsVerify.isVerified()) {
          showError('Please verify your phone number.');
          return;
        }
        hideError();
        submitBooking();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Promo Code
  // ---------------------------------------------------------------------------

  function initPromoCode() {
    const applyBtn = $('#promo-apply');
    const removeBtn = $('#promo-remove');
    if (!applyBtn) return;

    applyBtn.addEventListener('click', async function () {
      const code = getVal('#promo-input').trim();
      if (!code) return;

      try {
        const result = await apiPost('/public/promo/validate/', {
          code: code,
          resource_id: state.resourceId,
          subtotal: state.pricing ? state.pricing.subtotal : 0,
        });

        if (result.valid) {
          state.promoCode = code;
          state.promoDiscount = result;
          $('#promo-message').textContent = result.message;
          $('#promo-message').className = 'text-sm text-green-600 mt-1';
          show($('#promo-applied'));
          hide($('#promo-form'));
          fetchPricing();
        } else {
          $('#promo-message').textContent = result.message;
          $('#promo-message').className = 'text-sm text-red-600 mt-1';
        }
      } catch (err) {
        $('#promo-message').textContent = 'Could not validate promo code.';
        $('#promo-message').className = 'text-sm text-red-600 mt-1';
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        state.promoCode = null;
        state.promoDiscount = null;
        $('#promo-input').value = '';
        $('#promo-message').textContent = '';
        show($('#promo-form'));
        hide($('#promo-applied'));
        fetchPricing();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: Submit Booking
  // ---------------------------------------------------------------------------

  async function submitBooking() {
    const submitBtn = $('#verify-continue');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    hideError();

    try {
      // 1. Create booking
      const bookingData = {
        email: state.email,
        start_at: state.selection.start.toISOString(),
        end_at: state.selection.end.toISOString(),
        contact_name: getVal('#contact-name'),
        contact_phone: state.smsVerify ? state.smsVerify.getPhone() : '',
        event_type: getVal('#event-type'),
        event_name: getVal('#event-name'),
        event_description: getVal('#event-description'),
        expected_attendance: parseInt(getVal('#expected-attendance') || '25', 10),
        special_requests: getVal('#special-requests'),
        bar_service: getVal('#opt-bar-service') || 'none',
        include_snacks: isChecked('#opt-snacks'),
        snack_guest_count: parseInt(getVal('#opt-snack-count') || '0', 10),
        include_stage: isChecked('#opt-stage'),
        include_privacy_curtains: isChecked('#opt-curtains'),
        include_setup: isChecked('#opt-setup'),
        include_teardown: isChecked('#opt-teardown'),
      };

      if (state.promoCode) {
        bookingData.promo_code = state.promoCode;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (state.smsToken) {
        headers['Authorization'] = 'Bearer ' + state.smsToken;
      }

      const bookResp = await fetch(API + `/public/spaces/${state.resourceId}/book-api/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bookingData),
      });
      const booking = await bookResp.json();
      if (!bookResp.ok) throw new Error(booking.error || 'Booking request failed');

      state.bookingId = booking.id;
      state.portalUrl = booking.portal_url;

      // Show confirmation with portal link
      renderConfirmation(booking);
      goToStep(6);
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Booking';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Confirmation
  // ---------------------------------------------------------------------------

  function renderConfirmation(booking) {
    const el = $('#confirmation-content');
    if (!el) return;

    const portalUrl = booking.portal_url || '/portal/';
    const confirmNum = booking.confirmation_number || '';

    el.innerHTML = `
      <div class="bg-green-50 text-green-800 rounded-lg p-4 mb-6">
        <p class="font-semibold">Your booking request has been submitted!</p>
        <p class="text-sm mt-1">Complete your deposit payment in the portal to confirm.</p>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Space</span>
          <span class="font-medium">${state.spaceName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Date</span>
          <span class="font-medium">${formatDate(state.selection.start)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Time</span>
          <span class="font-medium">${formatTime(state.selection.start)} – ${formatTime(state.selection.end)}</span>
        </div>
        ${state.pricing ? `
        <div class="flex justify-between">
          <span class="text-gray-500">Deposit amount</span>
          <span class="font-medium text-bridge-orange">${formatCurrency(state.pricing.deposit_amount)}</span>
        </div>` : ''}
        ${confirmNum ? `
        <div class="flex justify-between">
          <span class="text-gray-500">Confirmation</span>
          <span class="font-medium">${confirmNum}</span>
        </div>` : ''}
      </div>
      <div class="mt-6 flex flex-col gap-3">
        <a href="${portalUrl}" class="portal-link text-center text-white bg-bridge-orange hover:bg-orange-700 font-semibold rounded-lg text-sm px-4 py-2.5 transition-colors">
          Complete Your Booking
        </a>
        <div class="flex gap-3">
          <button id="rebook-btn" class="text-white bg-bridge-dark hover:bg-gray-800 font-semibold rounded-lg text-sm px-4 py-2 transition-colors">
            Rebook This Space
          </button>
          <button onclick="document.getElementById('booking-modal').classList.add('hidden')" class="text-bridge-dark border border-bridge-dark hover:bg-bridge-dark hover:text-white font-semibold rounded-lg text-sm px-4 py-2 transition-colors">
            Close
          </button>
        </div>
      </div>`;

    // Wire rebook button
    const rebookBtn = $('#rebook-btn');
    if (rebookBtn) {
      rebookBtn.addEventListener('click', function () {
        // Reset to calendar step, keeping event details
        state.selection = null;
        state.bookingId = null;
        state.pricing = null;
        goToStep(2);
        if (state.calendar) {
          state.calendar.unselect();
          state.calendar.refetchEvents();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  function showError(msg) {
    const el = $('#booking-error');
    if (el) {
      el.textContent = msg;
      show(el);
    }
  }

  function hideError() {
    const el = $('#booking-error');
    if (el) {
      el.textContent = '';
      hide(el);
    }
  }

  // ---------------------------------------------------------------------------
  // Open booking modal for a space
  // ---------------------------------------------------------------------------

  function openBookingModal(resourceId, spaceName, spaceCategory) {
    state.resourceId = resourceId;
    state.spaceName = spaceName;
    state.spaceCategory = spaceCategory;
    state.selection = null;
    state.pricing = null;
    state.promoCode = null;
    state.promoDiscount = null;
    state.bookingId = null;
    state.portalUrl = null;
    state.smsToken = null;
    state.step = 1;

    // Reset SMS verify if it exists
    if (state.smsVerify) {
      state.smsVerify.reset();
    }

    // Update modal title
    const title = $('#modal-space-name');
    if (title) title.textContent = spaceName;

    // Reset form
    const emailInput = $('#booking-email');
    if (emailInput) emailInput.value = '';
    hideError();

    // Show modal
    show($('#booking-modal'));
    goToStep(1);
  }

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------

  async function loadSpaceIds() {
    // Fetch resource IDs from API and populate data-space-id attributes
    try {
      const spaces = await apiGet('/public/spaces/list.json');
      $$('[data-space-category]').forEach((btn) => {
        const category = btn.dataset.spaceCategory;
        const match = spaces.find((s) => s.category === category);
        if (match) {
          btn.dataset.spaceId = match.resource_id;
        }
      });
    } catch (err) {
      console.warn('Could not load space list:', err);
    }
  }

  function init() {
    // Load resource IDs dynamically, then wire buttons
    loadSpaceIds();

    // Wire "Check Availability" buttons
    $$('[data-space-id]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.dataset.spaceId;
        if (!id) {
          showError('Space not available for booking right now. Please try again.');
          show($('#booking-modal'));
          return;
        }
        openBookingModal(
          id,
          btn.dataset.spaceName || 'Space',
          btn.dataset.spaceCategory || ''
        );
      });
    });

    // Close modal
    $$('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', function () {
        hide($('#booking-modal'));
      });
    });

    // Close on backdrop click
    const modal = $('#booking-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) hide(modal);
      });
    }

    // Init sub-flows
    initEmailStep();
    initDetailsStep();
    initBackButtons();
    initCalendarContinue();
    initPromoCode();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
