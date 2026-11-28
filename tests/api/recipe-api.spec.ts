import { expect, test } from '../../src/fixtures/fixtures';
import { createRecipes } from '../../src/fixtures/recipe-factory';
import { recipeResponseSchema, type BasicRecipe, type RecipePatchRequest } from '../../src/api/schemas/recipes';
import type { TrackedMealieHttpClient } from '../../src/fixtures/tracked-mealie-api-client';

const recipeData: Omit<BasicRecipe, 'name'> = {
  description: 'A basic recipe.',
  recipeServings: 4,
  recipeYieldQuantity: 4,
  recipeYield: 'servings',
  prepTimeSeconds: 900,
  performTimeSeconds: 1200,
  totalTimeSeconds: 2100,
  recipeIngredient: [
    { quantity: 2, note: 'cups of flour' },
    { quantity: 1, note: 'cup of water' },
    { quantity: 1, note: 'teaspoon of salt' },
    { quantity: 1, note: 'teaspoon of yeast' },
    { quantity: 1, note: 'tablespoon of oil' },
  ],
  recipeInstructions: [
    { text: 'Mix the flour, salt, and yeast.' },
    { text: 'Preheat the oven.' },
    { text: 'Add the water and oil.' },
    { text: 'Knead the dough.' },
    { text: 'Bake until cooked.' },
  ],
  nutrition: {
    calories: '200',
    carbohydrateContent: '30',
    fatContent: '5',
    sodiumContent: '100',
  },
  settings: { public: true, showNutrition: true },
};

async function createInitialRecipe(
  recipeNamePrefix: string,
  mealieApi: TrackedMealieHttpClient,
  initialRecipeData: Omit<RecipePatchRequest, 'name'>,
) {
  const [{ id: recipeId, name }] = await createRecipes(mealieApi, { name: recipeNamePrefix, data: initialRecipeData });
  const initialRecipeResponse = await mealieApi.getRecipe(recipeId);
  expect(initialRecipeResponse.status).toBe(200);

  const initialRecipe = recipeResponseSchema.parse(initialRecipeResponse.body);
  const expectedRecipe = { ...initialRecipeData, name };
  expect(initialRecipe).toMatchObject(expectedRecipe);

  return { recipeId, expectedRecipe, initialRecipe };
}

