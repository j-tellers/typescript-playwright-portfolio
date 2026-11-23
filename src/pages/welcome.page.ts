import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from './base.page';

export class WelcomePage extends BasePage {
  readonly welcomeText: Locator;
  readonly welcomePageURL: string;

  constructor(page: Page) {
    super(page);
    this.welcomeText = page.getByText('Welcome to Mealie! Let\'s get started');
    this.welcomePageURL = '/admin/setup';
  }
   static async attach(page: Page): Promise<WelcomePage> {
    const instance = new WelcomePage(page);
    await instance.waitForLoad();
    return instance;
  }
  protected async waitForLoad(): Promise<void> {
    await expect(this.page).toHaveURL(`${this.welcomePageURL}`);
    await expect(this.welcomeText).toBeVisible();
  } 

}