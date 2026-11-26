import { defineConfig } from '@playwright/test';
import { mealieBaseUrl } from './src/config/config';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  use: {
    baseURL: mealieBaseUrl,
    viewport: { width: 1920, height: 1080 }
  },
});
