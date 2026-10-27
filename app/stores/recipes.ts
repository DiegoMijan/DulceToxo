import type { LocaleKey } from "~/../../shared/types/Recipe.d.ts"
import type { components } from "#shared/types/api"

export type RecipeListItem = components["schemas"]["RecipeListItem"]
export type RecipeLocaleContent = components["schemas"]["RecipeLocaleContent"]
export type RecipeIngredientContent = components["schemas"]["RecipeIngredientContent"]
export type RecipeStepContent = components["schemas"]["RecipeStepContent"]
export type RecipeImageContent = components["schemas"]["RecipeImageContent"]
export type RecipeDetail = components["schemas"]["RecipeDetail"]
export type DeleteRecipeResponse = components["schemas"]["DeleteRecipeResponse"]
export type RecipeRatingStats = components["schemas"]["RecipeRatingStats"]
export type UpsertRecipeRatingRequest = components["schemas"]["UpsertRecipeRatingRequest"]

export const useRecipes = defineStore("recipes", () => {
  const { locale } = useI18n()

  // Cache keys are categoryId / recipeId only — they do not include locale.
  // GET /categories/:id/recipes and GET /recipes/:id return gl+es+en fields together;
  // views pick the active language with locale.value. If the backend ever returns a
  // single locale, key these maps per locale or lists/details will stay in the old
  // language after a locale change.
  const recipesByCategory = ref<Map<string, RecipeListItem[]>>(new Map())
  const recipesCache = ref<Map<string, RecipeDetail>>(new Map())
  const loadingList = ref(false)
  const loadingDetail = ref(false)
  const pendingLists = new Map<string, Promise<RecipeListItem[]>>()
  const pendingDetails = new Map<string, Promise<RecipeDetail | null>>()
  let cacheGeneration = 0

  const trackPending = <T>(
    pending: Map<string, Promise<T>>,
    key: string,
    factory: () => Promise<T>,
  ): Promise<T> => {
    const request = factory()
    pending.set(key, request)
    return request.finally(() => {
      if (pending.get(key) === request) {
        pending.delete(key)
      }
    })
  }

  const clearCache = () => {
    cacheGeneration += 1
    pendingLists.clear()
    pendingDetails.clear()
    recipesByCategory.value = new Map()
    recipesCache.value = new Map()
  }

  const handleUnauthorized = async (error: unknown): Promise<boolean> => {
    if (!isUnauthorizedError(error)) return false
    clearCache()
    await redirectToLogin()
    return true
  }

  const rememberList = (
    generation: number,
    categoryId: string,
    data: RecipeListItem[],
  ): RecipeListItem[] => {
    if (generation !== cacheGeneration) return []
    recipesByCategory.value.set(categoryId, data)
    return data
  }

  const rememberDetail = (generation: number, data: RecipeDetail | null): RecipeDetail | null => {
    if (generation !== cacheGeneration) return null
    if (data) recipesCache.value.set(data.id, data)
    return data
  }

  const getRecipesByCategory = async (categoryId: string, force = false) => {
    if (!force && recipesByCategory.value.has(categoryId)) {
      return recipesByCategory.value.get(categoryId) || []
    }

    const inFlight = pendingLists.get(categoryId)
    if (!force && inFlight) {
      return inFlight
    }

    return trackPending(pendingLists, categoryId, async () => {
      const generation = cacheGeneration
      loadingList.value = true
      try {
        const data = await $fetch<RecipeListItem[]>(`/api/categories/${categoryId}/recipes`)
        return rememberList(generation, categoryId, data || [])
      } catch (error) {
        if (await handleUnauthorized(error)) return []
        return recipesByCategory.value.get(categoryId) || []
      } finally {
        loadingList.value = false
      }
    })
  }

  const getRecipeDetail = async (recipeId: string, force = false) => {
    if (!force && recipesCache.value.has(recipeId)) {
      return recipesCache.value.get(recipeId) || null
    }

    const inFlight = pendingDetails.get(recipeId)
    if (!force && inFlight) {
      return inFlight
    }

    return trackPending(pendingDetails, recipeId, async () => {
      const generation = cacheGeneration
      loadingDetail.value = true
      try {
        const data = await $fetch<RecipeDetail>(`/api/recipes/${recipeId}`)
        return rememberDetail(generation, data || null)
      } catch (error) {
        if (await handleUnauthorized(error)) return null
        return recipesCache.value.get(recipeId) || null
      } finally {
        loadingDetail.value = false
      }
    })
  }

  const getRecipesListByLocale = (categoryId: string) => {
    const recipes = recipesByCategory.value.get(categoryId) || []
    return recipes.map((recipe) => ({
      id: recipe.id,
      slug: recipe.locale[locale.value as LocaleKey]?.slug || recipe.id,
      title: recipe.locale[locale.value as LocaleKey]?.title || "",
    }))
  }

  const findRecipeIdBySlug = (categoryId: string, slug: string): string | null => {
    const recipes = recipesByCategory.value.get(categoryId) || []
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
    const recipes = recipesByCategory.value.get(categoryId) || []
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe) {
      return recipe.locale[locale.value as LocaleKey]?.slug || null
    }
    return null
  }

  const applyRatingStats = (recipeId: string, stats: RecipeRatingStats) => {
    const detail = recipesCache.value.get(recipeId)
    if (detail) {
      detail.rating_avg = stats.rating_avg
      detail.rating_count = stats.rating_count
      detail.my_rating = stats.my_rating
    }

    const nextByCategory = new Map(recipesByCategory.value)
    let listChanged = false
    for (const [categoryId, list] of nextByCategory) {
      const index = list.findIndex((recipe) => recipe.id === recipeId)
      if (index === -1) continue
      const nextList = [...list]
      nextList[index] = {
        ...nextList[index],
        rating_avg: stats.rating_avg,
        rating_count: stats.rating_count,
      }
      nextByCategory.set(categoryId, nextList)
      listChanged = true
    }
    if (listChanged) {
      recipesByCategory.value = nextByCategory
    }
  }

  const upsertRating = async (recipeId: string, value: number) => {
    const body: UpsertRecipeRatingRequest = { value }
    try {
      const stats = await $fetch<RecipeRatingStats>(`/api/recipes/${recipeId}/rating`, {
        method: "PUT",
        body,
      })
      applyRatingStats(recipeId, stats)
      return stats
    } catch (error) {
      await handleUnauthorized(error)
      throw error
    }
  }

  const deleteRating = async (recipeId: string) => {
    try {
      const stats = await $fetch<RecipeRatingStats>(`/api/recipes/${recipeId}/rating`, {
        method: "DELETE",
      })
      applyRatingStats(recipeId, stats)
      return stats
    } catch (error) {
      await handleUnauthorized(error)
      throw error
    }
  }

  const clearDetailsCache = () => {
    recipesCache.value = new Map()
  }

  const removeRecipeFromCache = (recipeId: string, categoryId: string) => {
    recipesCache.value.delete(recipeId)
    const list = recipesByCategory.value.get(categoryId)
    if (list) {
      recipesByCategory.value.set(
        categoryId,
        list.filter((recipe) => recipe.id !== recipeId),
      )
    }
  }

  const deleteRecipe = async (recipeId: string, categoryId: string) => {
    try {
      const data = await $fetch<DeleteRecipeResponse>(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      })
      removeRecipeFromCache(recipeId, categoryId)
      return data
    } catch (error) {
      await handleUnauthorized(error)
      throw error
    }
  }

  return {
    recipesByCategory,
    recipesCache,
    loadingList,
    loadingDetail,
    getRecipesByCategory,
    getRecipeDetail,
    getRecipesListByLocale,
    findRecipeIdBySlug,
    getRecipeSlugById,
    deleteRecipe,
    upsertRating,
    deleteRating,
    applyRatingStats,
    clearDetailsCache,
    clearCache,
  }
})
