import type { PiniaColadaOptions } from "@pinia/colada"

const THIRTY_MINUTES_MS = 30 * 60 * 1000

/**
 * Recipe and category payloads already include gl+es+en, and they only change
 * through mutations (vote, favorite, editor save/delete). The previous store
 * never stale-refetched; a short staleTime would refetch on every navigation
 * after a few seconds and break "one detail request per change, none if cached".
 *
 * staleTime Infinity: cached queries stay fresh until we invalidate or update
 * them from a mutation.
 * gcTime 30 min: unused lists/details from earlier categories stay around for
 * the rest of a typical session (switching category and coming back).
 * refetchOnWindowFocus/Reconnect off: those would bypass the same cache rule.
 */
export default {
  queryOptions: {
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: THIRTY_MINUTES_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
} satisfies PiniaColadaOptions
