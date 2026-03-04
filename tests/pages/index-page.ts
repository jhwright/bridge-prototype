import { Page, Locator } from '@playwright/test';

/**
 * Page object for index.html — single-page app with 5 screens,
 * Golden Paths engine, modals, and bottom nav.
 */
export class IndexPage {
  readonly page: Page;

  // Screen tabs (top nav)
  readonly screenTabs: Locator;

  // Bottom nav
  readonly bottomNav: Locator;
  readonly bottomNavItems: Locator;

  // Screens
  readonly homeScreen: Locator;
  readonly storeScreen: Locator;
  readonly makeScreen: Locator;
  readonly gatherScreen: Locator;
  readonly profileScreen: Locator;

  // Home screen
  readonly hero: Locator;
  readonly muralGallery: Locator;
  readonly identityCards: Locator;
  readonly peopleCarousel: Locator;

  // Store screen — filter bar
  readonly filterSize: Locator;
  readonly filterChips: Locator;
  readonly filterResults: Locator;
  readonly unitsSpinner: Locator;
  readonly unitsErrorBanner: Locator;
  readonly unitsDynamic: Locator;
  readonly unitsStatic: Locator;

  // Make screen
  readonly makePills: Locator;
  readonly makeCards: Locator;

  // Gather screen
  readonly spaceCards: Locator;
  readonly eventCards: Locator;
  readonly smsInputRow: Locator;

  // Profile screen
  readonly profileMenu: Locator;
  readonly portalLoginView: Locator;
  readonly portalCustomerView: Locator;
  readonly loginForm: Locator;

  // Golden Paths
  readonly gpFab: Locator;
  readonly gpOverlay: Locator;
  readonly gpCards: Locator;
  readonly gpTracker: Locator;
  readonly gpTrackerTitle: Locator;
  readonly gpTrackerSteps: Locator;
  readonly gpTrackerLabel: Locator;
  readonly gpPrev: Locator;
  readonly gpNext: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.screenTabs = page.locator('.screen-tabs button').first();
    this.bottomNav = page.locator('.bottom-nav').first();
    this.bottomNavItems = page.locator('.bottom-nav .bottom-nav-item');

    // Screens
    this.homeScreen = page.locator('#screen-home');
    this.storeScreen = page.locator('#screen-store');
    this.makeScreen = page.locator('#screen-make');
    this.gatherScreen = page.locator('#screen-gather');
    this.profileScreen = page.locator('#screen-profile');

    // Home
    this.hero = page.locator('.hero');
    this.muralGallery = page.locator('.mural-scroll');
    this.identityCards = page.locator('.identity-card');
    this.peopleCarousel = page.locator('#people-carousel');

    // Store filters
    this.filterSize = page.locator('#filter-size');
    this.filterChips = page.locator('#filter-chips');
    this.filterResults = page.locator('#filter-results');
    this.unitsSpinner = page.locator('#units-spinner');
    this.unitsErrorBanner = page.locator('#units-error-banner');
    this.unitsDynamic = page.locator('#units-dynamic');
    this.unitsStatic = page.locator('#units-static');

    // Make
    this.makePills = page.locator('#make-pills .pill-filter');
    this.makeCards = page.locator('.make-card');

    // Gather
    this.spaceCards = page.locator('.space-card');
    this.eventCards = page.locator('.event-card');
    this.smsInputRow = page.locator('.sms-input-row').first();

    // Profile
    this.profileMenu = page.locator('#profile-menu');
    this.portalLoginView = page.locator('#portal-login-view');
    this.portalCustomerView = page.locator('#portal-customer-view');
    this.loginForm = page.locator('.login-form');

    // Golden Paths
    this.gpFab = page.locator('.gp-fab');
    this.gpOverlay = page.locator('#gp-overlay');
    this.gpCards = page.locator('.gp-card');
    this.gpTracker = page.locator('#gp-tracker');
    this.gpTrackerTitle = page.locator('#gp-tracker-title');
    this.gpTrackerSteps = page.locator('#gp-tracker-steps');
    this.gpTrackerLabel = page.locator('#gp-tracker-label');
    this.gpPrev = page.locator('#gp-prev');
    this.gpNext = page.locator('#gp-next');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Navigate to a screen using the showScreen() JS function */
  async showScreen(name: 'home' | 'store' | 'make' | 'gather' | 'profile'): Promise<void> {
    await this.page.evaluate((s) => (window as any).showScreen(s), name);
  }

  /** Click a screen tab by its visible text */
  async clickTab(text: string): Promise<void> {
    await this.page.locator('.screen-tabs button', { hasText: text }).click();
  }

  /** Click a bottom nav item by its visible text */
  async clickBottomNav(text: string): Promise<void> {
    await this.bottomNav.locator('.bottom-nav-item', { hasText: text }).click();
  }

  // --- Store screen helpers ---

  /** Get a unit card by unit ID */
  unitCard(unitId: string): Locator {
    return this.page.locator(`.unit-card[data-unit-id="${unitId}"]`);
  }

  /** Get the Grab It form within a unit card */
  grabForm(unitId: string): Locator {
    return this.unitCard(unitId).locator('.grab-form');
  }

  /** Fill and submit a Grab It form */
  async fillGrabForm(unitId: string, data: { name: string; email: string; phone: string }): Promise<void> {
    const card = this.unitCard(unitId);
    await card.locator('.grab-name').fill(data.name);
    await card.locator('.grab-email').fill(data.email);
    await card.locator('.grab-phone').fill(data.phone);
    await card.locator('.grab-form button[type="submit"]').click();
  }

  /** Get Grab It success message for a unit */
  grabSuccess(unitId: string): Locator {
    return this.unitCard(unitId).locator('.grab-success');
  }

  /** Get Grab It error message for a unit */
  grabError(unitId: string): Locator {
    return this.unitCard(unitId).locator('.grab-error');
  }

  /** Select a filter chip by data-filter value */
  async toggleFilterChip(filter: string): Promise<void> {
    await this.filterChips.locator(`[data-filter="${filter}"]`).click();
  }

  /** Select a size from the size dropdown */
  async selectSize(value: string): Promise<void> {
    await this.filterSize.selectOption(value);
  }

  // --- Make screen helpers ---

  /** Click a pill filter by category */
  async clickPill(category: string): Promise<void> {
    await this.page.locator(`#make-pills .pill-filter[data-cat="${category}"]`).click();
  }

  /** Get make cards filtered by category */
  makeCardsByCategory(category: string): Locator {
    return this.page.locator(`.make-card[data-category="${category}"]`);
  }

  // --- Golden Paths helpers ---

  /** Open the Golden Paths overlay */
  async openGoldenPaths(): Promise<void> {
    await this.gpFab.click();
  }

  /** Click a Golden Path card by index */
  async selectGoldenPath(index: number): Promise<void> {
    await this.gpCards.nth(index).click();
  }

  /** Advance the Golden Path tracker */
  async gpNextStep(): Promise<void> {
    await this.gpNext.click();
  }

  /** Go back in the Golden Path tracker */
  async gpPrevStep(): Promise<void> {
    await this.gpPrev.click();
  }
}
