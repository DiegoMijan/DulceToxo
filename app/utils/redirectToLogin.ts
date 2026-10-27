export const redirectToLogin = async (redirectPath?: string) => {
  const localePath = useLocalePath()
  const route = useRoute()
  const redirect = getSafeRedirectPath(redirectPath ?? route.fullPath)

  return navigateTo({
    path: localePath("/auth/login"),
    query: redirect ? { redirect } : {},
  })
}
