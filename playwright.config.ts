import { defineConfig } from '@playwright/test';
import { mealieBaseUrl } from './src/config/config';

export default defineConfig({
  testDir: './tests',
  workers: 2,
  fullyParallel: true,
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  reporter: [['list'], ['html', { outputFolder: 'test-reports', open: 'always' }]],
  use: {
    baseURL: mealieBaseUrl,
    viewport: { width: 1920, height: 1080 }
  },
});
