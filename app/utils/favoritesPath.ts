import type { LocaleKey } from "#shared/types/Recipe"

export const FAVORITES_ALL_SLUGS: Record<LocaleKey, string> = {
  gl: "todas",
  es: "todas",
  en: "all",
}

export const isAllFavoritesCategory = (slug: string): boolean => slug === "all" || slug === "todas"

export const favoritesAllSlug = (locale: string): string =>
  FAVORITES_ALL_SLUGS[locale as LocaleKey] ?? "todas"
