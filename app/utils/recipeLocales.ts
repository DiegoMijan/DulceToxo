// Idioma maestro del formulario de recetas: es la primera pestana, la unica donde se cambia
// la estructura (anadir, quitar, reordenar ingredientes y pasos, titulos de seccion) y el
// origen de la traduccion automatica. Los demas idiomas siguen su estructura.
export const RECIPE_SOURCE_LOCALE = "es" as const
export const RECIPE_TARGET_LOCALES = ["gl", "en"] as const

export type RecipeSourceLocale = typeof RECIPE_SOURCE_LOCALE
export type RecipeTargetLocale = (typeof RECIPE_TARGET_LOCALES)[number]
