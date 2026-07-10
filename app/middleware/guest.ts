export default defineNuxtRouteMiddleware(async () => {
  const { ensureSessionLoaded } = useAuth()
  const localePath = useLocalePath()

  const isLoggedIn = await ensureSessionLoaded()

  // Redirect to dashboard if already authenticated
  if (isLoggedIn) {
    return navigateTo(localePath("/dashboard"))
  }
})
