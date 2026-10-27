import type { LocaleKey } from "~/../../shared/types/Recipe.d.ts"

export interface RecipeListItem {
  id: string
  locale: Record<LocaleKey, { slug: string; title: string }>
}

export interface RecipeLocaleContent {
  id: string
  slug: string
  title: string
  description: string
}

export interface RecipeIngredientContent {
  id: string
  order: number
  description: string
}

export interface RecipeStepContent {
  id: string
  order: number
  description: string
}

export interface RecipeImageContent {
  id: string
  public_id: string
  order: number
}

export interface RecipeDetail {
  id: string
  category_id: string
  difficulty: 1 | 2 | 3 | 4 | 5
  prep_time: number
  cook_time: number
  author_id: string | null
  created_at: number
  updated_at: number
  locales: Record<LocaleKey, RecipeLocaleContent>
  ingredients: Record<LocaleKey, RecipeIngredientContent[]>
  steps: Record<LocaleKey, RecipeStepContent[]>
  images: RecipeImageContent[]
}

export const useRecipes = defineStore("recipes", () => {
  const { locale } = useI18n()

  const recipesByCategory = ref<Map<string, RecipeListItem[]>>(new Map())
  const recipesCache = ref<Map<string, RecipeDetail>>(new Map())
  const loadingList = ref(false)
  const loadingDetail = ref(false)

  const getRecipesByCategory = async (categoryId: string, force = false) => {
    if (!force && recipesByCategory.value.has(categoryId)) {
      return recipesByCategory.value.get(categoryId) || []
    }

    loadingList.value = true
    try {
      const data = await $fetch<RecipeListItem[]>(`/api/categories/${categoryId}/recipes`)
      recipesByCategory.value.set(categoryId, data || [])
      return data || []
    } catch {
      return recipesByCategory.value.get(categoryId) || []
    } finally {
      loadingList.value = false
    }
  }

  const getRecipeDetail = async (recipeId: string, force = false) => {
    if (!force && recipesCache.value.has(recipeId)) {
      return recipesCache.value.get(recipeId) || null
    }

    loadingDetail.value = true
    try {
      const data = await $fetch<RecipeDetail>(`/api/recipes/${recipeId}`)
      if (data) {
        recipesCache.value.set(recipeId, data)
      }
      return data || null
    } catch {
      return recipesCache.value.get(recipeId) || null
    } finally {
      loadingDetail.value = false
    }
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
    const data = await $fetch<{ deleted: boolean; id: string }>(`/api/recipes/${recipeId}`, {
      method: "DELETE",
    })
    removeRecipeFromCache(recipeId, categoryId)
    return data
  }

  const clearCache = () => {
    recipesByCategory.value.clear()
    recipesCache.value.clear()
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
    clearCache,
  }
})
