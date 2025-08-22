export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn, isLoading } = useAuth()

  // Wait for session to load
  if (isLoading.value) {
    return
  }

  // Redirect to dashboard if already authenticated
  if (isLoggedIn.value) {
    return navigateTo("/dashboard")
  }
})
