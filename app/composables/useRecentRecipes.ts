import type { LocaleKey } from "#shared/types/Recipe"
import type { RecipeDetail } from "~/stores/recipes"
import {
  LOCALE_KEYS,
  type LocalizedText,
  type RecentRecipe,
  readRecentRecipes,
  upsertRecentRecipe,
  writeRecentRecipes,
} from "~/utils/recentRecipes"

const emptyLocalizedText = (): LocalizedText => ({ gl: "", es: "", en: "" })

const localizedText = (pick: (locale: LocaleKey) => string | undefined): LocalizedText => {
  const values = emptyLocalizedText()
  for (const locale of LOCALE_KEYS) {
    values[locale] = pick(locale)?.trim() ?? ""
  }

  const fallback = values.gl || values.es || values.en
  if (!fallback) return values

  for (const locale of LOCALE_KEYS) {
    if (!values[locale]) values[locale] = fallback
  }
  return values
}

const matchesSlug = (item: RecentRecipe, slug: string): boolean =>
  LOCALE_KEYS.some((locale) => item.slug[locale] === slug)

export const useRecentRecipes = createSharedComposable(() => {
  const { user } = useAuth()
  const categoriesStore = useCategories()
  const items = ref<RecentRecipe[]>([])
  const userId = computed(() => user.value?.id ?? null)

  const persist = (next: RecentRecipe[]) => {
    const id = userId.value
    if (!id) {
      items.value = []
      return
    }

    items.value = writeRecentRecipes(id, next) ? next : []
  }

  const reload = () => {
    const id = userId.value
    items.value = id ? readRecentRecipes(id) : []
  }

  const toRecentRecipe = (recipe: RecipeDetail): RecentRecipe | null => {
    if (!recipe.id || !recipe.category_id) return null

    const category = categoriesStore.categories.find((entry) => entry.id === recipe.category_id)

    return {
      id: recipe.id,
      category_id: recipe.category_id,
      title: localizedText((locale) => recipe.locales[locale]?.title),
      slug: localizedText((locale) => recipe.locales[locale]?.slug),
      category_url_name: localizedText((locale) => category?.locale[locale]?.url_name),
      viewed_at: Date.now(),
    }
  }

  const addRecipeView = (recipe: RecipeDetail) => {
    if (!userId.value) return
    const entry = toRecentRecipe(recipe)
    if (!entry) return
    persist(upsertRecentRecipe(items.value, entry))
  }

  const removeById = (recipeId: string) => {
    if (!items.value.some((item) => item.id === recipeId)) return
    persist(items.value.filter((item) => item.id !== recipeId))
  }

  const removeBySlug = (slug: string) => {
    if (!slug || !items.value.some((item) => matchesSlug(item, slug))) return
    persist(items.value.filter((item) => !matchesSlug(item, slug)))
  }

  const findIdBySlug = (slug: string): string | null => {
    if (!slug) return null
    return items.value.find((item) => matchesSlug(item, slug))?.id ?? null
  }

  const clear = () => {
    persist([])
  }

  watch(
    userId,
    () => {
      reload()
    },
    { immediate: true },
  )

  return {
    items: computed(() => items.value),
    reload,
    addRecipeView,
    removeById,
    removeBySlug,
    findIdBySlug,
    clear,
  }
})
