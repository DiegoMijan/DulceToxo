const favoritesRootSegment = (locale: string): "favorites" | "favoritos" =>
  locale === "en" ? "favorites" : "favoritos"

export const useFavoritesPath = () => {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const allSlug = computed(() => favoritesAllSlug(locale.value))
  const rootSegment = computed(() => favoritesRootSegment(locale.value))

  const favoritesPath = (categorySlug: string, recipeSlug?: string | null) => {
    const path = recipeSlug
      ? `/${rootSegment.value}/${categorySlug}/${recipeSlug}`
      : `/${rootSegment.value}/${categorySlug}`
    return localePath(path)
  }

  const favoritesIndexPath = () => favoritesPath(allSlug.value)

  return {
    allSlug,
    rootSegment,
    favoritesPath,
    favoritesIndexPath,
  }
}
