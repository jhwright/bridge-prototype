/**
 * bridge-modal-booking.js
 * Handles booking modal calendars: month view, time grid, drag-select, redirect.
 * Data-attribute driven — works for any modal with [data-resource-id].
 */
(function () {
  'use strict';

  const SLOT_MINUTES = 30;

  // State per modal (keyed by modal element id)
  const modalStates = {};

  function getState(modalEl) {
    const id = modalEl.id;
    if (!modalStates[id]) {
      modalStates[id] = {
        resourceId: modalEl.dataset.resourceId,
        resourceKey: modalEl.dataset.resourceKey,
        spacePage: modalEl.dataset.spacePage,
        options: null,
        events: [],
        currentYear: null,
        currentMonth: null,
        selectedDate: null,
        selectionStart: null,
        selectionEnd: null,
        isDragging: false,
        optionValues: {},
        pricing: null,
      };
    }
    return modalStates[id];
  }

  // --- API ---

  async function fetchOptions(state) {
    const url = `${BRIDGE_CONFIG.API_BASE}/public/spaces/${state.resourceId}/options.json`;
    const res = await fetch(url);
    return res.json();
  }

  async function fetchCalendar(state) {
    const url = `${BRIDGE_CONFIG.API_BASE}/public/spaces/${state.resourceId}/calendar.json`;
    const res = await fetch(url);
    return res.json();
  }

  // --- Month Calendar ---

  function renderMonth(modalEl) {
    const state = getState(modalEl);
    const calGrid = modalEl.querySelector('.booking-cal-grid');
    if (!calGrid) return;

    const year = state.currentYear;
    const month = state.currentMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = firstDay.getDay(); // 0=Sun

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Build event map: date string -> array of events
    const eventMap = {};
    for (const evt of state.events) {
      const d = evt.start.slice(0, 10);
      if (!eventMap[d]) eventMap[d] = [];
      eventMap[d].push(evt);
    }

    let html = '';
    // Month nav
    html += '<div class="cal-month">';
    html += '<button class="cal-nav cal-prev">&larr;</button>';
    html += `<span>${monthNames[month]} ${year}</span>`;
    html += '<button class="cal-nav cal-next">&rarr;</button>';
    html += '</div>';

    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (const h of dayHeaders) {
      html += `<div class="cal-day header">${h}</div>`;
    }

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
      html += '<div class="cal-day"></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateObj < today;
      const isSelected = state.selectedDate === dateStr;
      const dayEvents = eventMap[dateStr] || [];

      let classes = 'cal-day';
      if (isPast) classes += ' past';
      if (isSelected) classes += ' selected';

      html += `<div class="${classes}" data-date="${dateStr}">`;
      html += d;
      if (dayEvents.length > 0) {
        const status = dayEvents[0].extendedProps?.status || 'approved';
        html += `<span class="event-dot ${status}"></span>`;
      }
      html += '</div>';
    }

    calGrid.innerHTML = html;

    // Bind nav
    const prevBtn = calGrid.querySelector('.cal-prev');
    const nextBtn = calGrid.querySelector('.cal-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        state.currentMonth--;
        if (state.currentMonth < 0) {
          state.currentMonth = 11;
          state.currentYear--;
        }
        renderMonth(modalEl);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        state.currentMonth++;
        if (state.currentMonth > 11) {
          state.currentMonth = 0;
          state.currentYear++;
        }
        renderMonth(modalEl);
      });
    }

    // Bind day clicks
    calGrid.querySelectorAll('.cal-day:not(.header):not(.past)').forEach(function (dayEl) {
      if (!dayEl.dataset.date) return;
      dayEl.addEventListener('click', function () {
        state.selectedDate = dayEl.dataset.date;
        // Update selected class
        calGrid.querySelectorAll('.cal-day.selected').forEach(function (el) {
          el.classList.remove('selected');
        });
        dayEl.classList.add('selected');
        // Collapse calendar and show date bar
        collapseCalendar(modalEl);
        renderTimeGrid(modalEl);
      });
    });
  }

  // --- Calendar Collapse ---

  function collapseCalendar(modalEl) {
    const state = getState(modalEl);
    const calGrid = modalEl.querySelector('.booking-cal-grid');
    if (calGrid) calGrid.classList.add('collapsed');

    // Create or update date bar
    let dateBar = modalEl.querySelector('.selected-date-bar');
    if (!dateBar) {
      dateBar = document.createElement('div');
      dateBar.className = 'selected-date-bar';
      // Insert after cal-legend
      const legend = modalEl.querySelector('.cal-legend');
      if (legend) {
        legend.after(dateBar);
      } else if (calGrid) {
        calGrid.after(dateBar);
      }
    }

    // Format the selected date
    const parts = state.selectedDate.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = dayNames[dateObj.getDay()] + ' ' + monthNames[dateObj.getMonth()] + ' ' + dateObj.getDate();

    dateBar.innerHTML = '<span>' + formatted + '</span><a class="change-date-link">Change</a>';
    dateBar.style.display = '';

    // Bind Change link
    dateBar.querySelector('.change-date-link').addEventListener('click', function () {
      expandCalendar(modalEl);
    });
  }

  function expandCalendar(modalEl) {
    const state = getState(modalEl);
    const calGrid = modalEl.querySelector('.booking-cal-grid');
    if (calGrid) calGrid.classList.remove('collapsed');

    const dateBar = modalEl.querySelector('.selected-date-bar');
    if (dateBar) dateBar.style.display = 'none';

    // Clear time selection
    state.selectionStart = null;
    state.selectionEnd = null;
    state.isDragging = false;
    const timeGrid = modalEl.querySelector('.booking-time-grid');
    if (timeGrid) timeGrid.innerHTML = '';
    updateContinueButton(modalEl);
  }

  // --- Time Grid ---

  function renderTimeGrid(modalEl) {
    const state = getState(modalEl);
    const container = modalEl.querySelector('.booking-time-grid');
    if (!container || !state.options || !state.selectedDate) return;

    const openParts = state.options.opening_time.split(':');
    const closeParts = state.options.closing_time.split(':');
    const openMin = parseInt(openParts[0]) * 60 + parseInt(openParts[1]);
    const closeMin = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1]);

    // Build booked ranges for this date
    const bookedSlots = new Set();
    const slotLabels = {};
    for (const evt of state.events) {
      const evtDate = evt.start.slice(0, 10);
      if (evtDate !== state.selectedDate) continue;
      const evtStart = parseTimeMinutes(evt.start);
      const evtEnd = parseTimeMinutes(evt.end);
      for (let m = evtStart; m < evtEnd; m += SLOT_MINUTES) {
        bookedSlots.add(m);
        slotLabels[m] = evt.title;
      }
    }

    let html = '';
    const totalSlots = (closeMin - openMin) / SLOT_MINUTES;

    for (let i = 0; i < totalSlots; i++) {
      const slotMin = openMin + i * SLOT_MINUTES;
      const isBooked = bookedSlots.has(slotMin);
      const label = formatTime(slotMin);

      html += `<div class="time-grid-label">${label}</div>`;

      let slotClass = 'time-grid-slot';
      if (isBooked) slotClass += ' booked';

      html += `<div class="${slotClass}" data-slot="${slotMin}">`;
      if (isBooked) {
        html += `<span class="booked-label">${slotLabels[slotMin] || 'Booked'}</span>`;
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Reset selection
    state.selectionStart = null;
    state.selectionEnd = null;
    state.isDragging = false;
    updateContinueButton(modalEl);

    // Bind drag-select events
    bindDragSelect(modalEl);
  }

  function bindDragSelect(modalEl) {
    const state = getState(modalEl);
    const container = modalEl.querySelector('.booking-time-grid');
    if (!container) return;

    const slots = container.querySelectorAll('.time-grid-slot:not(.booked)');

    slots.forEach(function (slot) {
      slot.addEventListener('mousedown', function (e) {
        e.preventDefault();
        state.isDragging = true;
        const slotMin = parseInt(slot.dataset.slot);
        state.selectionStart = slotMin;
        state.selectionEnd = slotMin;
        updateSelectionHighlight(modalEl);
      });

      slot.addEventListener('mouseover', function () {
        if (!state.isDragging) return;
        const slotMin = parseInt(slot.dataset.slot);
        state.selectionEnd = clampSelection(state, slotMin);
        updateSelectionHighlight(modalEl);
      });

      slot.addEventListener('mouseup', function () {
        if (!state.isDragging) return;
        state.isDragging = false;
        updateContinueButton(modalEl);
      });

      // Touch support: two-tap
      slot.addEventListener('touchend', function (e) {
        e.preventDefault();
        const slotMin = parseInt(slot.dataset.slot);
        if (state.selectionStart === null) {
          state.selectionStart = slotMin;
          state.selectionEnd = slotMin;
        } else {
          state.selectionEnd = clampSelection(state, slotMin);
        }
        updateSelectionHighlight(modalEl);
        updateContinueButton(modalEl);
      });
    });

    // Global mouseup in case user releases outside a slot
    document.addEventListener('mouseup', function () {
      if (state.isDragging) {
        state.isDragging = false;
        updateContinueButton(modalEl);
      }
    });
  }

  function clampSelection(state, targetMin) {
    const startMin = state.selectionStart;
    if (startMin === null) return targetMin;

    const lo = Math.min(startMin, targetMin);
    const hi = Math.max(startMin, targetMin);

    // Find booked slots in range for current date
    const bookedInRange = [];
    for (const evt of state.events) {
      if (evt.start.slice(0, 10) !== state.selectedDate) continue;
      const evtStart = parseTimeMinutes(evt.start);
      const evtEnd = parseTimeMinutes(evt.end);
      for (let m = evtStart; m < evtEnd; m += SLOT_MINUTES) {
        if (m >= lo && m <= hi) bookedInRange.push(m);
      }
    }

    if (bookedInRange.length === 0) return targetMin;

    // Clamp: if dragging forward, stop before first booked slot
    if (targetMin >= startMin) {
      const firstBooked = Math.min(...bookedInRange);
      return Math.min(targetMin, firstBooked - SLOT_MINUTES);
    } else {
      // Dragging backward, stop after last booked slot
      const lastBooked = Math.max(...bookedInRange);
      return Math.max(targetMin, lastBooked + SLOT_MINUTES);
    }
  }

  function updateSelectionHighlight(modalEl) {
    const state = getState(modalEl);
    const container = modalEl.querySelector('.booking-time-grid');
    if (!container) return;

    const lo = Math.min(state.selectionStart || 0, state.selectionEnd || 0);
    const hi = Math.max(state.selectionStart || 0, state.selectionEnd || 0);

    container.querySelectorAll('.time-grid-slot').forEach(function (slot) {
      const slotMin = parseInt(slot.dataset.slot);
      if (!isNaN(slotMin) && slotMin >= lo && slotMin <= hi && !slot.classList.contains('booked')) {
        slot.classList.add('selected');
      } else {
        slot.classList.remove('selected');
      }
    });
  }

  function updateContinueButton(modalEl) {
    const state = getState(modalEl);
    const btn = modalEl.querySelector('.btn-continue-booking');
    if (!btn) return;
    const hasSelection = state.selectionStart !== null && state.selectionEnd !== null;
    btn.disabled = !hasSelection;

    if (hasSelection) {
      const lo = Math.min(state.selectionStart, state.selectionEnd);
      const hi = Math.max(state.selectionStart, state.selectionEnd) + SLOT_MINUTES;
      btn.textContent = formatTime(lo) + ' – ' + formatTime(hi) + '  ·  Continue';
    } else {
      btn.textContent = 'Continue to Booking';
    }
  }

  // --- Helpers ---

  function parseTimeMinutes(isoStr) {
    const timePart = isoStr.slice(11, 16);
    const parts = timePart.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  function formatTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  // --- Continue Button Handler ---

  function handleContinue(modalEl) {
    const state = getState(modalEl);
    if (!state.selectedDate || state.selectionStart === null || state.selectionEnd === null) return;
    showInvoice(modalEl);
  }

  function minutesToTimeStr(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2);
  }

  // --- Inline Invoice ---

  function showInvoice(modalEl) {
    const state = getState(modalEl);
    const section = modalEl.querySelector('.booking-invoice-section');
    if (!section) return;

    // Initialize option default values
    if (state.options && state.options.options) {
      for (var opt of state.options.options) {
        if (!(opt.key in state.optionValues)) {
          state.optionValues[opt.key] = opt.default !== undefined ? opt.default : (opt.type === 'toggle' ? false : '');
        }
      }
    }

    section.style.display = '';
    renderInvoiceContent(modalEl);
    fetchAndRenderPricing(modalEl);
  }

  function renderInvoiceContent(modalEl) {
    const state = getState(modalEl);
    const section = modalEl.querySelector('.booking-invoice-section');
    if (!section) return;

    let html = '';

    // Addons
    if (state.options && state.options.options && state.options.options.length > 0) {
      html += '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px">Add-Ons</h4>';
      for (var opt of state.options.options) {
        if (opt.depends_on && !state.optionValues[opt.depends_on]) continue;

        html += '<div class="addon-option">';
        if (opt.type === 'toggle') {
          html += '<label><input type="checkbox" data-addon-key="' + opt.key + '"'
            + (state.optionValues[opt.key] ? ' checked' : '') + '>'
            + '<span>' + opt.label + '</span></label>';
          if (opt.price_note) html += '<span class="addon-price-note">' + opt.price_note + '</span>';
        } else if (opt.type === 'select') {
          html += '<label>' + opt.label + '</label><select data-addon-key="' + opt.key + '">';
          for (var c of (opt.choices || [])) {
            html += '<option value="' + c.value + '"'
              + (state.optionValues[opt.key] === c.value ? ' selected' : '') + '>'
              + c.label + '</option>';
          }
          html += '</select>';
          if (opt.price_note) html += '<span class="addon-price-note">' + opt.price_note + '</span>';
        } else if (opt.type === 'number') {
          html += '<label>' + opt.label + '</label>';
          html += '<input type="number" min="0" data-addon-key="' + opt.key + '" value="' + (state.optionValues[opt.key] || 0) + '">';
        }
        html += '</div>';
      }
    }

    // Pricing lines container
    html += '<div class="pricing-lines" style="margin-top:12px"></div>';

    // Special notes
    html += '<div style="margin-top:12px"><label style="font-size:13px;font-weight:500">Special Notes</label>';
    html += '<textarea class="special-notes" placeholder="Any special requests or event details..."></textarea></div>';

    // Apply form
    html += '<div class="apply-form">';
    html += '<div class="apply-error"></div>';
    html += '<input class="apply-name" type="text" placeholder="Your name">';
    html += '<input class="apply-email" type="email" placeholder="Email address">';
    html += '<button class="btn-apply" type="button">Submit Application</button>';
    html += '</div>';

    section.innerHTML = html;

    // Bind addon change events
    section.querySelectorAll('[data-addon-key]').forEach(function (el) {
      el.addEventListener('change', function () {
        var key = el.dataset.addonKey;
        if (el.type === 'checkbox') {
          state.optionValues[key] = el.checked;
        } else if (el.type === 'number') {
          state.optionValues[key] = parseInt(el.value, 10) || 0;
        } else {
          state.optionValues[key] = el.value;
        }
        renderInvoiceContent(modalEl);
        fetchAndRenderPricing(modalEl);
      });
    });

    // Bind apply button
    var applyBtn = section.querySelector('.btn-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        submitApplication(modalEl);
      });
    }
  }

  async function fetchAndRenderPricing(modalEl) {
    const state = getState(modalEl);
    const section = modalEl.querySelector('.booking-invoice-section');
    if (!section) return;
    const pricingEl = section.querySelector('.pricing-lines');
    if (!pricingEl) return;

    const lo = Math.min(state.selectionStart, state.selectionEnd);
    const hi = Math.max(state.selectionStart, state.selectionEnd) + SLOT_MINUTES;
    const startTime = minutesToTimeStr(lo);
    const endTime = minutesToTimeStr(hi);

    var body = {
      start_at: state.selectedDate + 'T' + startTime + ':00',
      end_at: state.selectedDate + 'T' + endTime + ':00',
    };
    for (var key in state.optionValues) {
      body[key] = state.optionValues[key];
    }

    try {
      var url = BRIDGE_CONFIG.API_BASE + '/public/spaces/' + state.resourceId + '/calculate-price/';
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      var pricing = await res.json();
      state.pricing = pricing;
      renderPricingLines(pricingEl, pricing);
    } catch (err) {
      console.error('[bridge-modal-booking] Pricing error:', err);
      pricingEl.innerHTML = '<p style="color:#dc2626;font-size:13px">Could not calculate pricing.</p>';
    }
  }

  function renderPricingLines(el, p) {
    var html = '';
    html += pricingLine('Base rental', p.hours + ' hrs × ' + formatCurrency(p.hourly_rate) + '/hr', p.base_rental);
    if (p.peak_amount > 0) html += pricingLine('Peak surcharge', '', p.peak_amount);
    if (p.bar_amount > 0) html += pricingLine('Bar service', '', p.bar_amount);
    if (p.snack_amount > 0) html += pricingLine('Snacks', '', p.snack_amount);
    if (p.stage_amount > 0) html += pricingLine('Stage', '', p.stage_amount);
    if (p.curtain_amount > 0) html += pricingLine('Privacy curtains', '', p.curtain_amount);
    if (p.setup_amount > 0) html += pricingLine('Setup', '', p.setup_amount);
    if (p.teardown_amount > 0) html += pricingLine('Teardown', '', p.teardown_amount);

    html += '<div class="pricing-divider"></div>';
    html += pricingLine('Subtotal', '', p.subtotal, true);

    if (p.discount_amount > 0) {
      html += pricingLine('Promo discount', '', -p.discount_amount, false, 'discount');
    }

    html += '<div class="pricing-divider thick"></div>';
    html += pricingLine('Deposit (' + p.deposit_percentage + '%)', 'Due at booking', p.deposit_amount, true, 'highlight');
    html += pricingLine('Balance due', 'At event', p.balance_due);

    el.innerHTML = html;
  }

  function pricingLine(label, detail, amount, bold, cls) {
    var classes = 'pricing-line';
    if (bold) classes += ' bold';
    if (cls) classes += ' ' + cls;
    var sign = amount < 0 ? '-' : '';
    return '<div class="' + classes + '">'
      + '<div><span>' + label + '</span>'
      + (detail ? '<span style="font-size:11px;color:#8a7e72;margin-left:4px">' + detail + '</span>' : '')
      + '</div>'
      + '<span>' + sign + formatCurrency(Math.abs(amount)) + '</span>'
      + '</div>';
  }

  async function submitApplication(modalEl) {
    const state = getState(modalEl);
    const section = modalEl.querySelector('.booking-invoice-section');
    if (!section) return;

    var applyBtn = section.querySelector('.btn-apply');
    var errEl = section.querySelector('.apply-error');
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Submitting...';
    }
    if (errEl) errEl.style.display = 'none';

    var lo = Math.min(state.selectionStart, state.selectionEnd);
    var hi = Math.max(state.selectionStart, state.selectionEnd) + SLOT_MINUTES;
    var startTime = minutesToTimeStr(lo);
    var endTime = minutesToTimeStr(hi);

    var data = {
      last_name: (section.querySelector('.apply-name') || {}).value || '',
      email: (section.querySelector('.apply-email') || {}).value || '',
      event_description: (section.querySelector('.special-notes') || {}).value || '',
      selected_dates: [{
        start: state.selectedDate + 'T' + startTime + ':00',
        end: state.selectedDate + 'T' + endTime + ':00',
      }],
    };

    for (var key in state.optionValues) {
      data[key] = state.optionValues[key];
    }

    try {
      var url = BRIDGE_CONFIG.API_BASE + '/public/spaces/' + state.resourceId + '/apply/';
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      var result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Application failed');

      // Hide invoice, show confirmation
      section.style.display = 'none';
      var confirmation = modalEl.querySelector('.booking-confirmation');
      if (confirmation) {
        confirmation.style.display = '';
        confirmation.innerHTML = '<h3>Application Submitted!</h3>'
          + '<p>We\'ll review your request and get back to you shortly.</p>'
          + '<p style="font-size:12px;color:#9ca3af">Reference: ' + (result.application_id || '') + '</p>';
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.style.display = '';
      }
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Submit Application';
      }
    }
  }

  // --- Init ---

  async function initModal(modalEl) {
    const state = getState(modalEl);
    if (state.options) return; // Already initialized

    try {
      const [options, events] = await Promise.all([
        fetchOptions(state),
        fetchCalendar(state),
      ]);
      state.options = options;
      state.events = events;

      // Set current month to today
      const now = new Date();
      state.currentYear = now.getFullYear();
      state.currentMonth = now.getMonth();

      renderMonth(modalEl);

      // Bind continue button
      const btn = modalEl.querySelector('.btn-continue-booking');
      if (btn) {
        btn.addEventListener('click', function () {
          handleContinue(modalEl);
        });
      }
    } catch (err) {
      console.error('[bridge-modal-booking] Failed to initialize:', err);
    }
  }

  // --- Auto-Init on Modal Open ---

  // Watch for .open class being added to booking modals
  function observeModals() {
    const modals = document.querySelectorAll('[data-resource-id]');
    if (modals.length === 0) return;

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const el = mutation.target;
          if (el.classList.contains('open') && el.dataset.resourceId) {
            initModal(el);
          }
        }
      }
    });

    modals.forEach(function (modal) {
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeModals);
  } else {
    observeModals();
  }
})();
