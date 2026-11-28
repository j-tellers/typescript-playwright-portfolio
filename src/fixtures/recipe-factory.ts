import { randomUUID } from 'node:crypto';
import type { RecipePatchRequest } from '../api/schemas/recipes';
import type { TrackedMealieHttpClient } from './tracked-mealie-api-client';

type RecipeInput = {
  name: string;
  data: Omit<RecipePatchRequest, 'name'>;
};

export async function createRecipes(
  mealieApi: TrackedMealieHttpClient,
  input: RecipeInput | RecipeInput[],
): Promise<{ id: string; slug: string; name: string }[]> {
  const recipes = Array.isArray(input) ? input : [input];
  const createdRecipes: { id: string; slug: string; name: string }[] = [];

  for (const recipe of recipes) {
    const name = `${recipe.name} ${randomUUID()}`;
    const created = await mealieApi.createRecipe({ name });

    if (typeof created.body !== 'string' || !created.body) {
      throw new Error('Recipe creation did not return a valid slug.');
    }

    const id = mealieApi.getCreatedRecipeId(created.body);
    await mealieApi.patchRecipe(id, { ...recipe.data, name });
    createdRecipes.push({ id, slug: created.body, name });
  }

  return createdRecipes;
}
