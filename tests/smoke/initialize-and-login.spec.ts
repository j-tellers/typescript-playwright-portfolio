import { test, expect } from '../../src/fixtures/fixtures';
import { LoginPage } from '../../src/pages/login.page';

test("Administrator login reaches the home page", async ({ page, mealieBaseUrl, mealieCredentials }) => {
  await page.goto(mealieBaseUrl);

  const username = mealieCredentials.username;
  const password = mealieCredentials.password;

  const loginPage = new LoginPage(page);
  await expect.poll(() => loginPage.isLoginVisible()).toBe(true);

  await loginPage.login(username, password);

});