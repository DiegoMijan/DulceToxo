<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"

  const route = useRoute()
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const categoriesStore = useCategories()
  const recipesStore = useRecipes()

  const { category: categoryUrlName, recipe: recipeSlugParam } = route.params as {
    category: string
    recipe?: string
  }

  const categoryId = computed(() => categoriesStore.getCategoryIdByUrlName(categoryUrlName))

  const selectedSlug = ref<string | undefined>(recipeSlugParam)
  const recipeDetail = ref<RecipeDetail | null>(null)
  const loading = ref(true)

  const initializeData = async () => {
    loading.value = true

    await categoriesStore.getCategories()

    const catId = categoryId.value
    if (!catId) {
      loading.value = false
      return
    }

    await recipesStore.getRecipesByCategory(catId)

    if (recipeSlugParam) {
      const recipeId = recipesStore.findRecipeIdBySlug(catId, recipeSlugParam)
      if (recipeId) {
        recipeDetail.value = await recipesStore.getRecipeDetail(recipeId)
      }
    }

    loading.value = false
  }

  await initializeData()

  watch(selectedSlug, async (newSlug) => {
    if (!newSlug || !categoryId.value) return

    const recipeId = recipesStore.findRecipeIdBySlug(categoryId.value, newSlug)
    if (recipeId) {
      recipeDetail.value = await recipesStore.getRecipeDetail(recipeId)
    }

    navigateTo(localePath(`/${categoryUrlName}/${newSlug}`))
  })

  watch(locale, async () => {
    if (!categoryId.value || !recipeDetail.value) return

    const newSlug = recipesStore.getRecipeSlugById(categoryId.value, recipeDetail.value.id)
    if (newSlug && newSlug !== selectedSlug.value) {
      selectedSlug.value = newSlug

      const newCategoryUrlName = categoriesStore.getCategoryUrlNameById(categoryId.value)
      if (newCategoryUrlName) {
        navigateTo(localePath(`/${newCategoryUrlName}/${newSlug}`), { replace: true })
      }
    }
  })
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #left-menu>
      <RecipeSortSelect />
      <Divider
        type="dotted"
        class="my-8!"
      />
      <div
        v-if="loading"
        class="flex justify-center items-center py-8"
      >
        <ProgressSpinner
          style="width: 40px; height: 40px"
          stroke-width="4"
        />
      </div>
      <RecipeList
        v-else-if="categoryId"
        v-model="selectedSlug"
        :category-id="categoryId"
        class="w-full"
      />
    </template>
    <template #content>
      <div
        v-if="loading || recipesStore.loadingDetail"
        class="flex justify-center items-center h-full"
      >
        <ProgressSpinner
          style="width: 60px; height: 60px"
          stroke-width="4"
        />
      </div>
      <RecipeContent
        v-else-if="recipeDetail"
        :recipe="recipeDetail"
      />
    </template>
    <template #right-menu>
      <CategorySelect :category="categoryUrlName" />
    </template>
  </NuxtLayout>
</template>
