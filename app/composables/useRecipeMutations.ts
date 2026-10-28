import { defineMutation, useMutation } from "@pinia/colada"
import type { FavoriteStatus, RecipeRatingStats, UpsertRecipeRatingRequest } from "~/stores/recipes"
import { apiFetch } from "~/utils/apiFetch"
import {
  applyFavoriteStateToQueries,
  applyRatingStatsToQueries,
  getCachedRecipe,
  optimisticRatingStats,
} from "~/queries/recipeCache"

type RatingSnapshot = {
  recipeId: string
  stats: RecipeRatingStats
}

type FavoriteSnapshot = {
  recipeId: string
  previous: boolean
}

const currentRatingSnapshot = (recipeId: string): RecipeRatingStats => {
  const detail = getCachedRecipe(recipeId)
  return {
    rating_avg: detail?.rating_avg ?? null,
    rating_count: detail?.rating_count ?? 0,
    my_rating: detail?.my_rating ?? null,
  }
}

export const useUpsertRating = defineMutation(() => {
  return useMutation({
    mutation: async ({ recipeId, value }: { recipeId: string; value: number }) => {
      const body: UpsertRecipeRatingRequest = { value }
      return await apiFetch<RecipeRatingStats>(`/api/recipes/${recipeId}/rating`, {
        method: "PUT",
        body,
      })
    },
    onMutate: ({ recipeId, value }): RatingSnapshot => {
      const previous = currentRatingSnapshot(recipeId)
      applyRatingStatsToQueries(recipeId, optimisticRatingStats(previous, value))
      return { recipeId, stats: previous }
    },
    onError: (_error, _vars, context) => {
      if (!context) return
      applyRatingStatsToQueries(context.recipeId, context.stats)
    },
    onSuccess: (stats, { recipeId }) => {
      applyRatingStatsToQueries(recipeId, stats)
    },
  })
})

export const useDeleteRating = defineMutation(() => {
  return useMutation({
    mutation: async (recipeId: string) => {
      return await apiFetch<RecipeRatingStats>(`/api/recipes/${recipeId}/rating`, {
        method: "DELETE",
      })
    },
    onMutate: (recipeId): RatingSnapshot => {
      const previous = currentRatingSnapshot(recipeId)
      applyRatingStatsToQueries(recipeId, optimisticRatingStats(previous, null))
      return { recipeId, stats: previous }
    },
    onError: (_error, _recipeId, context) => {
      if (!context) return
      applyRatingStatsToQueries(context.recipeId, context.stats)
    },
    onSuccess: (stats, recipeId) => {
      applyRatingStatsToQueries(recipeId, stats)
    },
  })
})

export const useToggleFavorite = defineMutation(() => {
  return useMutation({
    mutation: async ({ recipeId, next }: { recipeId: string; next: boolean }) => {
      return await apiFetch<FavoriteStatus>(`/api/recipes/${recipeId}/favorite`, {
        method: next ? "PUT" : "DELETE",
      })
    },
    onMutate: ({ recipeId, next }): FavoriteSnapshot => {
      const previous = getCachedRecipe(recipeId)?.is_favorite ?? false
      applyFavoriteStateToQueries(recipeId, next)
      return { recipeId, previous }
    },
    onError: (_error, _vars, context) => {
      if (!context) return
      applyFavoriteStateToQueries(context.recipeId, context.previous)
    },
    onSuccess: (status, { recipeId }) => {
      applyFavoriteStateToQueries(recipeId, status.is_favorite)
    },
  })
})
