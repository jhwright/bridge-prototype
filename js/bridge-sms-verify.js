/**
 * Bridge Storage — SMS Verification Component
 *
 * Reusable phone verification flow: enter phone → receive OTP → enter code.
 * Returns a short-lived session token for authenticated API calls.
 *
 * Usage:
 *   const verify = new BridgeSMSVerify({
 *     container: document.getElementById('sms-verify-container'),
 *     apiBase: BRIDGE_CONFIG.API_BASE,
 *     sendEndpoint: BRIDGE_CONFIG.SMS_VERIFY_SEND,
 *     confirmEndpoint: BRIDGE_CONFIG.SMS_VERIFY_CONFIRM,
 *     onVerified: (token, phone) => { ... },
 *   });
 *
 * Dependencies: js/config.js
 */

/* global BRIDGE_CONFIG */

// eslint-disable-next-line no-unused-vars
class BridgeSMSVerify {
  constructor(opts) {
    this.container = opts.container;
    this.apiBase = opts.apiBase || '';
    this.sendEndpoint = opts.sendEndpoint || '/public/auth/sms-verify/send/';
    this.confirmEndpoint = opts.confirmEndpoint || '/public/auth/sms-verify/confirm/';
    this.onVerified = opts.onVerified || function () {};
    this.phone = '';
    this.token = null;
    this.resendTimer = null;
    this.resendSeconds = 0;

    this.render();
    this.bind();
  }

  render() {
    this.container.innerHTML = `
      <div data-sms-phase="phone">
        <label for="sms-phone" class="block text-sm font-medium text-bridge-dark mb-1">Phone number</label>
        <p class="text-xs text-gray-500 mb-2">We'll send a 6-digit verification code to this number.</p>
        <div class="flex gap-2">
          <input type="tel" id="sms-phone" placeholder="(510) 555-0123" required
            class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange">
          <button type="button" id="sms-send-btn"
            class="text-white bg-bridge-orange hover:bg-orange-700 font-semibold rounded-lg text-sm px-5 py-2.5 transition-colors whitespace-nowrap">
            Send Code
          </button>
        </div>
        <p id="sms-send-error" class="text-sm text-red-600 mt-1 hidden"></p>
      </div>

      <div data-sms-phase="code" class="hidden">
        <p class="text-sm text-gray-600 mb-2">
          Enter the 6-digit code sent to <span id="sms-phone-display" class="font-semibold"></span>
        </p>
        <div class="flex gap-1 justify-center mb-3" id="sms-code-inputs">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="0">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="1">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="2">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="3">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="4">
          <input type="text" inputmode="numeric" maxlength="1" class="sms-digit w-11 h-12 text-center text-lg font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-bridge-orange focus:border-bridge-orange" data-index="5">
        </div>
        <div class="flex items-center justify-between">
          <button type="button" id="sms-change-phone" class="text-sm text-gray-500 hover:text-bridge-dark underline">
            Change number
          </button>
          <button type="button" id="sms-resend-btn" class="text-sm text-bridge-orange hover:underline disabled:text-gray-400 disabled:no-underline" disabled>
            Resend code (<span id="sms-resend-countdown">60</span>s)
          </button>
        </div>
        <p id="sms-code-error" class="text-sm text-red-600 mt-2 hidden"></p>
      </div>

      <div data-sms-phase="verified" class="hidden">
        <div class="flex items-center gap-2 bg-green-50 rounded-lg p-3">
          <svg class="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            <span class="text-sm font-medium text-green-800">Phone verified</span>
            <span id="sms-verified-phone" class="text-sm text-green-600 ml-1"></span>
          </div>
        </div>
      </div>
    `;
  }

