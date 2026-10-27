<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"

  const { categoryId } = defineProps<{
    categoryId: string
  }>()

  const recipe = defineModel<string>()
  const { t, locale } = useI18n()

  const recipesStore = useRecipes()
  const { sortRecipeList } = useRecipeSort()
  const loading = computed(() => recipesStore.loadingList)

  const options = computed(() => {
    const recipes = sortRecipeList(recipesStore.recipesByCategory.get(categoryId) ?? [])
    const localeKey = locale.value as LocaleKey

    return recipes.map((item) => ({
      id: item.id,
      slug: item.locale[localeKey]?.slug || item.id,
      title: item.locale[localeKey]?.title || "",
    }))
  })
</script>
<template>
  <div
    v-if="loading"
    class="flex justify-center items-center py-8"
  >
    <ProgressSpinner
      style="width: 40px; height: 40px"
      stroke-width="4"
    />
  </div>
  <div
    v-else-if="options.length === 0"
    class="text-center text-surface-500 py-4"
  >
    {{ t('common.empty') }}
  </div>
  <ListBox
    v-else
    v-model="recipe"
    :options="options"
    option-label="title"
    option-value="slug"
    class="flex-1"
    list-style="max-height: 100% !important;"
  />
</template>
