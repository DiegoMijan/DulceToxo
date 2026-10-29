import type { RecipeLocaleForm } from "#shared/types/Recipe"
import type { components } from "#shared/types/api"
import {
  applyTranslatedLocale,
  collectTranslateTexts,
  countUntranslatedTexts,
  type TranslateLocaleContent,
} from "~/utils/recipeTranslate"
import {
  RECIPE_SOURCE_LOCALE,
  RECIPE_TARGET_LOCALES,
  type RecipeTargetLocale,
} from "~/utils/recipeLocales"

type LocaleKey = "es" | "en" | "gl"
type TranslateResponse = components["schemas"]["TranslateResponse"]

export type RecipeTranslateOutcome = { applied: false } | { applied: true; untranslatedCount: number }

interface WritableField<T> {
  value: T
  dirty?: boolean
  pristine?: boolean
}

const getFetchStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined
  const fetchError = error as {
    statusCode?: number
    status?: number
    data?: { statusCode?: number }
  }
  return fetchError.statusCode ?? fetchError.status ?? fetchError.data?.statusCode
}

const readLocale = (locale: RecipeLocaleForm | undefined): TranslateLocaleContent => ({
  slug: locale?.slug?.value ?? "",
  title: locale?.title?.value ?? "",
  description: locale?.description?.value ?? "",
  notes: locale?.notes?.value ?? "",
  ingredients: locale?.ingredients?.value ?? [],
  instructions: locale?.instructions?.value ?? [],
})

const setFieldValue = <T>(field: WritableField<T> | undefined, value: T) => {
  if (!field) return
  field.value = value
  field.dirty = true
  field.pristine = false
}

const writeLocale = (locale: RecipeLocaleForm | undefined, next: TranslateLocaleContent) => {
  if (!locale) return
  setFieldValue(locale.title, next.title)
  setFieldValue(locale.description, next.description)
  setFieldValue(locale.notes, next.notes)
  setFieldValue(locale.slug, next.slug)
  setFieldValue(locale.ingredients, next.ingredients as RecipeLocaleForm["ingredients"]["value"])
  setFieldValue(locale.instructions, next.instructions as RecipeLocaleForm["instructions"]["value"])
}

const isValidTranslateResponse = (
  result: TranslateResponse,
  length: number,
): result is TranslateResponse & { translations: Record<RecipeTargetLocale, string[]> } =>
  RECIPE_TARGET_LOCALES.every((locale) => {
    const texts = result.translations?.[locale]
    return Array.isArray(texts) && texts.length === length
  })

const translateErrorSummary = (error: unknown, t: (key: string) => string): string => {
  const status = getFetchStatus(error)
  if (status === 503) return t("recipe.edit.translate.error.notConfigured")
  if (status === 429) return t("recipe.edit.translate.error.quotaExceeded")
  return t("recipe.edit.translate.error.failed")
}

export const useRecipeTranslate = () => {
  const translating = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  const translateFromSource = async (
    locales: Record<LocaleKey, RecipeLocaleForm> | undefined,
  ): Promise<RecipeTranslateOutcome> => {
    if (!locales || translating.value) return { applied: false }

    const source = readLocale(locales[RECIPE_SOURCE_LOCALE])
    const texts = collectTranslateTexts(source)
    translating.value = true

    try {
      const result = await $fetch<TranslateResponse>("/api/translate", {
        method: "POST",
        body: {
          source: RECIPE_SOURCE_LOCALE,
          targets: [...RECIPE_TARGET_LOCALES],
          texts,
        },
      })

      if (!isValidTranslateResponse(result, texts.length)) {
        toast.add({
          severity: "error",
          summary: t("recipe.edit.translate.error.failed"),
          life: 5000,
        })
        return { applied: false }
      }

      for (const target of RECIPE_TARGET_LOCALES) {
        writeLocale(
          locales[target],
          applyTranslatedLocale(source, readLocale(locales[target]), result.translations[target]),
        )
      }

      const untranslatedCount = countUntranslatedTexts(texts, result.translations)
      toast.add({
        severity: untranslatedCount > 0 ? "warn" : "success",
        summary: t("recipe.edit.translate.success"),
        detail:
          untranslatedCount > 0
            ? t("recipe.edit.translate.untranslated", untranslatedCount)
            : undefined,
        life: 6000,
      })

      return { applied: true, untranslatedCount }
    } catch (error: unknown) {
      toast.add({
        severity: "error",
        summary: translateErrorSummary(error, t),
        life: 5000,
      })
      return { applied: false }
    } finally {
      translating.value = false
    }
  }

  return { translating, translateFromSource }
}
