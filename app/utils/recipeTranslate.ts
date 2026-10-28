import { RECIPE_TARGET_LOCALES, type RecipeTargetLocale } from "./recipeLocales"
import { slugFromTitle } from "./slugFromTitle"

export interface TranslateRow {
  id: string
  order: number
  description: string
  is_heading?: boolean
}

export interface TranslateLocaleContent {
  slug: string
  title: string
  description: string
  ingredients: TranslateRow[]
  instructions: TranslateRow[]
}

export const collectTranslateTexts = (source: TranslateLocaleContent): string[] => [
  source.title,
  source.description,
  ...source.ingredients.map((row) => row.description),
  ...source.instructions.map((row) => row.description),
]

export const countUntranslatedTexts = (
  sourceTexts: string[],
  translations: Record<RecipeTargetLocale, string[]>,
): number => {
  let count = 0
  for (const target of RECIPE_TARGET_LOCALES.map((locale) => translations[locale])) {
    for (let index = 0; index < sourceTexts.length; index++) {
      const source = sourceTexts[index]?.trim() ?? ""
      if (!source) continue
      const translated = target[index]?.trim() ?? ""
      if (!translated) count += 1
    }
  }
  return count
}

const rowHasText = (row: TranslateRow): boolean => row.description.trim().length > 0

export const localeHasText = (locale: TranslateLocaleContent): boolean => {
  if (locale.title.trim() || locale.description.trim()) return true
  return locale.ingredients.some(rowHasText) || locale.instructions.some(rowHasText)
}

const nextIngredient = (
  source: TranslateRow,
  existing: TranslateRow | undefined,
  description: string,
): TranslateRow => ({
  ...source,
  ...existing,
  id: existing?.id ?? source.id,
  order: existing?.order ?? source.order,
  description,
  is_heading: existing?.is_heading ?? source.is_heading ?? false,
})

const nextInstruction = (
  source: TranslateRow,
  existing: TranslateRow | undefined,
  description: string,
): TranslateRow => ({
  ...source,
  ...existing,
  id: existing?.id ?? source.id,
  order: existing?.order ?? source.order,
  description,
})

export const applyTranslatedLocale = (
  source: TranslateLocaleContent,
  current: TranslateLocaleContent,
  translated: string[],
): TranslateLocaleContent => {
  const title = translated[0] ?? ""
  const description = translated[1] ?? ""
  const ingredientStart = 2
  const instructionStart = ingredientStart + source.ingredients.length

  return {
    title,
    description,
    slug: slugFromTitle(title),
    ingredients: source.ingredients.map((row, index) =>
      nextIngredient(row, current.ingredients[index], translated[ingredientStart + index] ?? ""),
    ),
    instructions: source.instructions.map((row, index) =>
      nextInstruction(
        row,
        current.instructions[index],
        translated[instructionStart + index] ?? "",
      ),
    ),
  }
}
