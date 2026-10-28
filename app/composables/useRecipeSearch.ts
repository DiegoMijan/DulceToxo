import type { LocaleKey } from "#shared/types/Recipe"
import type { CategoryIcon } from "~/utils/categoryIcons"
import type { FavoriteListItem, RecipeSearchItem } from "~/stores/recipes"

export type PaletteItemKind = "category" | "favorite" | "recipe" | "ingredient"

export type PaletteItem = {
  id: string
  kind: PaletteItemKind
  optionId: string
  label: string
  to: string
  categoryLabel?: string
  matchedIngredient?: string | null
  ratingAvg?: number | null
  ratingCount?: number
  isFavorite?: boolean
} & Partial<CategoryIcon>

export type PaletteGroup = {
  id: string
  label: string
  items: PaletteItem[]
}

const SEARCH_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100
const MAX_FAVORITES = 5

export const useRecipeSearch = () => {
  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const categoriesStore = useCategories()
  const recipesStore = useRecipes()
  const { categoriesByLocale } = storeToRefs(categoriesStore)
  const { favorites } = storeToRefs(recipesStore)

  const query = ref("")
  const results = ref<RecipeSearchItem[]>([])
  const loading = ref(false)
  const activeIndex = ref(0)

  let abortController: AbortController | null = null
  let searchGeneration = 0

  const localeKey = computed(() => locale.value as LocaleKey)
  const trimmedQuery = computed(() => query.value.trim())
  const isSearching = computed(() => trimmedQuery.value.length >= MIN_QUERY_LENGTH)

  const categoryNameById = computed(() => {
    const names = new Map<string, string>()
    for (const category of categoriesStore.categories) {
      names.set(category.id, category.locale[localeKey.value]?.name ?? category.id)
    }
    return names
  })

  const recipePath = (urlName: string | undefined, slug: string): string =>
    localePath(`/${urlName || ""}/${slug}`)

  const toFavoriteItem = (recipe: FavoriteListItem): PaletteItem => {
    const slug = recipe.locale[localeKey.value]?.slug || recipe.id
    const urlName = recipe.category.url_name[localeKey.value]
    return {
      id: recipe.id,
      kind: "favorite",
      optionId: `palette-option-favorite-${recipe.id}`,
      label: recipe.locale[localeKey.value]?.title || slug,
      categoryLabel: categoryNameById.value.get(recipe.category.id),
      to: recipePath(urlName, slug),
      ratingAvg: recipe.rating_avg,
      ratingCount: recipe.rating_count,
      isFavorite: true,
    }
  }

  const toSearchItem = (recipe: RecipeSearchItem, kind: "recipe" | "ingredient"): PaletteItem => {
    const slug = recipe.locale[localeKey.value]?.slug || recipe.id
    const urlName = recipe.category.url_name[localeKey.value]
    return {
      id: recipe.id,
      kind,
      optionId: `palette-option-${kind}-${recipe.id}`,
      label: recipe.locale[localeKey.value]?.title || slug,
      categoryLabel: categoryNameById.value.get(recipe.category.id),
      to: recipePath(urlName, slug),
      matchedIngredient: recipe.matched_ingredient,
      ratingAvg: recipe.rating_avg,
      ratingCount: recipe.rating_count,
      isFavorite: recipe.is_favorite,
    }
  }

  const categoryItems = computed<PaletteItem[]>(() =>
    categoriesByLocale.value.map((category) => {
      const icon = getCategoryIcon(category.id)
      return {
        id: category.id,
        kind: "category" as const,
        optionId: `palette-option-category-${category.id}`,
        label: category.name,
        to: localePath(`/${category.url_name}`),
        ...icon,
      }
    }),
  )

  const favoriteItems = computed<PaletteItem[]>(() =>
    (favorites.value ?? []).slice(0, MAX_FAVORITES).map((recipe) => toFavoriteItem(recipe)),
  )

  const idleGroups = computed<PaletteGroup[]>(() => {
    const groups: PaletteGroup[] = []
    if (categoryItems.value.length > 0) {
      groups.push({
        id: "categories",
        label: t("search.categories"),
        items: categoryItems.value,
      })
    }
    if (favoriteItems.value.length > 0) {
      groups.push({
        id: "favorites",
        label: t("search.favorites"),
        items: favoriteItems.value,
      })
    }
    return groups
  })

  const resultGroups = computed<PaletteGroup[]>(() => {
    const recipes = results.value
      .filter((item) => item.matched_in === "title")
      .map((item) => toSearchItem(item, "recipe"))
    const ingredients = results.value
      .filter((item) => item.matched_in === "ingredients")
      .map((item) => toSearchItem(item, "ingredient"))

    const groups: PaletteGroup[] = []
    if (recipes.length > 0) {
      groups.push({ id: "recipes", label: t("search.recipes"), items: recipes })
    }
    if (ingredients.length > 0) {
      groups.push({
        id: "ingredients",
        label: t("search.byIngredient"),
        items: ingredients,
      })
    }
    return groups
  })

  const groups = computed(() => (isSearching.value ? resultGroups.value : idleGroups.value))
  const flatItems = computed(() => groups.value.flatMap((group) => group.items))
  const activeItem = computed(() => flatItems.value[activeIndex.value] ?? null)
  const showEmpty = computed(
    () => isSearching.value && !loading.value && resultGroups.value.length === 0,
  )

  const cancelSearch = () => {
    abortController?.abort()
    abortController = null
  }

  const loadIdleData = async () => {
    await Promise.all([categoriesStore.getCategories(), recipesStore.getFavorites()])
  }

  const runSearch = async (q: string) => {
    cancelSearch()
    const generation = ++searchGeneration
    abortController = new AbortController()
    loading.value = true

    try {
      const data = await recipesStore.searchRecipes(q, {
        limit: SEARCH_LIMIT,
        signal: abortController.signal,
      })
      if (generation !== searchGeneration) return
      results.value = data
    } catch (error) {
      if (isAbortError(error) || generation !== searchGeneration) return
      results.value = []
    } finally {
      if (generation === searchGeneration) loading.value = false
    }
  }

  watch(flatItems, () => {
    activeIndex.value = 0
  })

  watchDebounced(
    [trimmedQuery, localeKey],
    ([q]) => {
      if (!q || q.length < MIN_QUERY_LENGTH) {
        cancelSearch()
        searchGeneration += 1
        results.value = []
        loading.value = false
        return
      }
      void runSearch(q.slice(0, MAX_QUERY_LENGTH))
    },
    { debounce: SEARCH_DEBOUNCE_MS },
  )

  const moveActive = (delta: number) => {
    const count = flatItems.value.length
    if (count === 0) return
    activeIndex.value = (activeIndex.value + delta + count) % count
  }

  const setActiveItem = (item: PaletteItem) => {
    const index = flatItems.value.findIndex((entry) => entry.optionId === item.optionId)
    if (index >= 0) activeIndex.value = index
  }

  const reset = () => {
    cancelSearch()
    searchGeneration += 1
    query.value = ""
    results.value = []
    loading.value = false
    activeIndex.value = 0
  }

  return {
    query,
    loading,
    activeIndex,
    groups,
    flatItems,
    activeItem,
    isSearching,
    showEmpty,
    minQueryLength: MIN_QUERY_LENGTH,
    maxQueryLength: MAX_QUERY_LENGTH,
    loadIdleData,
    moveActive,
    setActiveItem,
    reset,
  }
}
