import { useAuth } from "~/composables/useAuth"

// Paginas de contenido: hay que haber iniciado sesion y estar aprobado por un admin
export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureApprovedSession } = useAuth()
  const localePath = useLocalePath()

  const { isLoggedIn, isApproved } = await ensureApprovedSession()

  if (!isLoggedIn) {
    return redirectToLogin(to.fullPath)
  }

  if (!isApproved) {
    return navigateTo(localePath(PENDING_APPROVAL_ROUTE))
  }
})
