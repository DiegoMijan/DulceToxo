const localeFormSchema = (t: (key: string) => string) =>
  v.object({
    slug: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.idRequired"))),
    title: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.titleRequired"))),
    // Opcionales: si quedan vacias no se muestran en la ficha
    description: v.optional(v.string(), ""),
    notes: v.optional(v.pipe(v.string(), v.maxLength(10000, t("recipe.edit.error.notesTooLong"))), ""),
    ingredients: v.array(v.any()),
    instructions: v.array(v.any()),
  })

export const recipeFormSchema = (t: (key: string) => string) =>
  v.object({
    id: v.optional(v.string()),
    difficulty: v.number(),
    prepTime: v.pipe(v.number(t("recipe.edit.error.prepTimeRequired"))),
    cookTime: v.pipe(v.number(t("recipe.edit.error.cookTimeRequired"))),
    images: v.array(v.string()),
    category: v.pipe(
      v.any(),
      v.check(
        (value) => value !== null && typeof value === "string" && value.length > 0,
        t("recipe.edit.error.categoryRequired"),
      ),
    ),
    locales: v.object({
      es: localeFormSchema(t),
      en: localeFormSchema(t),
      gl: localeFormSchema(t),
    }),
  })
