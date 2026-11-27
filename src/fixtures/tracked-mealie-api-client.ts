import { MealieHttpClient } from '../api/clients/mealie-api-client';
import { HttpError } from '../api/clients/http-client';

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TrackedMealieHttpClient extends MealieHttpClient {
  private readonly recipeIds = new Set<string>();

  override async createRecipe(...args: Parameters<MealieHttpClient['createRecipe']>) {
    const response = await super.createRecipe(...args);
    if (response.status < 200 || response.status >= 300) {
      return response;
    }

    if (typeof response.body !== 'string' || !response.body) {
      throw new Error('Recipe creation did not return a valid slug; the recipe could not be tracked.');
    }
    const recipe = (await super.getRecipe(response.body)).body;
    if (
      typeof recipe !== 'object' || recipe === null ||
      !('id' in recipe) || typeof recipe.id !== 'string' ||
      !uuidV4Pattern.test(recipe.id)
    ) {
      throw new Error('Created recipe did not return a valid ID; the recipe could not be tracked.');
    }
    this.recipeIds.add(recipe.id);
    return response;
  }

  async cleanupRecipes(): Promise<void> {
    const failures: string[] = [];
    for (const id of this.recipeIds) {
      try {
        await super.deleteRecipe(id);
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          continue;
        }
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${id}: ${message}`);
      }
    }
    if (failures.length > 0) {
      throw new Error(`Failed to clean up recipes:\n${failures.join('\n')}`);
    }
  }
}
