/**
 * Query keys are categoryId / recipeId only — they do not include locale.
 * GET /categories, GET /categories/:id/recipes, GET /recipes/:id and GET /favorites
 * return gl+es+en fields together; views pick the active language with locale.value.
 * If the backend ever returns a single locale, key these queries per locale or
 * lists/details will stay in the old language after a locale change.
 */
export const queryKeys = {
  categories: ["categories"] as const,
  categoryRecipes: (categoryId: string) => ["category-recipes", categoryId] as const,
  recipe: (recipeId: string) => ["recipe", recipeId] as const,
  favorites: ["favorites"] as const,
}
