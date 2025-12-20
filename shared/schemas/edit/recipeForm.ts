export const recipeFormSchema = (t: (key: string) => string) =>
  v.object({
    title: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.titleRequired"))),
    description: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.descriptionRequired"))),
    ingredients: v.array(v.string()),
    instructions: v.array(v.string()),
    difficulty: v.number(),
    prepTime: v.pipe(v.number(t("recipe.edit.error.prepTimeRequired"))),
    cookTime: v.pipe(v.number(t("recipe.edit.error.cookTimeRequired"))),
    category: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.categoryRequired"))),
    locales: v.object({
      es: v.object({
        title: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.titleRequired"))),
        description: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.descriptionRequired"))),
        ingredients: v.array(v.any()),
        instructions: v.array(v.any()),
      }),
      en: v.object({
        title: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.titleRequired"))),
        description: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.descriptionRequired"))),
        ingredients: v.array(v.any()),
        instructions: v.array(v.any()),
      }),
      gl: v.object({
        title: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.titleRequired"))),
        description: v.pipe(v.string(), v.minLength(1, t("recipe.edit.error.descriptionRequired"))),
        ingredients: v.array(v.any()),
        instructions: v.array(v.any()),
      }),
    }),
  })
