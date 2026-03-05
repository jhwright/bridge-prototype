import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page object for storage.html — standalone storage page with
 * filter bar (size dropdown + amenity chips) and unit cards.
 */
export class StoragePage extends BasePage {
  // Filter bar
  readonly filterSize: Locator;
  readonly filterChips: Locator;
  readonly filterResults: Locator;
  readonly unitList: Locator;

  // Unit cards
  readonly unitCards: Locator;

  // E-truck banner
  readonly eTruckBanner: Locator;

  constructor(page: Page) {
    super(page);

    this.filterSize = page.locator('#filter-size');
    this.filterChips = page.locator('.filter-chip');
    this.filterResults = page.locator('#filter-results');
    this.unitList = page.locator('#unit-list');
    this.unitCards = page.locator('.unit-card');
    this.eTruckBanner = page.locator('text=E-Truck').locator('..');
  }

  async goto(): Promise<void> {
    await this.page.goto('/storage.html');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Select a size from the dropdown */
  async selectSize(value: string): Promise<void> {
    await this.filterSize.waitFor({ state: 'visible' });
    await this.filterSize.selectOption(value);
  }

  /** Toggle a filter chip by data-filter attribute */
  async toggleChip(filter: string): Promise<void> {
    await this.page.locator(`.filter-chip[data-filter="${filter}"]`).click();
  }

  /** Get a filter chip locator */
  chip(filter: string): Locator {
    return this.page.locator(`.filter-chip[data-filter="${filter}"]`);
  }

  /** Get a unit card by data-sqft */
  unitCardBySqft(sqft: string): Locator {
    return this.page.locator(`.unit-card[data-sqft="${sqft}"]`);
  }

  /** Get a unit card by data-amenities containing a value */
  unitCardByAmenity(amenity: string): Locator {
    return this.page.locator(`.unit-card[data-amenities*="${amenity}"]`);
  }

  /** Click a unit card to expand its details */
  async expandUnit(index: number): Promise<void> {
    await this.unitCards.nth(index).click();
  }

  /** Get the hidden details section of a unit card */
  unitDetails(index: number): Locator {
    return this.unitCards.nth(index).locator('.unit-details');
  }

  /** Get the current result count text */
  async getResultCount(): Promise<string> {
    return (await this.filterResults.textContent()) ?? '';
  }
}