  bind() {
    const sendBtn = this.container.querySelector('#sms-send-btn');
    const phoneInput = this.container.querySelector('#sms-phone');
    const changeBtn = this.container.querySelector('#sms-change-phone');
    const resendBtn = this.container.querySelector('#sms-resend-btn');
    const digits = this.container.querySelectorAll('.sms-digit');

    sendBtn.addEventListener('click', () => this.sendCode());
    phoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendCode();
      }
    });
    changeBtn.addEventListener('click', () => this.showPhase('phone'));
    resendBtn.addEventListener('click', () => this.sendCode());

    // Auto-advance digit inputs
    digits.forEach((input, i) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1);
        if (val && i < 5) {
          digits[i + 1].focus();
        }
        this.tryAutoSubmit();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) {
          digits[i - 1].focus();
        }
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        for (let j = 0; j < 6 && j < text.length; j++) {
          digits[j].value = text[j];
        }
        if (text.length >= 6) {
          digits[5].focus();
          this.tryAutoSubmit();
        } else if (text.length > 0) {
          digits[Math.min(text.length, 5)].focus();
        }
      });
    });
  }

  showPhase(phase) {
    this.container.querySelectorAll('[data-sms-phase]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.smsPhase !== phase);
    });
    if (phase === 'phone') {
      this.clearTimer();
      const input = this.container.querySelector('#sms-phone');
      if (input) input.focus();
    }
    if (phase === 'code') {
      const firstDigit = this.container.querySelector('.sms-digit[data-index="0"]');
      if (firstDigit) firstDigit.focus();
    }
  }

  getCode() {
    return Array.from(this.container.querySelectorAll('.sms-digit'))
      .map((el) => el.value)
      .join('');
  }

  clearDigits() {
    this.container.querySelectorAll('.sms-digit').forEach((el) => {
      el.value = '';
    });
  }

  showError(phase, msg) {
    const id = phase === 'phone' ? '#sms-send-error' : '#sms-code-error';
    const el = this.container.querySelector(id);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  hideErrors() {
    this.container.querySelectorAll('#sms-send-error, #sms-code-error').forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  async sendCode() {
    const phoneInput = this.container.querySelector('#sms-phone');
    const phone = (phoneInput ? phoneInput.value : '').trim();
    if (!phone) {
      this.showError('phone', 'Please enter a phone number.');
      return;
    }

    // Basic phone validation: at least 10 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      this.showError('phone', 'Please enter a valid phone number (at least 10 digits).');
      return;
    }

    this.phone = phone;
    this.hideErrors();

    const sendBtn = this.container.querySelector('#sms-send-btn');
    const resendBtn = this.container.querySelector('#sms-resend-btn');
    const activeBtn = sendBtn && !sendBtn.closest('.hidden') ? sendBtn : resendBtn;

    if (activeBtn) {
      activeBtn.disabled = true;
      activeBtn.dataset.origText = activeBtn.textContent;
      activeBtn.textContent = 'Sending...';
    }

    try {
      const resp = await fetch(this.apiBase + this.sendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        const msg = data.error || 'Could not send verification code.';
        if (this.container.querySelector('[data-sms-phase="code"]').classList.contains('hidden')) {
          this.showError('phone', msg);
        } else {
          this.showError('code', msg);
        }
        return;
      }

      // Show code entry
      this.container.querySelector('#sms-phone-display').textContent = phone;
      this.clearDigits();
      this.showPhase('code');
      this.startResendTimer();
    } catch (err) {
      this.showError('phone', 'Network error. Please try again.');
    } finally {
      if (activeBtn) {
        activeBtn.disabled = false;
        activeBtn.textContent = activeBtn.dataset.origText || 'Send Code';
      }
    }
  }

  async tryAutoSubmit() {
    const code = this.getCode();
    if (code.length !== 6) return;

    this.hideErrors();

    try {
      const resp = await fetch(this.apiBase + this.confirmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone, code: code }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        this.showError('code', data.error || 'Invalid or expired code.');
        this.clearDigits();
        const firstDigit = this.container.querySelector('.sms-digit[data-index="0"]');
        if (firstDigit) firstDigit.focus();
        return;
      }

      this.token = data.session_token;
      this.clearTimer();

      // Show verified state
      this.container.querySelector('#sms-verified-phone').textContent = this.phone;
      this.showPhase('verified');

      this.onVerified(this.token, this.phone);
    } catch (err) {
      this.showError('code', 'Network error. Please try again.');
    }
  }

  startResendTimer() {
    this.clearTimer();
    this.resendSeconds = 60;
    const resendBtn = this.container.querySelector('#sms-resend-btn');
    const countdown = this.container.querySelector('#sms-resend-countdown');

    if (resendBtn) resendBtn.disabled = true;

    this.resendTimer = setInterval(() => {
      this.resendSeconds--;
      if (countdown) countdown.textContent = this.resendSeconds;

      if (this.resendSeconds <= 0) {
        this.clearTimer();
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend code';
        }
      }
    }, 1000);
  }

  clearTimer() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  /** Check if this instance has a valid verification token */
  isVerified() {
    return !!this.token;
  }

  /** Get the session token (null if not verified) */
  getToken() {
    return this.token;
  }

  /** Get the verified phone number */
  getPhone() {
    return this.phone;
  }

  /** Reset to initial state */
  reset() {
    this.token = null;
    this.phone = '';
    this.clearTimer();
    this.clearDigits();
    this.hideErrors();
    const phoneInput = this.container.querySelector('#sms-phone');
    if (phoneInput) phoneInput.value = '';
    this.showPhase('phone');
  }

  /** Pre-fill the phone number (e.g. from a previous step) */
  setPhone(phone) {
    const phoneInput = this.container.querySelector('#sms-phone');
    if (phoneInput) phoneInput.value = phone;
  }
}
