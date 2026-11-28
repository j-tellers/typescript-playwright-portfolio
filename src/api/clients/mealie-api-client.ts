import { HttpClient, type RequestOptions } from "./http-client";
import { mealieBaseUrl } from "../../config/config";
import type { APIRequestContext } from "@playwright/test";
import type {
    RecipeCreateRequest,
    RecipePatchRequest,
    RecipeReplaceRequest,
} from "../schemas/recipes";

interface MealieUser {
    id: string;
    username: string;
    email: string;
    admin: boolean;
    group: string;
    household: string;
}

type RecipeRequestOptions = Omit<RequestOptions, "body">;

export class MealieHttpClient extends HttpClient {
    constructor(requestContext: APIRequestContext, baseUrl = mealieBaseUrl, defaultTimeoutMs?: number, headers?: Record<string, string>) {
        super(requestContext, baseUrl, defaultTimeoutMs, headers);
    }

    createRecipe(body: RecipeCreateRequest, options?: RecipeRequestOptions) {
        return this.post<unknown>("/api/recipes", body, options);
    }

    patchRecipe(id: string, body: RecipePatchRequest, options?: RecipeRequestOptions) {
        return this.patch<unknown>(`/api/recipes/${encodeURIComponent(id)}`, body, options);
    }

    replaceRecipe(id: string, body: RecipeReplaceRequest, options?: RecipeRequestOptions) {
        return this.put<unknown>(`/api/recipes/${encodeURIComponent(id)}`, body, options);
    }

    getRecipe(idOrSlug: string, options?: Omit<RequestOptions, "body">) {
        return this.get<unknown>(`/api/recipes/${encodeURIComponent(idOrSlug)}`, options);
    }

    getRecipeBySlug(slug: string, options?: Omit<RequestOptions, "body">) {
        return this.getRecipe(slug, options);
    }

    deleteRecipe(id: string, options?: Omit<RequestOptions, "body">) {
        return this.delete(`/api/recipes/${encodeURIComponent(id)}`, options);
    }

    getCurrentUser() {
        return this.get<MealieUser>("/api/users/self");
    }

    updateUser(user: MealieUser) {
        return this.put<unknown>(`/api/users/${encodeURIComponent(user.id)}`, user);
    }

    async login(body: { username: string; password: string }): Promise<string> {
        const response = await this.request<unknown>("POST", "/api/auth/token", { form: body });
        if (
            typeof response.body !== "object" ||
            response.body === null ||
            !("access_token" in response.body) ||
            typeof response.body.access_token !== "string" ||
            !response.body.access_token
        ) {
            throw new Error("Mealie login did not return a valid access token.");
        }
        return response.body.access_token;
    }


    }
