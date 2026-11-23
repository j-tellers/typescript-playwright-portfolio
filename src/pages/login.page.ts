import {type Locator, type Page } from "@playwright/test";
import { BasePage } from './base.page';
import { WelcomePage } from './welcome.page';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole('button', { name: 'Login' }); // Replace with actual selector
  }

  async isLoginVisible(): Promise<boolean>{
    return await this.loginButton.isVisible();
  }

  async loginDefault() {
    await this.loginButton.click();
    return WelcomePage.attach(this.page);
  }
}