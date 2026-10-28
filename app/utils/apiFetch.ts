import { clearUserScopedQueries } from "~/utils/userQueryCache"
import { isUnauthorizedError } from "~/utils/unauthorizedError"
import { redirectToLogin } from "~/utils/redirectToLogin"

export const apiFetch = async <T>(
  request: string,
  options?: Parameters<typeof $fetch<T>>[1],
): Promise<T> => {
  try {
    return await $fetch<T>(request, options)
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearUserScopedQueries()
      await redirectToLogin()
    }
    throw error
  }
}
