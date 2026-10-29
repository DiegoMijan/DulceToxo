import { createGlobalState, useStorage } from "@vueuse/core"
import type { LocaleKey } from "#shared/types/Recipe"
import type { components } from "#shared/types/api"
import type { SelectOption } from "#shared/types/Select"

type RecipeListItem = components["schemas"]["RecipeListItem"]
type SortableRecipe = RecipeListItem & { favorited_at?: number }

export const RECIPE_SORT_CODES = [
  "name",
  "ratingAvg",
  "createdAt",
  "updatedAt",
  "difficulty",
  "totalTime",
] as const

export const FAVORITE_SORT_CODES = [...RECIPE_SORT_CODES, "favoritedAt"] as const

export type RecipeSortCode = (typeof RECIPE_SORT_CODES)[number]
export type FavoriteSortCode = (typeof FAVORITE_SORT_CODES)[number]
export type RecipeSortDirection = "asc" | "desc"

export const RECIPE_SORT_DEFAULT_DIRECTION: Record<FavoriteSortCode, RecipeSortDirection> = {
  name: "asc",
  createdAt: "desc",
  updatedAt: "desc",
  difficulty: "asc",
  totalTime: "asc",
  ratingAvg: "desc",
  favoritedAt: "desc",
}

const RECIPE_SORT_ICONS: Record<FavoriteSortCode, string> = {
  name: "line-md:cake-twotone",
  createdAt: "line-md:calendar",
  updatedAt: "line-md:bell-twotone-loop",
  difficulty: "icon-park-twotone:chef-hat-one",
  totalTime: "tabler:clock",
  ratingAvg: "line-md:star-filled",
  favoritedAt: "mdi:heart",
}

const LEGACY_SORT_CODES: Record<string, RecipeSortCode> = {
  name: "name",
  date: "createdAt",
  update: "updatedAt",
  difficulty: "difficulty",
}

const isRecipeSortCode = (value: unknown): value is RecipeSortCode =>
  typeof value === "string" && (RECIPE_SORT_CODES as readonly string[]).includes(value)

const isFavoriteSortCode = (value: unknown): value is FavoriteSortCode =>
  typeof value === "string" && (FAVORITE_SORT_CODES as readonly string[]).includes(value)

const readLegacySortCode = (): RecipeSortCode | null => {
  if (!import.meta.client) return null

  try {
    const raw = localStorage.getItem("sort")
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    const code =
      typeof parsed === "string"
        ? parsed
        : parsed && typeof parsed === "object" && "code" in parsed
          ? String((parsed as { code: unknown }).code)
          : null

    if (!code) return null
    if (isRecipeSortCode(code)) return code
    return LEGACY_SORT_CODES[code] ?? null
  } catch {
    return null
  }
}

const getTitle = (recipe: RecipeListItem, locale: LocaleKey): string =>
  recipe.locale[locale]?.title || ""

const getSortValue = (
  recipe: SortableRecipe,
  locale: LocaleKey,
  code: FavoriteSortCode,
): string | number => {
  switch (code) {
    case "name":
      return getTitle(recipe, locale)
    case "createdAt":
      return recipe.created_at
    case "updatedAt":
      return recipe.updated_at
    case "difficulty":
      return recipe.difficulty
    case "totalTime":
      return recipe.prep_time + recipe.cook_time
    case "ratingAvg":
      return recipe.rating_avg ?? 0
    case "favoritedAt":
      return recipe.favorited_at ?? 0
  }
}

const isRatedRecipe = (recipe: RecipeListItem): boolean =>
  hasRecipeVotes(recipe.rating_avg, recipe.rating_count)

const compareRating = (
  left: RecipeListItem,
  right: RecipeListItem,
  direction: RecipeSortDirection,
): number => {
  const leftRated = isRatedRecipe(left)
  const rightRated = isRatedRecipe(right)
  if (leftRated !== rightRated) return leftRated ? -1 : 1
  if (!leftRated) return 0

  const factor = direction === "asc" ? 1 : -1
  const avgComparison = ((left.rating_avg ?? 0) - (right.rating_avg ?? 0)) * factor
  if (avgComparison !== 0) return avgComparison

  return (left.rating_count - right.rating_count) * factor
}

const compareSortValues = (
  left: string | number,
  right: string | number,
  locale: LocaleKey,
): number => {
  if (typeof left === "string" || typeof right === "string") {
    return String(left).localeCompare(String(right), locale, { sensitivity: "base" })
  }

  return left - right
}

