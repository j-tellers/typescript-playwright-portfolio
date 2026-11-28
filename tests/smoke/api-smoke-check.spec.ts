import { test, expect } from '../../src/fixtures/fixtures';
import type { BasicRecipe } from '../../src/api/schemas/recipes';
import { randomUUID } from 'node:crypto';

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
    const createdId = mealieApi.getCreatedRecipeId(createdSlug);
    const patched = await mealieApi.patchRecipe(createdId, recipe);
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({
      ...recipe,
      slug: createdSlug,
    });

    expect(await mealieApi.getRecipe(createdId)).toMatchObject({ status: 200, body: recipe });

    expect((await mealieApi.deleteRecipe(createdId)).status).toBe(200);

    expect((await mealieApi.getRecipe(createdId, { throwOnError: false })).status).toBe(404);
  });
});