import { createAuthClient } from "better-auth/vue"
import { clearUserScopedQueries, invalidateUserScopedQueries } from "~/utils/userQueryCache"

const authClient = createAuthClient()

export const useAuth = () => {
  const session = authClient.useSession()

  const user = computed(() => session.value.data?.user ?? null)
  const isLoggedIn = computed(() => !!session.value.data?.user)
  const isAdmin = computed(
    () => (session.value.data?.user as { type?: number } | undefined)?.type === 1,
  )
  const isLoading = computed(() => session.value.isPending)
  const error = ref<string | null>(null)

  const signIn = async (email: string, password: string) => {
    error.value = null
    const { data, error: signInError } = await authClient.signIn.email({ email, password })
    if (signInError) {
      error.value = signInError.message ?? "Error al iniciar sesión"
      throw new Error(error.value)
    }
    // Sin esto, isLoggedIn puede seguir en false justo después de resolver esta
    // promesa (el store reactivo de useSession tarda un tick en refrescar), y el
    // middleware "auth" rebotaría a login aunque el inicio de sesión fue correcto.
    await session.value.refetch()
    await invalidateUserScopedQueries()
    return { user: data?.user }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    dateOfBirth: string,
  ) => {
    error.value = null
    const { data, error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
    } as never)
    if (signUpError) {
      error.value = signUpError.message ?? "Error al registrarse"
      throw new Error(error.value)
    }
    await session.value.refetch()
    await invalidateUserScopedQueries()
    return { user: data?.user }
  }

  const signOut = async () => {
    const localePath = useLocalePath()

    // User-scoped queries (my_rating, is_favorite, favorites lists) are cleared
    // instead of a manual details cache. Categories stay: they are not per-user.
    clearUserScopedQueries()
    await authClient.signOut()
    clearUserScopedQueries()

    await navigateTo(localePath("/"))
  }

  // Los middlewares de ruta corren fuera del ciclo de montado normal, así que el
  // store reactivo de useSession() puede no haber disparado su primer fetch todavía
  // (isPending se queda en false sin haber pedido nada). Por eso aquí se llama a
  // getSession() directamente en vez de fiarse de isLoading/isLoggedIn reactivos.
  const ensureSessionLoaded = async () => {
    const { data } = await authClient.getSession()
    return !!data?.user
  }

  const ensureAdminSession = async (): Promise<{
    isLoggedIn: boolean
    isAdmin: boolean
  }> => {
    const existingUser = session.value.data?.user
    if (existingUser && !session.value.isPending) {
      const userType = (existingUser as { type?: number }).type
      return { isLoggedIn: true, isAdmin: userType === 1 }
    }

    const { data } = await authClient.getSession()
    if (!data?.user) {
      return { isLoggedIn: false, isAdmin: false }
    }
    const userType = (data.user as { type?: number }).type
    return { isLoggedIn: true, isAdmin: userType === 1 }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    error.value = null
    const { data, error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
    })
    if (changeError) {
      error.value = changeError.message ?? "Error al actualizar la contraseña"
      throw new Error(error.value)
    }
    return { success: !!data }
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updatePassword,
    ensureSessionLoaded,
    ensureAdminSession,
  }
}
