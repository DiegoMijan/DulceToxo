import { useQueryCache } from "@pinia/colada"
import { useCategories } from "~/stores/categories"
import type {
  FavoriteListItem,
  RecipeDetail,
  RecipeListItem,
  RecipeRatingStats,
} from "~/stores/recipes"
import { queryKeys } from "~/queries/keys"
import { categoryRecipesQuery, recipeQuery } from "~/queries/options"

const LOCALE_KEYS = ["es", "en", "gl"] as const

export const getCachedRecipe = (recipeId: string): RecipeDetail | undefined =>
  useQueryCache().getQueryData(recipeQuery(recipeId).key)

export const getCachedCategoryRecipes = (categoryId: string): RecipeListItem[] | undefined =>
  useQueryCache().getQueryData(categoryRecipesQuery(categoryId).key)

export const getCachedFavorites = (): FavoriteListItem[] | undefined =>
  useQueryCache().getQueryData(queryKeys.favorites)

export const patchRecipeDetail = (recipeId: string, patch: Partial<RecipeDetail>) => {
  const queryCache = useQueryCache()
  const current = queryCache.getQueryData(recipeQuery(recipeId).key)
  if (!current) return
  queryCache.setQueryData(recipeQuery(recipeId).key, { ...current, ...patch })
}

export const patchCategoryRecipeLists = (recipeId: string, patch: Partial<RecipeListItem>) => {
  const queryCache = useQueryCache()
  for (const entry of queryCache.getEntries({ key: ["category-recipes"] })) {
    const list = entry.state.value.data as RecipeListItem[] | undefined
    if (!list) continue
    const index = list.findIndex((recipe) => recipe.id === recipeId)
    if (index === -1) continue
    const next = [...list]
    next[index] = { ...next[index], ...patch }
    queryCache.setQueryData(entry.key, next)
  }
}

export const patchFavoritesList = (recipeId: string, patch: Partial<FavoriteListItem>) => {
  const queryCache = useQueryCache()
  const list = queryCache.getQueryData(queryKeys.favorites)
  if (!list) return
  const index = list.findIndex((recipe) => recipe.id === recipeId)
  if (index === -1) return
  const next = [...list]
  next[index] = { ...next[index], ...patch }
  queryCache.setQueryData(queryKeys.favorites, next)
}

export const applyRatingStatsToQueries = (recipeId: string, stats: RecipeRatingStats) => {
  patchRecipeDetail(recipeId, {
    rating_avg: stats.rating_avg,
    rating_count: stats.rating_count,
    my_rating: stats.my_rating,
  })
  patchCategoryRecipeLists(recipeId, {
    rating_avg: stats.rating_avg,
    rating_count: stats.rating_count,
  })
  patchFavoritesList(recipeId, {
    rating_avg: stats.rating_avg,
    rating_count: stats.rating_count,
  })
}

const findListedRecipe = (recipeId: string): { categoryId: string; item: RecipeListItem } | null => {
  const queryCache = useQueryCache()
  for (const entry of queryCache.getEntries({ key: ["category-recipes"] })) {
    const categoryId = entry.key[1]
    const list = entry.state.value.data as RecipeListItem[] | undefined
    if (typeof categoryId !== "string" || !list) continue
    const item = list.find((recipe) => recipe.id === recipeId)
    if (item) return { categoryId, item }
  }
  return null
}

export const buildFavoriteListItem = (recipeId: string): FavoriteListItem | null => {
  const snapshot = getCachedFavorites()?.find((recipe) => recipe.id === recipeId)
  if (snapshot) return { ...snapshot, is_favorite: true }

  const detail = getCachedRecipe(recipeId)
  const listed = findListedRecipe(recipeId)
  if (!detail && !listed) return null

  const localeContent: FavoriteListItem["locale"] = { ...listed?.item.locale }
  if (detail) {
    for (const localeKey of LOCALE_KEYS) {
      const entry = detail.locales[localeKey]
      if (!entry) continue
      localeContent[localeKey] = { slug: entry.slug, title: entry.title }
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
    locale: localeContent,
    favorited_at: Date.now(),
    category: {
      id: categoryId,
      url_name: urlName,
    },
  }
}

export const applyFavoriteStateToQueries = (recipeId: string, isFavorite: boolean) => {
  const queryCache = useQueryCache()
  patchRecipeDetail(recipeId, { is_favorite: isFavorite })
  patchCategoryRecipeLists(recipeId, { is_favorite: isFavorite })

  const list = queryCache.getQueryData(queryKeys.favorites)
  if (!list) return

  const index = list.findIndex((recipe) => recipe.id === recipeId)
  if (isFavorite) {
    if (index !== -1) {
      patchFavoritesList(recipeId, { is_favorite: true })
      return
    }
    const item = buildFavoriteListItem(recipeId)
    if (!item) return
    queryCache.setQueryData(queryKeys.favorites, [item, ...list])
    return
  }

  if (index === -1) return
  queryCache.setQueryData(
    queryKeys.favorites,
    list.filter((recipe) => recipe.id !== recipeId),
  )
}

export const removeRecipeFromQueries = (recipeId: string, categoryId: string) => {
  const queryCache = useQueryCache()
  const detailEntry = queryCache.getEntries({ key: queryKeys.recipe(recipeId), exact: true })[0]
  if (detailEntry) queryCache.remove(detailEntry)

  const list = getCachedCategoryRecipes(categoryId)
  if (list) {
    queryCache.setQueryData(
      categoryRecipesQuery(categoryId).key,
      list.filter((recipe) => recipe.id !== recipeId),
    )
  }

  const favorites = getCachedFavorites()
  if (favorites) {
    queryCache.setQueryData(
      queryKeys.favorites,
      favorites.filter((recipe) => recipe.id !== recipeId),
    )
  }
}

export const optimisticRatingStats = (
  current: { rating_avg: number | null; rating_count: number; my_rating: number | null },
  nextRating: number | null,
): RecipeRatingStats => {
  const previous = current.my_rating
  const count = current.rating_count
  const avg = current.rating_avg ?? 0

  if (nextRating == null) {
    const ratingCount = Math.max(0, count - (previous == null ? 0 : 1))
    if (ratingCount === 0 || previous == null) {
      return { rating_avg: null, rating_count: ratingCount, my_rating: null }
    }
    return {
      rating_avg: Math.round(((avg * count - previous) / ratingCount) * 10) / 10,
      rating_count: ratingCount,
      my_rating: null,
    }
  }

  if (previous == null) {
    const ratingCount = count + 1
    const total = avg * count + nextRating
    return {
      rating_avg: Math.round((total / ratingCount) * 10) / 10,
      rating_count: ratingCount,
      my_rating: nextRating,
    }
  }

  const total = avg * count - previous + nextRating
  return {
    rating_avg: count === 0 ? nextRating : Math.round((total / count) * 10) / 10,
    rating_count: count,
    my_rating: nextRating,
  }
}
