import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly homeText: Locator;
  readonly homePageURL: string;

  constructor(page: Page) {
    super(page);
    this.homeText = page.getByRole('main').getByText('Recipes', { exact: true })
    this.homePageURL = '/g/home';
  }
   static async attach(page: Page): Promise<HomePage> {
    const instance = new HomePage(page);
    await instance.waitForLoad();
    return instance;
  }
  protected async waitForLoad(): Promise<void> {
    await expect(this.page).toHaveURL(`${this.homePageURL}`);
    await expect(this.homeText).toBeVisible();
  } 

}