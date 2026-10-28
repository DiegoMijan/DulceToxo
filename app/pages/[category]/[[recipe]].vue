<script setup lang="ts">
  import { useQuery } from "@pinia/colada"
  import { categoriesQuery, categoryRecipesQuery, recipeQuery } from "~/queries/options"
  import { invalidateUserScopedQueries } from "~/utils/userQueryCache"

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

  const { refresh: refreshCategories } = useQuery(categoriesQuery)
  await refreshCategories()

  const categoryId = computed(() => categoriesStore.getCategoryIdByUrlName(categoryUrlName.value))

  const { data: recipeList, isPending: listPending, refresh: refreshList } = useQuery(() =>
    categoryRecipesQuery(categoryId.value ?? ""),
  )
  if (categoryId.value) {
    await refreshList()
  }

  const selectedSlug = ref<string | undefined>(recipeSlugParam.value)

  const recipeId = computed(() => {
    const catId = categoryId.value
    const slug = recipeSlugParam.value
    if (!catId || !slug) return null
    return recipesStore.findRecipeIdBySlug(catId, slug)
  })

  const { data: recipeDetail, isPending: detailPending, refresh: refreshDetail } = useQuery(() =>
    recipeQuery(recipeId.value ?? ""),
  )
  if (recipeId.value) {
    await refreshDetail()
  }

  const listLoading = computed(() => listPending.value && !recipeList.value)
  const detailLoading = computed(() => detailPending.value && !recipeDetail.value)
  const recipeNotFound = computed(() => {
    if (!recipeSlugParam.value || !categoryId.value) return false
    if (listPending.value && !recipeList.value) return false
    return !recipeId.value
  })

  const recipePath = (slug: string) => localePath(`/${categoryUrlName.value}/${slug}`)

  watch(selectedSlug, async (newSlug) => {
    if (newSlug === recipeSlugParam.value) return

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
    await refreshCategories()
    if (categoryId.value) await refreshList()
    if (recipeId.value) await refreshDetail()
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
      if (!nextUserId) return
      await invalidateUserScopedQueries()
      if (recipeId.value) await refreshDetail()
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
        v-if="listLoading"
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
          :items="recipeList ?? []"
          :loading="false"
        />
      </div>
    </template>
    <template #content>
      <div
        v-if="detailLoading"
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
