export const isRecipesPage = (route: { params: { category?: unknown } }): boolean =>
  typeof route.params.category === "string" && route.params.category.length > 0
