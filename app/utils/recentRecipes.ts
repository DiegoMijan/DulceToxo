import type { LocaleKey } from "#shared/types/Recipe"

export const MAX_RECENT_RECIPES = 6
export const RECENT_STORAGE_PREFIX = "dt-recent:"

export const LOCALE_KEYS: LocaleKey[] = ["gl", "es", "en"]

export type LocalizedText = Record<LocaleKey, string>

export type RecentRecipe = {
  id: string
  category_id: string
  title: LocalizedText
  slug: LocalizedText
  category_url_name: LocalizedText
  viewed_at: number
}

export const recentStorageKey = (userId: string): string => `${RECENT_STORAGE_PREFIX}${userId}`

const isLocalizedText = (value: unknown): value is LocalizedText => {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return LOCALE_KEYS.every((locale) => typeof record[locale] === "string")
}

export const isRecentRecipe = (value: unknown): value is RecentRecipe => {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.category_id === "string" &&
    item.category_id.length > 0 &&
    typeof item.viewed_at === "number" &&
    Number.isFinite(item.viewed_at) &&
    isLocalizedText(item.title) &&
    isLocalizedText(item.slug) &&
    isLocalizedText(item.category_url_name)
  )
}

export const parseRecentRecipes = (raw: string | null): RecentRecipe[] => {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const items: RecentRecipe[] = []
    const seen = new Set<string>()
    for (const entry of parsed) {
      if (!isRecentRecipe(entry) || seen.has(entry.id)) continue
      seen.add(entry.id)
      items.push(entry)
      if (items.length === MAX_RECENT_RECIPES) break
    }
    return items
  } catch {
    return []
  }
}

export const upsertRecentRecipe = (list: RecentRecipe[], entry: RecentRecipe): RecentRecipe[] => {
  const without = list.filter((item) => item.id !== entry.id)
  return [entry, ...without].slice(0, MAX_RECENT_RECIPES)
}

export const readRecentRecipes = (userId: string): RecentRecipe[] => {
  try {
    if (!import.meta.client) return []
    return parseRecentRecipes(localStorage.getItem(recentStorageKey(userId)))
  } catch {
    return []
  }
}

export const writeRecentRecipes = (userId: string, items: RecentRecipe[]): boolean => {
  try {
    if (!import.meta.client) return false
    localStorage.setItem(recentStorageKey(userId), JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
