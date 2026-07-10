import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureSessionLoaded } = useAuth()
  const localePath = useLocalePath()

  const isLoggedIn = await ensureSessionLoaded()

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return navigateTo({
      path: localePath("/auth/login"),
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
