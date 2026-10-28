import { defineQueryOptions } from "@pinia/colada"
import type { CategoryWithLocales } from "#shared/types/Recipe"
import type { FavoriteListItem, RecipeDetail, RecipeListItem } from "~/stores/recipes"
import { queryKeys } from "~/queries/keys"
import { apiFetch } from "~/utils/apiFetch"

export const categoriesQuery = defineQueryOptions({
  key: queryKeys.categories,
  query: () => apiFetch<CategoryWithLocales[]>("/api/categories"),
})

export const categoryRecipesQuery = defineQueryOptions((categoryId: string) => ({
  key: queryKeys.categoryRecipes(categoryId),
  query: () => apiFetch<RecipeListItem[]>(`/api/categories/${categoryId}/recipes`),
  enabled: Boolean(categoryId),
}))

export const recipeQuery = defineQueryOptions((recipeId: string) => ({
  key: queryKeys.recipe(recipeId),
  query: () => apiFetch<RecipeDetail>(`/api/recipes/${recipeId}`),
  enabled: Boolean(recipeId),
}))

export const favoritesQuery = defineQueryOptions({
  key: queryKeys.favorites,
  query: () => apiFetch<FavoriteListItem[]>("/api/favorites"),
})
