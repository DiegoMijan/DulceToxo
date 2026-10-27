<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"

  definePageMeta({
    key: (route) => String(route.params.category),
    middleware: "auth",
  })

  const route = useRoute()
  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const categoriesStore = useCategories()
  const recipesStore = useRecipes()
  const { user } = useAuth()

  const categoryUrlName = computed(() => String(route.params.category ?? ""))
  const recipeSlugParam = computed(() => {
    const value = route.params.recipe
    return typeof value === "string" ? value : undefined
  })

  const categoryId = computed(() => categoriesStore.getCategoryIdByUrlName(categoryUrlName.value))

  const selectedSlug = ref<string | undefined>(recipeSlugParam.value)
  const recipeDetail = ref<RecipeDetail | null>(null)
  const loading = ref(true)
  const recipeNotFound = ref(false)
  let recipeLoadGeneration = 0

  const recipePath = (slug: string) => localePath(`/${categoryUrlName.value}/${slug}`)

  const loadRecipeBySlug = async (slug: string | undefined) => {
    const generation = ++recipeLoadGeneration
    recipeNotFound.value = false

    if (!slug || !categoryId.value) {
      if (generation === recipeLoadGeneration) {
        recipeDetail.value = null
      }
      return
    }

    const recipeId = recipesStore.findRecipeIdBySlug(categoryId.value, slug)
    if (!recipeId) {
      if (generation === recipeLoadGeneration) {
        recipeDetail.value = null
        recipeNotFound.value = true
      }
      return
    }

    if (recipeDetail.value?.id === recipeId) return

    const detail = await recipesStore.getRecipeDetail(recipeId)
    if (generation !== recipeLoadGeneration) return

    recipeDetail.value = detail
    if (!detail) {
      recipeNotFound.value = true
    }
  }

  const initializeData = async () => {
    recipeNotFound.value = false

    await categoriesStore.getCategories()

    const catId = categoryId.value
    if (!catId) {
      loading.value = false
      recipeDetail.value = null
      return
    }

    const hasList = recipesStore.recipesByCategory.has(catId)
    if (!hasList) {
      loading.value = true
    }

    await recipesStore.getRecipesByCategory(catId)
    await loadRecipeBySlug(recipeSlugParam.value)

    loading.value = false
  }

  await initializeData()

  watch(selectedSlug, async (newSlug) => {
    if (newSlug === recipeSlugParam.value) {
      await loadRecipeBySlug(newSlug)
      return
    }

    await loadRecipeBySlug(newSlug)

    if (!newSlug) {
      const categoryPath = localePath(`/${categoryUrlName.value}`)
      if (route.path !== categoryPath) {
        await navigateTo(categoryPath)
      }
      return
    }

    const targetPath = recipePath(newSlug)
    if (route.path !== targetPath) {
      await navigateTo(targetPath)
    }
  })

  watch(
    () => recipeSlugParam.value,
    (recipeSlug) => {
      if (recipeSlug === selectedSlug.value) return
      selectedSlug.value = recipeSlug
    },
  )

  watch(categoryUrlName, async (newUrlName, oldUrlName) => {
    if (newUrlName === oldUrlName) return
    await initializeData()
  })

  const navigateToLocalizedCategory = async () => {
    if (!categoryId.value) return

    const newCategoryUrlName = categoriesStore.getCategoryUrlNameById(categoryId.value)
    if (!newCategoryUrlName) return

    if (recipeDetail.value) {
      const newSlug = recipesStore.getRecipeSlugById(categoryId.value, recipeDetail.value.id)
      if (newSlug) {
        selectedSlug.value = newSlug
        const targetPath = localePath(`/${newCategoryUrlName}/${newSlug}`)
        if (route.path !== targetPath) {
          await navigateTo(targetPath, { replace: true })
        }
        return
      }
    }

    if (newCategoryUrlName !== categoryUrlName.value) {
      const targetPath = localePath(`/${newCategoryUrlName}`)
      if (route.path !== targetPath) {
        await navigateTo(targetPath, { replace: true })
      }
    }
  }

  watch(locale, async (newLocale) => {
    await nextTick()
    if (newLocale !== "gl") {
      await until(() => route.path.startsWith(`/${newLocale}/`)).toBe(true, {
        timeout: 1000,
        throwOnTimeout: false,
      })
    }
    await navigateToLocalizedCategory()
  })

  watch(
    () => user.value?.id,
    async (nextUserId, previousUserId) => {
      if (nextUserId === previousUserId) return
      if (!nextUserId) {
        recipeDetail.value = null
        return
      }
      recipesStore.clearDetailsCache()
      if (!recipeDetail.value) return
      recipeDetail.value = await recipesStore.getRecipeDetail(recipeDetail.value.id, true)
    },
  )
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #left-menu>
      <RecipeSortSelect />
      <RecipeNewButton
        v-if="categoryId"
        :category-id="categoryId"
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
      <div
        v-else-if="categoryId"
        data-testid="recipe-sidebar-list"
        class="mt-8 w-full min-w-0"
      >
        <RecipeList
          v-model="selectedSlug"
          :category-id="categoryId"
        />
      </div>
    </template>
    <template #content>
      <div
        v-if="loading && !recipeDetail"
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
      <div
        v-else-if="!categoryId"
        class="flex flex-col justify-center items-center h-full gap-4 text-center px-4"
      >
        <i class="pi pi-search text-6xl text-french-lilac-300 dark:text-french-lilac-600" />
        <h2 class="text-2xl font-semibold text-french-lilac-700 dark:text-french-lilac-300">
          {{ t('category.notFound') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          {{ t('category.notFoundDescription') }}
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
