export const useFavoritesPath = () => {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const allSlug = computed(() => favoritesAllSlug(locale.value))

  const favoritesPath = (categorySlug: string, recipeSlug?: string | null) => {
    const base = `/favorites/${categorySlug}`
    if (!recipeSlug) return localePath(base)
    return localePath(`${base}/${recipeSlug}`)
  }

  const favoritesIndexPath = () => favoritesPath(allSlug.value)

  return {
    allSlug,
    favoritesPath,
    favoritesIndexPath,
  }
}
