<script setup lang="ts">
  const { category } = defineProps<{
    category: string
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const categoriesStore = useCategories()
  const { categoriesByLocale } = storeToRefs(categoriesStore)
  const { getCategoryIdByUrlName, getCategoryUrlNameById } = categoriesStore

  const selectedCategory = ref<Nullable<string>>(getCategoryIdByUrlName(category))

  const pt = {
    overlay: {
      class: "dark:bg-french-lilac-950!",
    },
  }

  watch(categoriesByLocale, () => {
    selectedCategory.value = getCategoryIdByUrlName(category)
  })

  const handleChange = () => {
    const categoryUrlName = getCategoryUrlNameById(selectedCategory.value)
    navigateTo(localePath(`/${categoryUrlName}`))
  }
</script>
<template>
  <div class="w-full">
    <Select
      v-model="selectedCategory"
      :options="categoriesByLocale"
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
