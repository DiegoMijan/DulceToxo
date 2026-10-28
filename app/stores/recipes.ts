import { useQueryCache } from "@pinia/colada"
import type { LocaleKey } from "~/../../shared/types/Recipe.d.ts"
import type { components } from "#shared/types/api"
import { apiFetch } from "~/utils/apiFetch"
import { clearUserScopedQueries } from "~/utils/userQueryCache"
import { isUnauthorizedError } from "~/utils/unauthorizedError"
import { redirectToLogin } from "~/utils/redirectToLogin"
import { queryKeys } from "~/queries/keys"
import {
  categoryRecipesQuery,
  favoritesQuery,
  recipeQuery,
} from "~/queries/options"
import {
  getCachedCategoryRecipes,
  getCachedFavorites,
  getCachedRecipe,
  removeRecipeFromQueries,
} from "~/queries/recipeCache"

export type RecipeListItem = components["schemas"]["RecipeListItem"]
export type RecipeLocaleContent = components["schemas"]["RecipeLocaleContent"]
export type RecipeIngredientContent = components["schemas"]["RecipeIngredientContent"]
export type RecipeStepContent = components["schemas"]["RecipeStepContent"]
export type RecipeImageContent = components["schemas"]["RecipeImageContent"]
export type RecipeDetail = components["schemas"]["RecipeDetail"]
export type DeleteRecipeResponse = components["schemas"]["DeleteRecipeResponse"]
export type RecipeRatingStats = components["schemas"]["RecipeRatingStats"]
export type UpsertRecipeRatingRequest = components["schemas"]["UpsertRecipeRatingRequest"]
export type FavoriteListItem = components["schemas"]["FavoriteListItem"]
export type FavoriteStatus = components["schemas"]["FavoriteStatus"]

const dataOf = async <T>(state: { data: T | undefined }): Promise<T | undefined> => state.data

export const useRecipes = defineStore("recipes", () => {
  const { locale } = useI18n()
  const queryCache = useQueryCache()

  // Cache keys are categoryId / recipeId only — they do not include locale.
  // The Colada queries in app/queries/keys.ts follow the same rule because
  // GET /categories/:id/recipes, GET /recipes/:id and GET /favorites return
  // gl+es+en together. Views pick the active language with locale.value.

  const recipesByCategory = computed(() => {
    const map = new Map<string, RecipeListItem[]>()
    for (const entry of queryCache.getEntries({ key: ["category-recipes"] })) {
      const categoryId = entry.key[1]
      const data = entry.state.value.data as RecipeListItem[] | undefined
      if (typeof categoryId === "string" && data) map.set(categoryId, data)
    }
    return map
  })

  const recipesCache = computed(() => {
    const map = new Map<string, RecipeDetail>()
    for (const entry of queryCache.getEntries({ key: ["recipe"] })) {
      const recipeId = entry.key[1]
      const data = entry.state.value.data as RecipeDetail | undefined
      if (typeof recipeId === "string" && data) map.set(recipeId, data)
    }
    return map
  })

  const favorites = computed(() => getCachedFavorites() ?? null)

  const loadingList = computed(() =>
    queryCache
      .getEntries({ key: ["category-recipes"] })
      .some((entry) => entry.asyncStatus.value === "loading" && entry.state.value.data == null),
  )

  const loadingDetail = computed(() =>
    queryCache
      .getEntries({ key: ["recipe"] })
      .some((entry) => entry.asyncStatus.value === "loading" && entry.state.value.data == null),
  )

  const loadingFavorites = computed(() => {
    const entry = queryCache.getEntries({ key: queryKeys.favorites, exact: true })[0]
    return Boolean(entry && entry.asyncStatus.value === "loading" && entry.state.value.data == null)
  })

  const getRecipesByCategory = async (categoryId: string, force = false) => {
    const entry = queryCache.ensure(categoryRecipesQuery(categoryId))
    if (force) {
      queryCache.invalidate(entry)
      return (await dataOf(await queryCache.fetch(entry))) ?? []
    }
    return (await dataOf(await queryCache.refresh(entry))) ?? getCachedCategoryRecipes(categoryId) ?? []
  }

  const getRecipeDetail = async (recipeId: string, force = false) => {
    const entry = queryCache.ensure(recipeQuery(recipeId))
    if (force) {
      queryCache.invalidate(entry)
      return (await dataOf(await queryCache.fetch(entry))) ?? null
    }
    return (await dataOf(await queryCache.refresh(entry))) ?? getCachedRecipe(recipeId) ?? null
  }

  const getFavorites = async (force = false) => {
    const entry = queryCache.ensure(favoritesQuery)
    if (force) {
      queryCache.invalidate(entry)
      return (await dataOf(await queryCache.fetch(entry))) ?? []
    }
    return (await dataOf(await queryCache.refresh(entry))) ?? getCachedFavorites() ?? []
  }

  const getRecipesListByLocale = (categoryId: string) => {
    const recipes = getCachedCategoryRecipes(categoryId) || []
    return recipes.map((recipe) => ({
      id: recipe.id,
      slug: recipe.locale[locale.value as LocaleKey]?.slug || recipe.id,
      title: recipe.locale[locale.value as LocaleKey]?.title || "",
    }))
  }

  const findRecipeIdBySlug = (categoryId: string, slug: string): string | null => {
    const recipes = getCachedCategoryRecipes(categoryId) || []
    for (const recipe of recipes) {
      for (const localeKey of Object.keys(recipe.locale) as LocaleKey[]) {
        if (recipe.locale[localeKey]?.slug === slug) {
          return recipe.id
        }
      }
    }
    return null
  }

  const getRecipeSlugById = (categoryId: string, recipeId: string): string | null => {
    const recipe = (getCachedCategoryRecipes(categoryId) || []).find((item) => item.id === recipeId)
    if (recipe) {
      return recipe.locale[locale.value as LocaleKey]?.slug || null
    }
    return null
  }

  const findFavoriteIdBySlug = (slug: string): string | null => {
    for (const recipe of getCachedFavorites() ?? []) {
      for (const localeKey of Object.keys(recipe.locale) as LocaleKey[]) {
        if (recipe.locale[localeKey]?.slug === slug) {
          return recipe.id
        }
      }
    }
    return null
  }

  const getFavoriteSlugById = (recipeId: string): string | null => {
    const recipe = (getCachedFavorites() ?? []).find((item) => item.id === recipeId)
    if (!recipe) return null
    return recipe.locale[locale.value as LocaleKey]?.slug || null
  }

  const deleteRecipe = async (recipeId: string, categoryId: string) => {
    try {
      const data = await apiFetch<DeleteRecipeResponse>(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      })
      removeRecipeFromQueries(recipeId, categoryId)
      return data
    } catch (error) {
      if (isUnauthorizedError(error)) await redirectToLogin()
      throw error
    }
  }

  const clearCache = () => {
    clearUserScopedQueries(queryCache)
  }

  const clearDetailsCache = () => {
    for (const entry of queryCache.getEntries({ key: ["recipe"] })) {
      queryCache.remove(entry)
    }
  }

  return {
    recipesByCategory,
    recipesCache,
    favorites,
    loadingList,
    loadingDetail,
    loadingFavorites,
    getRecipesByCategory,
    getRecipeDetail,
    getFavorites,
    getRecipesListByLocale,
    findRecipeIdBySlug,
    getRecipeSlugById,
    findFavoriteIdBySlug,
    getFavoriteSlugById,
    deleteRecipe,
    clearDetailsCache,
    clearCache,
  }
})
