import { useAuth } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()

  // Redirect to login if not authenticated
  if (!isLoggedIn.value) {
    return navigateTo({
      path: "/auth/login",
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
