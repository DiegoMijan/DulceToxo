import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureAdminSession } = useAuth()
  const localePath = useLocalePath()

  const { isLoggedIn, isAdmin } = await ensureAdminSession()

  if (!isLoggedIn) {
    return navigateTo({
      path: localePath("/auth/login"),
      query: {
        redirect: to.fullPath,
      },
    })
  }

  if (!isAdmin) {
    return navigateTo(localePath("/"))
  }
})
