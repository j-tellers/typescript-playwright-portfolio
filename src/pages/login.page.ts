import {type Locator, type Page } from "@playwright/test";
import { BasePage } from './base.page';
import { HomePage } from './home.page';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.usernameInput = page.getByRole('textbox', { name: 'Email or Username' })
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
  }

  async isLoginVisible(): Promise<boolean>{
    return await this.loginButton.isVisible();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    return HomePage.attach(this.page);
  }
}