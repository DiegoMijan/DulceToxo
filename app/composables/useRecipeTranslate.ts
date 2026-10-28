import type { RecipeLocaleForm } from "#shared/types/Recipe"
import type { components } from "#shared/types/api"
import {
  applyTranslatedLocale,
  collectTranslateTexts,
  type TranslateLocaleContent,
} from "~/utils/recipeTranslate"

type LocaleKey = "es" | "en" | "gl"
type TranslateResponse = components["schemas"]["TranslateResponse"]

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
  setFieldValue(locale.slug, next.slug)
  setFieldValue(locale.ingredients, next.ingredients as RecipeLocaleForm["ingredients"]["value"])
  setFieldValue(locale.instructions, next.instructions as RecipeLocaleForm["instructions"]["value"])
}

const isValidTranslateResponse = (
  result: TranslateResponse,
  length: number,
): result is TranslateResponse & { translations: { es: string[]; en: string[] } } => {
  const spanish = result.translations?.es
  const english = result.translations?.en
  return (
    Array.isArray(spanish) &&
    Array.isArray(english) &&
    spanish.length === length &&
    english.length === length
  )
}

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

  const translateFromGalician = async (
    locales: Record<LocaleKey, RecipeLocaleForm> | undefined,
  ) => {
    if (!locales || translating.value) return

    const galician = readLocale(locales.gl)
    const texts = collectTranslateTexts(galician)
    translating.value = true

    try {
      const result = await $fetch<TranslateResponse>("/api/translate", {
        method: "POST",
        body: {
          source: "gl",
          targets: ["es", "en"],
          texts,
        },
      })

      if (!isValidTranslateResponse(result, texts.length)) {
        toast.add({
          severity: "error",
          summary: t("recipe.edit.translate.error.failed"),
          life: 5000,
        })
        return
      }

      writeLocale(
        locales.es,
        applyTranslatedLocale(galician, readLocale(locales.es), result.translations.es),
      )
      writeLocale(
        locales.en,
        applyTranslatedLocale(galician, readLocale(locales.en), result.translations.en),
      )
    } catch (error: unknown) {
      toast.add({
        severity: "error",
        summary: translateErrorSummary(error, t),
        life: 5000,
      })
    } finally {
      translating.value = false
    }
  }

  return { translating, translateFromGalician }
}
