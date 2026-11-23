import { test, expect } from '../../src/fixtures/fixtures';
import { LoginPage } from '../../src/pages/login.page';

test("Initial login smoke check", async ({ page, mealieBaseUrl }) => {
  await page.goto(mealieBaseUrl);

  const loginPage = new LoginPage(page);
  await expect.poll(() => loginPage.isLoginVisible()).toBe(true);

  const welcomePage =  await loginPage.loginDefault()

});