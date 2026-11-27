import { z } from 'zod';

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

const uuid = z.uuid();
const uuid4 = z.uuidv4();
const dateTime = z.iso.datetime({ offset: true });
const seconds = z.int().min(0).max(2147483647);
const extras = z.record(z.string(), z.unknown());
const alias = z.object({ name: z.string() }).passthrough();

const categoryDraft = z.object({
  id: uuid4.nullable().optional(),
  groupId: uuid4.nullable().optional(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  recipeCount: z.int().optional(),
}).passthrough();

const category = z.object({
  id: uuid4,
  groupId: uuid4,
  name: z.string(),
  slug: z.string(),
  recipeCount: z.int(),
}).passthrough();

const toolDraft = categoryDraft.extend({
  householdsWithTool: z.array(z.string()).optional(),
});
const tool = category.extend({ householdsWithTool: z.array(z.string()) });

const unitCreate = z.object({
  id: uuid4.nullable().optional(),
  name: z.string(),
  pluralName: z.string().nullable().optional(),
  description: z.string().optional(),
  extras: extras.nullable().optional(),
  fraction: z.boolean().optional(),
  abbreviation: z.string().optional(),
  pluralAbbreviation: z.string().nullable().optional(),
  useAbbreviation: z.boolean().optional(),
  aliases: z.array(alias).optional(),
  standardQuantity: z.number().nullable().optional(),
  standardUnit: z.string().nullable().optional(),
}).passthrough();

const unit = z.object({
  id: uuid4,
  name: z.string(),
  pluralName: z.string().nullable(),
  description: z.string(),
  extras: extras.nullable(),
  fraction: z.boolean(),
  abbreviation: z.string(),
  pluralAbbreviation: z.string().nullable(),
  useAbbreviation: z.boolean(),
  aliases: z.array(alias),
  standardQuantity: z.number().nullable(),
  standardUnit: z.string().nullable(),
  createdAt: dateTime.nullable(),
  updatedAt: dateTime.nullable(),
}).passthrough();

const foodSummary = z.object({
  id: uuid4,
  name: z.string(),
  pluralName: z.string().nullable(),
}).passthrough();

const foodSubstitutionCreate = z.object({
  substituteFoodId: uuid4.nullable().optional(),
  note: z.string().nullable().optional(),
}).passthrough();

const foodSubstitution = foodSubstitutionCreate.extend({
  substituteFood: foodSummary.nullable().optional(),
});

const foodCreate = z.object({
  id: uuid4.nullable().optional(),
  name: z.string(),
  pluralName: z.string().nullable().optional(),
  description: z.string().optional(),
  extras: extras.nullable().optional(),
  labelId: uuid4.nullable().optional(),
  aliases: z.array(alias).optional(),
  substitutions: z.array(foodSubstitutionCreate).optional(),
  householdsWithIngredientFood: z.array(z.string()).optional(),
}).passthrough();

const label = z.object({
  name: z.string(),
  color: z.string(),
  groupId: uuid4,
  id: uuid4,
}).passthrough();

const food = z.object({
  id: uuid4,
  name: z.string(),
  pluralName: z.string().nullable(),
  description: z.string(),
  extras: extras.nullable(),
  labelId: uuid4.nullable(),
  aliases: z.array(alias),
  substitutions: z.array(foodSubstitution),
  householdsWithIngredientFood: z.array(z.string()),
  label: label.nullable(),
  recipeCount: z.int(),
  createdAt: dateTime.nullable(),
  updatedAt: dateTime.nullable(),
}).passthrough();

const reference = z.object({
  referenceId: uuid4.nullable().optional(),
}).passthrough();

const recipeStep = z.object({
  id: uuid.nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  text: z.string(),
  ingredientReferences: z.array(reference).optional(),
  noteReferences: z.array(reference).optional(),
  durationSeconds: z.int().min(1).max(2147483647).nullable().optional(),
}).passthrough();

const nutrition = z.object({
  calories: z.string().nullable().optional(),
  carbohydrateContent: z.string().nullable().optional(),
  cholesterolContent: z.string().nullable().optional(),
  fatContent: z.string().nullable().optional(),
  fiberContent: z.string().nullable().optional(),
  proteinContent: z.string().nullable().optional(),
  saturatedFatContent: z.string().nullable().optional(),
  sodiumContent: z.string().nullable().optional(),
  sugarContent: z.string().nullable().optional(),
  transFatContent: z.string().nullable().optional(),
  unsaturatedFatContent: z.string().nullable().optional(),
}).passthrough();

const settings = z.object({
  public: z.boolean().optional(),
  showNutrition: z.boolean().optional(),
  showAssets: z.boolean().optional(),
  landscapeView: z.boolean().optional(),
  disableComments: z.boolean().optional(),
  locked: z.boolean().optional(),
}).passthrough();

const asset = z.object({
  name: z.string(),
  icon: z.string(),
  fileName: z.string().nullable().optional(),
}).passthrough();

const note = z.object({
  title: z.string(),
  text: z.string(),
  referenceId: uuid.optional(),
}).passthrough();

const commentUser = z.object({
  id: uuid4,
  username: z.string().nullable().optional(),
  admin: z.boolean(),
  fullName: z.string().nullable().optional(),
}).passthrough();

const comment = z.object({
  id: uuid4,
  recipeId: uuid4,
  text: z.string(),
  createdAt: dateTime,
  updatedAt: dateTime,
  userId: uuid4,
  user: commentUser,
}).passthrough();

const ingredientFields = z.object({
  quantity: z.number().nullable().optional(),
  unit: z.union([unit, unitCreate]).nullable().optional(),
  food: z.union([food, foodCreate]).nullable().optional(),
  note: z.string().nullable().optional(),
  display: z.string().optional(),
  title: z.string().nullable().optional(),
  originalText: z.string().nullable().optional(),
  substitutions: z.array(foodSubstitution).optional(),
  referenceId: uuid.optional(),
}).passthrough();

const draftFields = z.object({
  id: uuid4.nullable().optional(),
  userId: uuid4.nullable().optional(),
  householdId: uuid4.nullable().optional(),
  groupId: uuid4.nullable().optional(),
  name: z.string().nullable().optional(),
  slug: z.string().optional(),
  image: z.unknown().optional(),
  recipeServings: z.number().optional(),
  recipeYieldQuantity: z.number().optional(),
  recipeYield: z.string().nullable().optional(),
  totalTime: z.string().nullable().optional(),
  prepTime: z.string().nullable().optional(),
  performTime: z.string().nullable().optional(),
  totalTimeSeconds: seconds.nullable().optional(),
  prepTimeSeconds: seconds.nullable().optional(),
  performTimeSeconds: seconds.nullable().optional(),
  description: z.string().nullable().optional(),
  recipeCategory: z.array(categoryDraft).optional(),
  tags: z.array(categoryDraft).optional(),
  tools: z.array(toolDraft).optional(),
  rating: z.number().nullable().optional(),
  orgURL: z.string().nullable().optional(),
  dateAdded: z.iso.date().nullable().optional(),
  dateUpdated: dateTime.nullable().optional(),
  createdAt: dateTime.nullable().optional(),
  updatedAt: dateTime.nullable().optional(),
  recipeInstructions: z.array(recipeStep).optional(),
  nutrition: nutrition.nullable().optional(),
  settings: settings.nullable().optional(),
  assets: z.array(asset).optional(),
  notes: z.array(note).optional(),
  extras: extras.optional(),
  comments: z.array(comment).optional(),
}).passthrough();

type RecipeIngredient = z.infer<typeof ingredientFields> & {
  referencedRecipe?: RecipeDraft | null;
};
type RecipeDraft = z.infer<typeof draftFields> & {
  recipeIngredient?: RecipeIngredient[];
};

const ingredient: z.ZodType<RecipeIngredient> = ingredientFields.extend({
  referencedRecipe: z.lazy(() => draft).nullable().optional(),
});
const draft: z.ZodType<RecipeDraft> = draftFields.extend({
  recipeIngredient: z.array(ingredient).optional(),
});

export const recipeResponseSchema = z.object({
  id: uuid4,
  userId: uuid4,
  householdId: uuid4,
  groupId: uuid4,
  name: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
  recipeServings: z.number(),
  recipeYieldQuantity: z.number(),
  recipeYield: z.string().nullable(),
  totalTime: z.string().nullable(),
  prepTime: z.string().nullable(),
  performTime: z.string().nullable(),
  totalTimeSeconds: seconds.nullable(),
  prepTimeSeconds: seconds.nullable(),
  performTimeSeconds: seconds.nullable(),
  description: z.string().nullable(),
  recipeCategory: z.array(category),
  tags: z.array(category),
  tools: z.array(tool),
  rating: z.number().nullable(),
  orgURL: z.string().nullable(),
  dateAdded: z.iso.date().nullable(),
  dateUpdated: dateTime.nullable(),
  createdAt: dateTime.nullable(),
  updatedAt: dateTime.nullable(),
  recipeIngredient: z.array(ingredient),
  recipeInstructions: z.array(recipeStep),
  nutrition,
  settings,
  assets: z.array(asset),
  notes: z.array(note),
  extras,
  comments: z.array(comment),
}).passthrough();
