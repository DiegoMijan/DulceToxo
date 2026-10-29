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
export type FavoriteListItem = components["schemas"]["FavoriteListItem"]
export type FavoriteStatus = components["schemas"]["FavoriteStatus"]
export type RecipeSearchItem = components["schemas"]["RecipeSearchItem"]

const LOCALE_KEYS: LocaleKey[] = ["es", "en", "gl"]
const RECIPE_BATCH_SIZE = 60

export type LoadRecipesForPdfOptions = {
  signal?: AbortSignal
  onProgress?: (completed: number, total: number) => void
}

export const useRecipes = defineStore("recipes", () => {
  const { locale } = useI18n()

  // Cache keys are categoryId / recipeId only — they do not include locale.
  // GET /categories/:id/recipes and GET /recipes/:id return gl+es+en fields together;
  // views pick the active language with locale.value. If the backend ever returns a
  // single locale, key these maps per locale or lists/details will stay in the old
  // language after a locale change.
  const recipesByCategory = ref<Map<string, RecipeListItem[]>>(new Map())
  const recipesCache = ref<Map<string, RecipeDetail>>(new Map())
  const favorites = ref<FavoriteListItem[] | null>(null)
  const loadingList = ref(false)
  const loadingDetail = ref(false)
  const loadingFavorites = ref(false)
  const pendingLists = new Map<string, Promise<RecipeListItem[]>>()
  const pendingDetails = new Map<string, Promise<RecipeDetail | null>>()
  const favoriteSnapshots = new Map<string, FavoriteListItem>()
  let pendingFavorites: Promise<FavoriteListItem[]> | null = null
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
    pendingFavorites = null
    favoriteSnapshots.clear()
    recipesByCategory.value = new Map()
    recipesCache.value = new Map()
    favorites.value = null
  }

  const handleUnauthorized = async (error: unknown): Promise<boolean> => {
    // Cuenta sin aprobar (p. ej. un admin le retiro el acceso): a la pagina de pendiente
    if (isPendingApprovalError(error)) {
      clearCache()
      const localePath = useLocalePath()
      await navigateTo(localePath(PENDING_APPROVAL_ROUTE))
      return true
    }
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
        if (isNotFoundError(error)) {
          if (generation === cacheGeneration) {
            recipesCache.value.delete(recipeId)
          }
          return null
        }
        return recipesCache.value.get(recipeId) || null
      } finally {
        loadingDetail.value = false
      }
    })
  }

  const fetchRecipeBatch = async (
    ids: string[],
    generation: number,
    signal?: AbortSignal,
  ): Promise<Map<string, RecipeDetail>> => {
    const data = await $fetch<RecipeDetail[]>("/api/recipes/batch", {
      method: "POST",
      body: { ids },
      signal,
    })
    const fetched = new Map<string, RecipeDetail>()
    for (const detail of data ?? []) {
      rememberDetail(generation, detail)
      fetched.set(detail.id, detail)
    }
    return fetched
  }

  const loadRecipesForPdf = async (
    ids: string[],
    options: LoadRecipesForPdfOptions = {},
  ): Promise<RecipeDetail[]> => {
    const uniqueIds = uniqueIdsPreserveOrder(ids)
    if (uniqueIds.length === 0) return []
    throwIfAborted(options.signal)

    const cached = new Map<string, RecipeDetail>()
    const missing: string[] = []
    for (const id of uniqueIds) {
      const hit = recipesCache.value.get(id)
      if (hit) cached.set(id, hit)
      else missing.push(id)
    }

    let processed = uniqueIds.length - missing.length
    options.onProgress?.(processed, uniqueIds.length)

    const fetched = new Map<string, RecipeDetail>()
    if (missing.length === 0) {
      return uniqueIds.flatMap((id) => {
        const detail = cached.get(id)
        return detail ? [detail] : []
      })
    }

    const generation = cacheGeneration
    try {
      for (const chunk of chunkIds(missing, RECIPE_BATCH_SIZE)) {
        throwIfAborted(options.signal)
        const batch = await fetchRecipeBatch(chunk, generation, options.signal)
        for (const [id, detail] of batch) fetched.set(id, detail)
        processed += chunk.length
        options.onProgress?.(Math.min(processed, uniqueIds.length), uniqueIds.length)
      }
    } catch (error) {
      if (isAbortError(error)) throw error
      if (await handleUnauthorized(error)) return []
      throw error
    }

    return uniqueIds.flatMap((id) => {
      const detail = cached.get(id) ?? fetched.get(id)
      return detail ? [detail] : []
    })
  }

  const searchRecipes = async (
    q: string,
    options: { limit?: number; signal?: AbortSignal } = {},
  ): Promise<RecipeSearchItem[]> => {
    try {
      const data = await $fetch<RecipeSearchItem[]>("/api/recipes/search", {
        query: {
          q,
          locale: locale.value,
          limit: options.limit ?? 20,
        },
        signal: options.signal,
      })
      return data ?? []
    } catch (error) {
      if (isAbortError(error)) throw error
      if (await handleUnauthorized(error)) return []
      console.error("Recipe search failed:", error)
      return []
    }
  }

  const getFavorites = async (force = false) => {
    if (!force && favorites.value) {
      return favorites.value
    }

    if (!force && pendingFavorites) {
      return pendingFavorites
    }

    const request = (async () => {
      const generation = cacheGeneration
      loadingFavorites.value = true
      try {
        const data = await $fetch<FavoriteListItem[]>("/api/favorites")
        if (generation !== cacheGeneration) return []
        favorites.value = data || []
        return favorites.value
      } catch (error) {
        if (await handleUnauthorized(error)) return []
        return favorites.value || []
      } finally {
        loadingFavorites.value = false
      }
    })()

    pendingFavorites = request
    return request.finally(() => {
      if (pendingFavorites === request) {
        pendingFavorites = null
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

  const findFavoriteIdBySlug = (slug: string): string | null => {
    for (const recipe of favorites.value ?? []) {
      for (const localeKey of Object.keys(recipe.locale) as LocaleKey[]) {
        if (recipe.locale[localeKey]?.slug === slug) {
          return recipe.id
        }
      }
    }
    return null
  }

  const getFavoriteSlugById = (recipeId: string): string | null => {
    const recipe = (favorites.value ?? []).find((item) => item.id === recipeId)
    if (!recipe) return null
    return recipe.locale[locale.value as LocaleKey]?.slug || null
  }

  const patchCategoryLists = (recipeId: string, patch: Partial<RecipeListItem>): void => {
    const nextByCategory = new Map(recipesByCategory.value)
    let listChanged = false
    for (const [categoryId, list] of nextByCategory) {
      const index = list.findIndex((recipe) => recipe.id === recipeId)
      if (index === -1) continue
      const nextList = [...list]
      nextList[index] = {
        ...nextList[index],
        ...patch,
      }
      nextByCategory.set(categoryId, nextList)
      listChanged = true
    }
    if (listChanged) {
      recipesByCategory.value = nextByCategory
    }
  }

  const patchFavoritesList = (recipeId: string, patch: Partial<FavoriteListItem>): void => {
    if (!favorites.value) return
    const index = favorites.value.findIndex((recipe) => recipe.id === recipeId)
    if (index === -1) return
    const nextList = [...favorites.value]
    nextList[index] = {
      ...nextList[index],
      ...patch,
    }
    favorites.value = nextList
  }

  const findListItem = (recipeId: string): { categoryId: string; item: RecipeListItem } | null => {
    for (const [categoryId, list] of recipesByCategory.value) {
      const item = list.find((recipe) => recipe.id === recipeId)
      if (item) return { categoryId, item }
    }
    return null
  }

  const buildFavoriteListItem = (recipeId: string): FavoriteListItem | null => {
    const snapshot = favoriteSnapshots.get(recipeId)
    if (snapshot) return { ...snapshot, is_favorite: true }

    const detail = recipesCache.value.get(recipeId)
    const listed = findListItem(recipeId)
    if (!detail && !listed) return null

    const localeContent: FavoriteListItem["locale"] = { ...listed?.item.locale }
    if (detail) {
      for (const localeKey of LOCALE_KEYS) {
        const entry = detail.locales[localeKey]
        if (!entry) continue
        localeContent[localeKey] = {
          slug: entry.slug,
          title: entry.title,
        }
      }
    }

    const categoryId = detail?.category_id ?? listed?.categoryId
    if (!categoryId) return null

    const categoriesStore = useCategories()
    const category = categoriesStore.categories.find((item) => item.id === categoryId)
    const urlName: FavoriteListItem["category"]["url_name"] = {}
    if (category) {
      for (const localeKey of LOCALE_KEYS) {
        const entry = category.locale[localeKey]
        if (entry?.url_name) urlName[localeKey] = entry.url_name
      }
    }

    return {
      id: recipeId,
      difficulty: detail?.difficulty ?? listed?.item.difficulty ?? 1,
      prep_time: detail?.prep_time ?? listed?.item.prep_time ?? 0,
      cook_time: detail?.cook_time ?? listed?.item.cook_time ?? 0,
      created_at: detail?.created_at ?? listed?.item.created_at ?? Date.now(),
      updated_at: detail?.updated_at ?? listed?.item.updated_at ?? Date.now(),
      rating_avg: detail?.rating_avg ?? listed?.item.rating_avg ?? null,
      rating_count: detail?.rating_count ?? listed?.item.rating_count ?? 0,
      is_favorite: true,
      main_image_public_id:
        (detail ? getMainRecipeImage(detail.images)?.public_id : undefined)
        ?? listed?.item.main_image_public_id
        ?? null,
      locale: localeContent,
      favorited_at: Date.now(),
      category: {
        id: categoryId,
        url_name: urlName,
      },
    }
  }

  const applyRatingStats = (recipeId: string, stats: RecipeRatingStats) => {
    const detail = recipesCache.value.get(recipeId)
    if (detail) {
      detail.rating_avg = stats.rating_avg
      detail.rating_count = stats.rating_count
      detail.my_rating = stats.my_rating
    }

    patchCategoryLists(recipeId, {
      rating_avg: stats.rating_avg,
      rating_count: stats.rating_count,
    })
    patchFavoritesList(recipeId, {
      rating_avg: stats.rating_avg,
      rating_count: stats.rating_count,
    })
  }

  const applyFavoriteState = (recipeId: string, isFavorite: boolean) => {
    const detail = recipesCache.value.get(recipeId)
    if (detail) {
      detail.is_favorite = isFavorite
    }

    patchCategoryLists(recipeId, { is_favorite: isFavorite })

    if (!favorites.value) return

    const index = favorites.value.findIndex((recipe) => recipe.id === recipeId)
    if (isFavorite) {
      patchFavoritesList(recipeId, { is_favorite: true })
      if (index !== -1) return
      const item = buildFavoriteListItem(recipeId)
      if (!item) return
      favorites.value = [item, ...favorites.value]
      return
    }

    if (index === -1) return
    const current = favorites.value[index]
    if (current) favoriteSnapshots.set(recipeId, current)
    favorites.value = favorites.value.filter((recipe) => recipe.id !== recipeId)
  }

  const isRecipeFavorite = (recipeId: string): boolean => {
    const detail = recipesCache.value.get(recipeId)
    if (detail) return detail.is_favorite

    const listed = findListItem(recipeId)
    if (listed) return listed.item.is_favorite

    return (favorites.value ?? []).some((recipe) => recipe.id === recipeId)
  }

  const toggleFavorite = async (recipeId: string) => {
    const previous = isRecipeFavorite(recipeId)
    const next = !previous
    applyFavoriteState(recipeId, next)

    try {
      const status = await $fetch<FavoriteStatus>(`/api/recipes/${recipeId}/favorite`, {
        method: next ? "PUT" : "DELETE",
      })
      applyFavoriteState(recipeId, status.is_favorite)
      return status
    } catch (error) {
      applyFavoriteState(recipeId, previous)
      await handleUnauthorized(error)
      throw error
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
    if (favorites.value) {
      favorites.value = favorites.value.filter((recipe) => recipe.id !== recipeId)
    }
    favoriteSnapshots.delete(recipeId)
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
    favorites,
    loadingList,
    loadingDetail,
    loadingFavorites,
    getRecipesByCategory,
    getRecipeDetail,
    loadRecipesForPdf,
    getFavorites,
    searchRecipes,
    getRecipesListByLocale,
    findRecipeIdBySlug,
    getRecipeSlugById,
    findFavoriteIdBySlug,
    getFavoriteSlugById,
    deleteRecipe,
    upsertRating,
    deleteRating,
    toggleFavorite,
    applyRatingStats,
    applyFavoriteState,
    clearDetailsCache,
    clearCache,
  }
})
