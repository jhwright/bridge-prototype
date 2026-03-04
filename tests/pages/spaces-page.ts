import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page object for spaces.html — space cards and booking modal.
 * Also covers the booking flow (6-step modal from bridge-booking.js).
 */
export class SpacesPage extends BasePage {
  // Space cards
  readonly spaceCards: Locator;

  // Booking modal
  readonly bookingModal: Locator;
  readonly bookingSteps: Locator;
  readonly bookingClose: Locator;

  // Step 1: Email
  readonly emailInput: Locator;
  readonly emailSubmit: Locator;

  // Step 2: Calendar
  readonly calendarContainer: Locator;
  readonly dateSummary: Locator;
  readonly timeSummary: Locator;
  readonly hoursSummary: Locator;
  readonly priceSummary: Locator;
  readonly calendarContinue: Locator;

  // Step 3: Event Details
  readonly eventType: Locator;
  readonly eventName: Locator;
  readonly eventDescription: Locator;
  readonly expectedAttendance: Locator;
  readonly specialRequests: Locator;
  readonly amenityBarService: Locator;
  readonly amenitySnacks: Locator;
  readonly snackCount: Locator;
  readonly amenityStage: Locator;
  readonly amenityCurtains: Locator;
  readonly amenitySetup: Locator;
  readonly amenityTeardown: Locator;
  readonly detailsContinue: Locator;

  // Step 4: Verify (contact name + SMS)
  readonly contactName: Locator;
  readonly phoneInput: Locator;
  readonly sendCodeButton: Locator;
  readonly codeInput: Locator;
  readonly verifyButton: Locator;
  readonly verifyContinue: Locator;

  // Step 5: Payment
  readonly promoInput: Locator;
  readonly promoApply: Locator;
  readonly promoRemove: Locator;
  readonly stripeCardElement: Locator;
  readonly paymentSummary: Locator;
  readonly paymentSubmit: Locator;

  // Step 6: Confirmation
  readonly confirmationMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Space cards (Tailwind card pattern)
    this.spaceCards = page.locator('.bg-white.rounded-xl.shadow-md');

    // Booking modal — bridge-booking.js creates this
    this.bookingModal = page.locator('#booking-modal, [data-booking-modal]');
    this.bookingSteps = page.locator('.booking-step');
    this.bookingClose = page.locator('.booking-close, [data-booking-close]');

    // Step 1
    this.emailInput = page.locator('#booking-email, [name="booking-email"]');
    this.emailSubmit = page.locator('#booking-email-submit, .booking-step [type="submit"]').first();

    // Step 2
    this.calendarContainer = page.locator('#booking-calendar, [data-testid="fullcalendar-mock"]');
    this.dateSummary = page.locator('.booking-date, #booking-date');
    this.timeSummary = page.locator('.booking-time, #booking-time');
    this.hoursSummary = page.locator('.booking-hours, #booking-hours');
    this.priceSummary = page.locator('.booking-price, #booking-price');
    this.calendarContinue = page.locator('#calendar-continue, .calendar-continue');

    // Step 3
    this.eventType = page.locator('#event-type, [name="event-type"]');
    this.eventName = page.locator('#event-name, [name="event-name"]');
    this.eventDescription = page.locator('#event-description, [name="event-description"]');
    this.expectedAttendance = page.locator('#expected-attendance, [name="expected-attendance"]');
    this.specialRequests = page.locator('#special-requests, [name="special-requests"]');
    this.amenityBarService = page.locator('#bar-service, [name="bar-service"]');
    this.amenitySnacks = page.locator('#snacks, [name="snacks"]');
    this.snackCount = page.locator('#snack-count, [name="snack-count"]');
    this.amenityStage = page.locator('#stage, [name="stage"]');
    this.amenityCurtains = page.locator('#curtains, [name="curtains"]');
    this.amenitySetup = page.locator('#setup, [name="setup"]');
    this.amenityTeardown = page.locator('#teardown, [name="teardown"]');
    this.detailsContinue = page.locator('#details-continue, .details-continue');

    // Step 4
    this.contactName = page.locator('#contact-name, [name="contact-name"]');
    this.phoneInput = page.locator('#verify-phone, [name="phone"]');
    this.sendCodeButton = page.locator('#send-code, .send-code');
    this.codeInput = page.locator('#verify-code, [name="code"]');
    this.verifyButton = page.locator('#verify-submit, .verify-submit');
    this.verifyContinue = page.locator('#verify-continue, .verify-continue');

    // Step 5
    this.promoInput = page.locator('#promo-input, [name="promo-code"]');
    this.promoApply = page.locator('#promo-apply, .promo-apply');
    this.promoRemove = page.locator('#promo-remove, .promo-remove');
    this.stripeCardElement = page.locator('#card-element, #payment-element');
    this.paymentSummary = page.locator('.payment-summary, #payment-summary');
    this.paymentSubmit = page.locator('#payment-submit, .payment-submit');

    // Step 6
    this.confirmationMessage = page.locator('.booking-confirmation, #booking-confirmation');
  }

  async goto(): Promise<void> {
    await this.page.goto('/spaces.html');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Get a space card by its heading text */
  spaceCard(name: string): Locator {
    return this.page.locator('.bg-white.rounded-xl.shadow-md', { hasText: name });
  }

  /** Click "Check Availability" on a space card */
  async checkAvailability(spaceName: string): Promise<void> {
    await this.spaceCard(spaceName).getByRole('link', { name: /check availability/i }).click();
  }

  /** Click "Ask a Question" on a space card */
  async askQuestion(spaceName: string): Promise<void> {
    await this.spaceCard(spaceName).getByRole('link', { name: /ask a question/i }).click();
  }

  // --- Booking flow helpers ---

  /** Step 1: Enter email and submit */
  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.emailSubmit.click();
  }

  /** Step 3: Fill event details */
  async fillEventDetails(data: {
    eventType: string;
    eventName?: string;
    description: string;
    attendance: number;
    specialRequests?: string;
  }): Promise<void> {
    await this.eventType.selectOption(data.eventType);
    if (data.eventName) await this.eventName.fill(data.eventName);
    await this.eventDescription.fill(data.description);
    await this.expectedAttendance.fill(String(data.attendance));
    if (data.specialRequests) await this.specialRequests.fill(data.specialRequests);
  }

  /** Step 3: Toggle an amenity checkbox */
  async toggleAmenity(amenity: 'bar-service' | 'snacks' | 'stage' | 'curtains' | 'setup' | 'teardown'): Promise<void> {
    const map: Record<string, Locator> = {
      'bar-service': this.amenityBarService,
      'snacks': this.amenitySnacks,
      'stage': this.amenityStage,
      'curtains': this.amenityCurtains,
      'setup': this.amenitySetup,
      'teardown': this.amenityTeardown,
    };
    await map[amenity].click();
  }

  /** Step 4: Complete SMS verification */
  async completeVerification(name: string, phone: string, code: string): Promise<void> {
    await this.contactName.fill(name);
    await this.phoneInput.fill(phone);
    await this.sendCodeButton.click();
    await this.codeInput.fill(code);
    await this.verifyButton.click();
  }

  /** Step 5: Apply promo code */
  async applyPromo(code: string): Promise<void> {
    await this.promoInput.fill(code);
    await this.promoApply.click();
  }

  /** Step 5: Submit payment */
  async submitPayment(): Promise<void> {
    await this.paymentSubmit.click();
  }
}
