<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"

  const route = useRoute()
  const { locale, t } = useI18n()
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
  const recipeNotFound = ref(false)

  const initializeData = async () => {
    loading.value = true
    recipeNotFound.value = false

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
      } else {
        recipeNotFound.value = true
      }
    }

    loading.value = false
  }

  await initializeData()

  watch(selectedSlug, async (newSlug) => {
    if (!newSlug || !categoryId.value) return

    recipeNotFound.value = false
    const recipeId = recipesStore.findRecipeIdBySlug(categoryId.value, newSlug)
    if (recipeId) {
      recipeDetail.value = await recipesStore.getRecipeDetail(recipeId)
    } else {
      recipeDetail.value = null
      recipeNotFound.value = true
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
      <div
        v-else-if="recipeNotFound"
        class="flex flex-col justify-center items-center h-full gap-4 text-center px-4"
      >
        <i class="pi pi-search text-6xl text-french-lilac-300 dark:text-french-lilac-600" />
        <h2 class="text-2xl font-semibold text-french-lilac-700 dark:text-french-lilac-300">
          {{ t('recipe.notFound') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          {{ t('recipe.notFoundDescription') }}
        </p>
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
