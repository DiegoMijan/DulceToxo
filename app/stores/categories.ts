export const useCategories = defineStore(
  "categories",
  () => {
    const { locale } = useI18n()

    const categories = ref<CategoryWithLocales[]>([])

    const categoriesByLocale = computed(() => {
      return categories.value.map((category) => {
        const localeContent = category.locale[locale.value]
        return {
          id: category.id,
          name: localeContent?.name ?? "",
          url_name: localeContent?.url_name ?? "",
        }
      })
    })

    const getCategories = async (force = false) => {
      if (!force && categories.value.length > 0) return
      try {
        const data = await $fetch<CategoryWithLocales[]>("/api/categories")
        categories.value = data || []
      } catch {
        // Keep persisted data on fetch failure
      }
    }

    const getCategoryIdByUrlName = (url_name: string): Nullable<string> => {
      return (
        categories.value.find((category) => category.locale[locale.value]?.url_name === url_name)
          ?.id || null
      )
    }

    const getCategoryUrlNameById = (id: Nullable<string>): Nullable<string> => {
      return (
        categories.value.find((category) => category.id === id)?.locale[locale.value]?.url_name ||
        null
      )
    }

    return {
      categories,
      categoriesByLocale,
      getCategories,
      getCategoryIdByUrlName,
      getCategoryUrlNameById,
    }
  },
  {
    persist: true,
  },
)
