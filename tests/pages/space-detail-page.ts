import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page object for per-space pages (spaces/dance-floor.html, spaces/courtyard.html).
 * Calendar hero + invoice modal with API-driven add-ons.
 */
export class SpaceDetailPage extends BasePage {
  // Space info
  readonly spaceName: Locator;
  readonly spacePrice: Locator;
  readonly backLink: Locator;

  // Calendar
  readonly calendarContainer: Locator;
  readonly calendarHint: Locator;
  readonly calendarError: Locator;
  readonly availabilityHeading: Locator;

  // Invoice modal
  readonly invoiceModal: Locator;
  readonly invoiceClose: Locator;
  readonly invoiceSummary: Locator;
  readonly addonOptions: Locator;
  readonly pricingLines: Locator;

  // Promo code
  readonly promoInput: Locator;
  readonly promoApply: Locator;
  readonly promoApplied: Locator;
  readonly promoRemove: Locator;

  // Apply flow
  readonly applySection: Locator;
  readonly applyBtn: Locator;
  readonly applyForm: Locator;
  readonly applyName: Locator;
  readonly applyEmail: Locator;
  readonly applyEventType: Locator;
  readonly applyDescription: Locator;
  readonly applyAttendance: Locator;
  readonly applySmsVerify: Locator;
  readonly applyError: Locator;
  readonly submitApplication: Locator;

  // Payment flow
  readonly paymentSection: Locator;
  readonly stripeCardContainer: Locator;
  readonly payNowBtn: Locator;
  readonly paymentError: Locator;

  // Confirmation
  readonly bookingConfirmation: Locator;

  constructor(page: Page) {
    super(page);

    this.spaceName = page.locator('h1');
    this.spacePrice = page.locator('.text-bridge-orange.font-semibold.text-lg');
    this.backLink = page.locator('a', { hasText: 'All Spaces' });

    this.calendarContainer = page.locator('#space-calendar');
    this.calendarHint = page.locator('#calendar-hint');
    this.calendarError = page.locator('#calendar-error');
    this.availabilityHeading = page.locator('h2', { hasText: 'Availability' });

    this.invoiceModal = page.locator('#invoice-modal');
    this.invoiceClose = page.locator('[data-close-invoice]');
    this.invoiceSummary = page.locator('#invoice-summary');
    this.addonOptions = page.locator('#addon-options');
    this.pricingLines = page.locator('#pricing-lines');

    this.promoInput = page.locator('#promo-input');
    this.promoApply = page.locator('#promo-apply');
    this.promoApplied = page.locator('#promo-applied');
    this.promoRemove = page.locator('#promo-remove');

    this.applySection = page.locator('#apply-section');
    this.applyBtn = page.locator('#apply-btn');
    this.applyForm = page.locator('#apply-form');
    this.applyName = page.locator('#apply-name');
    this.applyEmail = page.locator('#apply-email');
    this.applyEventType = page.locator('#apply-event-type');
    this.applyDescription = page.locator('#apply-description');
    this.applyAttendance = page.locator('#apply-attendance');
    this.applySmsVerify = page.locator('#apply-sms-verify');
    this.applyError = page.locator('#apply-error');
    this.submitApplication = page.locator('#submit-application');

    this.paymentSection = page.locator('#payment-section');
    this.stripeCardContainer = page.locator('#stripe-card-container');
    this.payNowBtn = page.locator('#pay-now-btn');
    this.paymentError = page.locator('#payment-error');

    this.bookingConfirmation = page.locator('#booking-confirmation');
  }

  async goto(spacePath: string = 'spaces/dance-floor.html'): Promise<void> {
    await this.page.goto(`/${spacePath}`);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
