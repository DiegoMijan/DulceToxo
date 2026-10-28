<script setup lang="ts">
  const ALL_OPTION_ID = "__all__"

  const {
    category,
    includeAll = false,
    autoNavigate = true,
  } = defineProps<{
    category: string
    includeAll?: boolean
    autoNavigate?: boolean
  }>()

  const emit = defineEmits<{
    select: [categoryId: string | null]
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { allSlug } = useFavoritesPath()
  const categoriesStore = useCategories()
  const { categoriesByLocale } = storeToRefs(categoriesStore)
  const { getCategoryIdByUrlName, getCategoryUrlNameById } = categoriesStore

  const options = computed(() => {
    if (!includeAll) return categoriesByLocale.value
    return [
      { id: ALL_OPTION_ID, name: t("favorites.all"), url_name: allSlug.value },
      ...categoriesByLocale.value,
    ]
  })

  const resolveSelected = (urlName: string): Nullable<string> => {
    if (includeAll && isAllFavoritesCategory(urlName)) return ALL_OPTION_ID
    return getCategoryIdByUrlName(urlName)
  }

  const selectedCategory = ref<Nullable<string>>(resolveSelected(category))

  const pt = {
    overlay: {
      class: "dark:bg-french-lilac-950!",
    },
  }

  watch([categoriesByLocale, () => category], () => {
    selectedCategory.value = resolveSelected(category)
  })

  const handleChange = () => {
    if (selectedCategory.value === ALL_OPTION_ID) {
      emit("select", null)
      return
    }

    emit("select", selectedCategory.value)
    if (!autoNavigate) return

    const categoryUrlName = getCategoryUrlNameById(selectedCategory.value)
    navigateTo(localePath(`/${categoryUrlName}`))
  }
</script>
<template>
  <div class="w-full">
    <Select
      v-model="selectedCategory"
      :options="options"
      option-label="name"
      option-value="id"
      :placeholder="t('recipe.sortBy')"
      class="w-full"
      :category
      size="small"
      :pt
      @change="handleChange"
    >
      <template #dropdownicon>
        <NuxtIcon name="line-md:cookie" />
      </template>
    </Select>
  </div>
</template>
