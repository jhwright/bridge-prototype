import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page object for events.html — event cards and SMS join form.
 */
export class EventsPage extends BasePage {
  // Event listings
  readonly eventsList: Locator;
  readonly eventCards: Locator;

  // SMS join section
  readonly smsPhoneInput: Locator;
  readonly smsJoinButton: Locator;

  constructor(page: Page) {
    super(page);

    this.eventsList = page.locator('#events-list');
    this.eventCards = page.locator('#events-list .bg-white, #events-list [class*="rounded"]');
    this.smsPhoneInput = page.getByRole('textbox', { name: /phone/i });
    this.smsJoinButton = page.getByRole('button', { name: /join/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/events.html');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Get an event card by its title text */
  eventCard(title: string): Locator {
    return this.eventsList.locator('div', { hasText: title }).first();
  }

  /** Get the RSVP button for an event by title */
  rsvpButton(title: string): Locator {
    return this.eventCard(title).getByRole('button', { name: /rsvp/i });
  }

  /** Fill the SMS join form and submit */
  async joinViaSms(phone: string): Promise<void> {
    await this.smsPhoneInput.fill(phone);
    await this.smsJoinButton.click();
  }
}
