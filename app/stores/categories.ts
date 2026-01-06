export const useCategories = defineStore(
  "categories",
  () => {
    const { locale } = useI18n()

    const categories = ref<CategoryWithLocales[]>([])

    const categoriesByLocale = computed(() => {
      return categories.value.map((category) => {
        return {
          id: category.id,
          name: category.locale[locale.value].name,
          url_name: category.locale[locale.value].url_name,
        }
      })
    })

    const getCategories = async () => {
      if (categories.value.length > 0) return
      const { data } = await useFetch<CategoryWithLocales[]>("/api/categories")

      categories.value = data.value || []
    }

    const getCategoryIdByUrlName = (url_name: string): Nullable<string> => {
      return (
        categories.value.find((category) => category.locale[locale.value].url_name === url_name)
          ?.id || null
      )
    }

    const getCategoryUrlNameById = (id: Nullable<string>): Nullable<string> => {
      return (
        categories.value.find((category) => category.id === id)?.locale[locale.value].url_name ||
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
