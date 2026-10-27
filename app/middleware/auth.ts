import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureSessionLoaded } = useAuth()

  const isLoggedIn = await ensureSessionLoaded()

  if (!isLoggedIn) {
    return redirectToLogin(to.fullPath)
  }
})
