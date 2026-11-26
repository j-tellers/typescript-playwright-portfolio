import { test, unauthenticatedTest, expect } from '../../src/fixtures/fixtures';
import { MealieHttpClient } from '../../src/api/clients/mealie-api-client';
import type { BasicRecipe } from '../../src/api/schemas/recipes';
import { randomUUID } from 'node:crypto';

unauthenticatedTest('initializes the administrator before tests start', async ({ request, mealieBaseUrl }) => {
  const loginClient = new MealieHttpClient(request, mealieBaseUrl);
  const token = await loginClient.login({ username: 'admin', password: 'MyPassword' });
  const client = new MealieHttpClient(request, mealieBaseUrl, undefined, {
    Authorization: `Bearer ${token}`,
  });

  expect((await client.getCurrentUser()).body).toMatchObject({ email: 'portfolio-admin@example.com' });
});

const buildBasicRecipe = (name: string): BasicRecipe => {
  return {
    name,
    description: 'A basic recipe created by the API smoke check.',
    recipeServings: 4,
    recipeYieldQuantity: 4,
    recipeYield: 'servings',
    prepTimeSeconds: 900,
    performTimeSeconds: 1200,
    totalTimeSeconds: 2100,
    recipeIngredient: [
      { quantity: 2, note: 'cups of flour' },
      { quantity: 1, note: 'cup of water' },
    ],
    recipeInstructions: [
      { text: 'Mix the flour and water.' },
      { text: 'Bake until cooked.' },
    ],
    nutrition: {
      calories: '200',
      carbohydrateContent: '30',
      fatContent: '5',
      sodiumContent: '100',
    },
    settings: { public: false, showNutrition: true },
  };
};

test.describe('Recipe API smoke check', () => {
  test('creates, updates, retrieves, and deletes a recipe', async ({ mealieApi }) => {
    const name = `API smoke ${randomUUID()}`;
    const recipe = buildBasicRecipe(name);

    const created = await mealieApi.createRecipe({ name });
    expect(created.status).toBe(201);
    expect(created.body).toEqual(expect.any(String));
    expect(created.body).not.toBe('');
    const createdSlug = created.body as string;

    const patched = await mealieApi.patchRecipe(createdSlug, recipe);
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({
      ...recipe,
      slug: createdSlug,
    });

    expect(await mealieApi.getRecipe(createdSlug)).toMatchObject({ status: 200, body: recipe });

    expect((await mealieApi.deleteRecipe(createdSlug)).status).toBe(200);

    expect((await mealieApi.getRecipe(createdSlug, { throwOnError: false })).status).toBe(404);
  });
});