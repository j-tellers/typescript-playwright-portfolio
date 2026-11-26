export interface RecipeCreateRequest {
  name: string;
}

export interface RecipePatchRequest {
  name?: string;
  description?: string | null;
  recipeServings?: number;
  recipeYieldQuantity?: number;
  recipeYield?: string | null;
  prepTimeSeconds?: number | null;
  performTimeSeconds?: number | null;
  totalTimeSeconds?: number | null;
  recipeIngredient?: { quantity?: number | null; note?: string | null }[];
  recipeInstructions?: { text: string }[];
  nutrition?: {
    calories?: string | null;
    carbohydrateContent?: string | null;
    fatContent?: string | null;
    sodiumContent?: string | null;
  } | null;
  settings?: { public?: boolean; showNutrition?: boolean } | null;
}

export interface BasicRecipe extends RecipePatchRequest {
  name: string;
  recipeIngredient: { quantity: number; note: string }[];
  recipeInstructions: { text: string }[];
}