test.describe('Recipe API workflows', () => {
  test('TC_recipe_01: partially updates a recipe while preserving existing data', async ({ mealieApi }) => {
    const recipePatch: Partial<BasicRecipe> = {
      description: 'An updated description for the recipe.',
      prepTimeSeconds: 1100,
      totalTimeSeconds: 2300,
    };
    const { recipeId, expectedRecipe, initialRecipe } = await createInitialRecipe('TC_recipe_01', mealieApi, recipeData);

    const patchResponse = await mealieApi.patchRecipe(recipeId, recipePatch);
    expect(patchResponse.status).toBe(200);

    const updatedRecipeResponse = await mealieApi.getRecipe(recipeId);
    expect(updatedRecipeResponse.status).toBe(200);

    const updatedRecipe = recipeResponseSchema.parse(updatedRecipeResponse.body);
    expect(updatedRecipe).toMatchObject({
      ...expectedRecipe,
      id: initialRecipe.id,
      description: recipePatch.description,
      prepTimeSeconds: recipePatch.prepTimeSeconds,
      totalTimeSeconds: recipePatch.totalTimeSeconds,
    });
  });

  test('TC_recipe_02: replaces recipe data with PUT', async ({ mealieApi }) => {
    const replacementRecipeData: Omit<BasicRecipe, 'name' | 'recipeInstructions'> = {
      description: 'A banana oatmeal recipe for the PUT test.',
      recipeYield: 'bowls',
      prepTimeSeconds: 300,
      performTimeSeconds: 600,
      totalTimeSeconds: 900,
      recipeIngredient: [
        { quantity: 1, note: 'cup of oats' },
        { quantity: 2, note: 'cups of milk' },
        { quantity: 1, note: 'banana' },
      ],
      nutrition: {
        calories: '350',
        carbohydrateContent: '55',
        fatContent: '8',
      },
      settings: { public: true, showNutrition: false },
    };
    const { recipeId, expectedRecipe, initialRecipe } = await createInitialRecipe('TC_recipe_02', mealieApi, recipeData);

    const replacement = { ...replacementRecipeData, name: expectedRecipe.name };
    const putResponse = await mealieApi.replaceRecipe(recipeId, replacement);
    expect(putResponse.status).toBe(200);

    const replacedRecipeResponse = await mealieApi.getRecipe(recipeId);
    expect(replacedRecipeResponse.status).toBe(200);

    const replacedRecipe = recipeResponseSchema.parse(replacedRecipeResponse.body);
    expect(replacedRecipe).toMatchObject({
      ...replacement,
      id: initialRecipe.id,
      slug: initialRecipe.slug,
      recipeInstructions: [],
      recipeServings: 0,
      recipeYieldQuantity: 0,
      nutrition: { ...replacement.nutrition, sodiumContent: null },
    });
  });

  test('TC_recipe_03: renames a recipe and updates its slug', async ({ mealieApi }) => {
    const { recipeId, initialRecipe } = await createInitialRecipe('TC_recipe_03', mealieApi, recipeData);

    const newName = `${initialRecipe.name}_renamed`;
    const patchResponse = await mealieApi.patchRecipe(recipeId, { name: newName });
    expect(patchResponse.status).toBe(200);

    const patchedRecipe = recipeResponseSchema.parse(patchResponse.body);
    expect(patchedRecipe.slug).not.toBe(initialRecipe.slug);

    const renamedRecipeResponse = await mealieApi.getRecipe(recipeId);
    expect(renamedRecipeResponse.status).toBe(200);

    const updatedRecipe = recipeResponseSchema.parse(renamedRecipeResponse.body);
    expect(updatedRecipe).toMatchObject({
      id: initialRecipe.id,
      name: newName,
      slug: patchedRecipe.slug,
    });

    const oldSlugResponse = await mealieApi.getRecipeBySlug(initialRecipe.slug, { throwOnError: false });
    expect(oldSlugResponse.status).toBe(404);

    const newSlugResponse = await mealieApi.getRecipeBySlug(updatedRecipe.slug);
    expect(newSlugResponse.status).toBe(200);

    const newSlugRecipe = recipeResponseSchema.parse(newSlugResponse.body);
    expect(newSlugRecipe).toMatchObject({ id: updatedRecipe.id, name: updatedRecipe.name });
  });

  test('TC_recipe_04: revises ingredient and instruction collections order', async ({ mealieApi }) => {
    const collectionRecipePatch: Pick<BasicRecipe, 'recipeIngredient' | 'recipeInstructions'> = {
      recipeIngredient: [
        { quantity: 1, note: 'teaspoon of yeast' },
        { quantity: 3, note: 'cups of flour' },
        { quantity: 1, note: 'cup of milk' },
        { quantity: 1, note: 'tablespoon of oil' },
        { quantity: 1, note: 'teaspoon of salt' },
      ],
      recipeInstructions: [
        { text: 'Preheat the oven.' },
        { text: 'Mix the flour, salt, and yeast.' },
        { text: 'Add the milk and oil.' },
        { text: 'Knead the dough.' },
        { text: 'Bake until cooked.' },
      ],
    };
    const { recipeId, initialRecipe } = await createInitialRecipe('TC_recipe_04', mealieApi, recipeData);

    const patchResponse = await mealieApi.patchRecipe(recipeId, collectionRecipePatch);
    expect(patchResponse.status).toBe(200);

    const revisedRecipeResponse = await mealieApi.getRecipe(recipeId);
    expect(revisedRecipeResponse.status).toBe(200);

    const revisedRecipe = recipeResponseSchema.parse(revisedRecipeResponse.body);
    expect(revisedRecipe).toMatchObject({
      id: initialRecipe.id,
      recipeIngredient: collectionRecipePatch.recipeIngredient,
      recipeInstructions: collectionRecipePatch.recipeInstructions,
    });
  });
});