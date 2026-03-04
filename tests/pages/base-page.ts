import { Page, Locator } from '@playwright/test';

/**
 * Base page object with shared nav, footer, and mobile menu selectors.
 * Used by standalone pages (spaces.html, storage.html, events.html).
 * index.html has its own navigation pattern (screen tabs + bottom nav).
 */
export class BasePage {
  readonly page: Page;

  // Navigation
  readonly nav: Locator;
  readonly navLinks: Locator;
  readonly hamburgerButton: Locator;
  readonly mobileMenu: Locator;
  readonly logo: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tailwind/Flowbite nav pattern shared by standalone pages
    this.nav = page.locator('nav');
    this.navLinks = page.locator('nav a');
    this.hamburgerButton = page.locator('[data-collapse-toggle="mobile-menu"]');
    this.mobileMenu = page.locator('#mobile-menu');
    this.logo = page.locator('nav img[alt]').first();

    // Footer
    this.footer = page.locator('footer');
    this.footerLinks = page.locator('footer a');
  }

  async toggleMobileMenu(): Promise<void> {
    await this.hamburgerButton.click();
  }

  async isMobileMenuVisible(): Promise<boolean> {
    return this.mobileMenu.isVisible();
  }

  navLink(text: string): Locator {
    return this.nav.getByRole('link', { name: text });
  }

  footerLink(text: string): Locator {
    return this.footer.getByRole('link', { name: text });
  }
}
