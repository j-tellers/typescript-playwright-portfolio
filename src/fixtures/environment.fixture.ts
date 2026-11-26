import { test as base, expect } from '@playwright/test';
import { mealieBaseUrl } from '../config/config';

type EnvironmentFixtures = {
  mealieBaseUrl: string;
};

export const test = base.extend<{}, EnvironmentFixtures>({
  mealieBaseUrl: [async ({}, use) => {
    await use(mealieBaseUrl);
  }, { scope: 'worker' }],
});

export { expect };
