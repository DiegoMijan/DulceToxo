import { useQueryCache } from "@pinia/colada"
import { queryKeys } from "~/queries/keys"

const userScopedFilters = () =>
  [{ key: ["recipe"] as const }, { key: ["category-recipes"] as const }, { key: queryKeys.favorites }] as const

export const clearUserScopedQueries = (queryCache = useQueryCache()) => {
  for (const filter of userScopedFilters()) {
    for (const entry of queryCache.getEntries(filter)) {
      queryCache.remove(entry)
    }
  }
}

export const invalidateUserScopedQueries = (queryCache = useQueryCache()) =>
  Promise.all([
    queryCache.invalidateQueries({ key: ["recipe"] }),
    queryCache.invalidateQueries({ key: ["category-recipes"] }),
    queryCache.invalidateQueries({ key: queryKeys.favorites }),
  ])