export const sortRecipeListBy = <T extends SortableRecipe>(
  recipes: T[],
  locale: LocaleKey,
  code: FavoriteSortCode,
  direction: RecipeSortDirection,
): T[] => {
  const factor = direction === "asc" ? 1 : -1

  return [...recipes].sort((left, right) => {
    if (code === "ratingAvg") {
      const ratingComparison = compareRating(left, right, direction)
      if (ratingComparison !== 0) return ratingComparison
    }

    const comparison =
      code === "ratingAvg"
        ? 0
        : compareSortValues(
            getSortValue(left, locale, code),
            getSortValue(right, locale, code),
            locale,
          ) * factor

    if (comparison !== 0) return comparison

    const titleComparison = getTitle(left, locale).localeCompare(getTitle(right, locale), locale, {
      sensitivity: "base",
    })
    if (titleComparison !== 0) return titleComparison

    return left.id.localeCompare(right.id)
  })
}

export const useRecipeSort = createGlobalState(() => {
  const { locale, t } = useI18n()

  const sortCode = useStorage<RecipeSortCode>("recipe-sort-code", readLegacySortCode() ?? "name")
  const sortDirection = useStorage<RecipeSortDirection>(
    "recipe-sort-direction",
    RECIPE_SORT_DEFAULT_DIRECTION[readLegacySortCode() ?? "name"],
  )
  const favoriteSortCode = useStorage<FavoriteSortCode>("favorite-sort-code", "favoritedAt")
  const favoriteSortDirection = useStorage<RecipeSortDirection>(
    "favorite-sort-direction",
    RECIPE_SORT_DEFAULT_DIRECTION.favoritedAt,
  )

  const sortOptionsFor = (codes: readonly FavoriteSortCode[]) =>
    computed<SelectOption[]>(() =>
      codes.map((code) => ({
        code,
        name: t(`recipe.sort.${code}`),
        icon: RECIPE_SORT_ICONS[code],
      })),
    )

  const sortOptions = sortOptionsFor(RECIPE_SORT_CODES)
  const favoriteSortOptions = sortOptionsFor(FAVORITE_SORT_CODES)

  const selectedSortOption = computed(
    () => sortOptions.value.find((option) => option.code === sortCode.value) ?? null,
  )
  const selectedFavoriteSortOption = computed(
    () =>
      favoriteSortOptions.value.find((option) => option.code === favoriteSortCode.value) ?? null,
  )

  const setSortCode = (code: RecipeSortCode | SelectOption | string | null) => {
    const raw = typeof code === "string" ? code : code?.code
    const nextCode = isRecipeSortCode(raw) ? raw : "name"
    if (sortCode.value !== nextCode) {
      sortDirection.value = RECIPE_SORT_DEFAULT_DIRECTION[nextCode]
    }
    sortCode.value = nextCode
  }

  const setFavoriteSortCode = (code: FavoriteSortCode | SelectOption | string | null) => {
    const raw = typeof code === "string" ? code : code?.code
    const nextCode = isFavoriteSortCode(raw) ? raw : "favoritedAt"
    if (favoriteSortCode.value !== nextCode) {
      favoriteSortDirection.value = RECIPE_SORT_DEFAULT_DIRECTION[nextCode]
    }
    favoriteSortCode.value = nextCode
  }

  const toggleSortDirection = () => {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  }

  const toggleFavoriteSortDirection = () => {
    favoriteSortDirection.value = favoriteSortDirection.value === "asc" ? "desc" : "asc"
  }

  const sortRecipeList = (recipes: RecipeListItem[]): RecipeListItem[] =>
    sortRecipeListBy(recipes, locale.value as LocaleKey, sortCode.value, sortDirection.value)

  const sortFavoriteList = <T extends SortableRecipe>(recipes: T[]): T[] =>
    sortRecipeListBy(
      recipes,
      locale.value as LocaleKey,
      favoriteSortCode.value,
      favoriteSortDirection.value,
    )

  return {
    sortCode,
    sortDirection,
    sortOptions,
    selectedSortOption,
    setSortCode,
    toggleSortDirection,
    sortRecipeList,
    favoriteSortCode,
    favoriteSortDirection,
    favoriteSortOptions,
    selectedFavoriteSortOption,
    setFavoriteSortCode,
    toggleFavoriteSortDirection,
    sortFavoriteList,
  }
})
