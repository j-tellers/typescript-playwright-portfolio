import { request, type APIRequestContext } from '@playwright/test';
import { MealieHttpClient } from '../api/clients/mealie-api-client';
import { HttpError } from '../api/clients/http-client';
import { mealieBaseUrl } from '../config/config';
import { test as baseTest, expect } from './environment.fixture';

// Mealie v3.31.0's publicly documented first-run defaults, for local testing only.
const defaultCredentials = {
  username: 'admin',
  password: 'MyPassword',
};
const defaultEmail = 'changeme@example.com';
const testEmail = 'portfolio-admin@example.com';

async function authenticatedClient(context: APIRequestContext, baseUrl: string): Promise<MealieHttpClient> {
  const loginClient = new MealieHttpClient(context, baseUrl);
  let token: string;
  try {
    token = await loginClient.login(defaultCredentials);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      throw new Error('Mealie rejected the default administrator login (HTTP 401). Check the test account credentials.');
    }
    throw error;
  }
  return new MealieHttpClient(context, baseUrl, undefined, {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  });
}

export async function initializeMealieAdmin(): Promise<void> {
  const context = await request.newContext();
  try {
    const client = await authenticatedClient(context, mealieBaseUrl);
    const currentUser = (await client.getCurrentUser()).body;
    if (
      typeof currentUser !== 'object' || currentUser === null ||
      currentUser.admin !== true || currentUser.username !== defaultCredentials.username ||
      typeof currentUser.id !== 'string' || !currentUser.id ||
      typeof currentUser.group !== 'string' || !currentUser.group ||
      typeof currentUser.household !== 'string' || !currentUser.household ||
      (currentUser.email !== defaultEmail && currentUser.email !== testEmail)
    ) {
      throw new Error('The Mealie account does not match the expected local test administrator; no account changes were made.');
    }
    if (currentUser.email === defaultEmail) {
      await client.updateUser({ ...currentUser, email: testEmail });
      const updatedUser = (await client.getCurrentUser()).body;
      if (
        typeof updatedUser !== 'object' || updatedUser === null ||
        updatedUser.id !== currentUser.id || updatedUser.username !== defaultCredentials.username ||
        updatedUser.admin !== true || updatedUser.email !== testEmail
      ) {
        throw new Error('The Mealie administrator email update could not be verified.');
      }
    }
  } finally {
    await context.dispose();
  }
}

type AuthFixtures = {
  mealieAuth: { client: MealieHttpClient; credentials: typeof defaultCredentials };
  mealieApi: MealieHttpClient;
  mealieCredentials: typeof defaultCredentials;
};

export const test = baseTest.extend<{}, AuthFixtures>({
  mealieAuth: [async ({ mealieBaseUrl }, use) => {
    const context = await request.newContext();
    try {
      const client = await authenticatedClient(context, mealieBaseUrl);
      await use({ client, credentials: defaultCredentials });
    } finally {
      await context.dispose();
    }
  }, { scope: 'worker' }],
  mealieApi: [async ({ mealieAuth }, use) => {
    await use(mealieAuth.client);
  }, { scope: 'worker', auto: true }],
  mealieCredentials: [async ({ mealieAuth }, use) => {
    await use(mealieAuth.credentials);
  }, { scope: 'worker' }],
});

export { baseTest as unauthenticatedTest, expect };
