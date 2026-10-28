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

export const collectTranslateTexts = (galician: TranslateLocaleContent): string[] => [
  galician.title,
  galician.description,
  ...galician.ingredients.map((row) => row.description),
  ...galician.instructions.map((row) => row.description),
]

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
  galician: TranslateLocaleContent,
  current: TranslateLocaleContent,
  translated: string[],
): TranslateLocaleContent => {
  const title = translated[0] ?? ""
  const description = translated[1] ?? ""
  const ingredientStart = 2
  const instructionStart = ingredientStart + galician.ingredients.length

  return {
    title,
    description,
    slug: slugFromTitle(title),
    ingredients: galician.ingredients.map((source, index) =>
      nextIngredient(source, current.ingredients[index], translated[ingredientStart + index] ?? ""),
    ),
    instructions: galician.instructions.map((source, index) =>
      nextInstruction(
        source,
        current.instructions[index],
        translated[instructionStart + index] ?? "",
      ),
    ),
  }
}
