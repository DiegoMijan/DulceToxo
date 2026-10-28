<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"
  import type { FavoriteListItem } from "~/stores/recipes"
  import { useQuery } from "@pinia/colada"
  import { categoriesQuery, favoritesQuery, recipeQuery } from "~/queries/options"
  import { invalidateUserScopedQueries } from "~/utils/userQueryCache"

  defineI18nRoute({
    paths: {
      gl: "/favoritos/[category]/[[recipe]]",
      es: "/favoritos/[category]/[[recipe]]",
      en: "/favorites/[category]/[[recipe]]",
    },
  })

  definePageMeta({
    key: (route) => String(route.params.category),
    middleware: "auth",
  })

  const route = useRoute()
  const { locale, t } = useI18n()
  const localePath = useLocalePath()
  const { allSlug, favoritesPath } = useFavoritesPath()
  const { sortFavoriteList } = useRecipeSort()

  const categoriesStore = useCategories()
  const recipesStore = useRecipes()
  const { user } = useAuth()

  const categoryUrlName = computed(() => String(route.params.category ?? ""))
  const recipeSlugParam = computed(() => {
    const value = route.params.recipe
    return typeof value === "string" ? value : undefined
  })

  const isAllCategory = computed(() => isAllFavoritesCategory(categoryUrlName.value))
  const categoryId = computed(() => {
    if (isAllCategory.value) return null
    return categoriesStore.getCategoryIdByUrlName(categoryUrlName.value)
  })
  const categoryMissing = computed(() => !isAllCategory.value && !categoryId.value)

  const { refresh: refreshCategories } = useQuery(categoriesQuery)
  await refreshCategories()

  const {
    data: favoriteItems,
    isLoading: favoritesFetching,
    refresh: refreshFavorites,
  } = useQuery(favoritesQuery)
  await refreshFavorites()

  const selectedSlug = ref<string | undefined>(recipeSlugParam.value)

  const filteredFavorites = computed(() => {
    const list = favoriteItems.value ?? []
    if (isAllCategory.value) return list
    if (!categoryId.value) return []
    return list.filter((recipe) => recipe.category.id === categoryId.value)
  })

  const sortedFavorites = computed(() => sortFavoriteList(filteredFavorites.value))

  const hasAnyFavorites = computed(() => (favoriteItems.value ?? []).length > 0)
  const listLoading = computed(() => favoritesFetching.value && !favoriteItems.value)

  const recipePath = (slug: string) => favoritesPath(categoryUrlName.value, slug)

  const slugForFavorite = (recipe: FavoriteListItem): string =>
    recipe.locale[locale.value as LocaleKey]?.slug || recipe.id

  const goToFavorite = async (slug: string | undefined, replace = false) => {
    const targetPath = slug
      ? favoritesPath(categoryUrlName.value, slug)
      : favoritesPath(categoryUrlName.value)
    if (route.path !== targetPath) {
      await navigateTo(targetPath, { replace })
    }
  }

  const firstSlug = sortedFavorites.value[0] ? slugForFavorite(sortedFavorites.value[0]) : undefined
  if (firstSlug && !recipeSlugParam.value) {
    selectedSlug.value = firstSlug
    await goToFavorite(firstSlug, true)
  }

  const recipeId = computed(() => {
    const slug = recipeSlugParam.value ?? selectedSlug.value
    if (!slug) return null
    return recipesStore.findFavoriteIdBySlug(slug)
  })

  const { data: recipeDetail, isLoading: detailFetching, refresh: refreshDetail } = useQuery(() =>
    recipeQuery(recipeId.value ?? ""),
  )
  if (recipeId.value) {
    await refreshDetail()
  }

  const detailLoading = computed(() => detailFetching.value && !recipeDetail.value)
  const recipeNotFound = computed(() => {
    const slug = recipeSlugParam.value
    if (!slug) return false
    if (favoritesFetching.value && !favoriteItems.value) return false
    return !recipeId.value
  })

  watch(selectedSlug, async (newSlug) => {
    if (newSlug === recipeSlugParam.value) return
    await goToFavorite(newSlug)
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
    await refreshFavorites()
    if (recipeId.value) await refreshDetail()
  })

  const handleCategorySelect = async (nextCategoryId: string | null) => {
    const nextCategorySlug = nextCategoryId
      ? categoriesStore.getCategoryUrlNameById(nextCategoryId)
      : allSlug.value
    if (!nextCategorySlug) return

    const nextList = sortFavoriteList(
      nextCategoryId
        ? (favoriteItems.value ?? []).filter((recipe) => recipe.category.id === nextCategoryId)
        : (favoriteItems.value ?? []),
    )
    const currentId = recipeDetail.value?.id
    const keepCurrent = Boolean(currentId && nextList.some((recipe) => recipe.id === currentId))
    const nextSlug = keepCurrent
      ? recipeSlugParam.value
      : nextList[0]
        ? slugForFavorite(nextList[0])
        : undefined

    const targetPath = favoritesPath(nextCategorySlug, nextSlug)
    if (route.path !== targetPath) {
      await navigateTo(targetPath)
    }
  }

  const navigateToLocalizedFavorites = async () => {
    const nextCategorySlug = isAllCategory.value
      ? allSlug.value
      : categoryId.value
        ? categoriesStore.getCategoryUrlNameById(categoryId.value)
        : allSlug.value
    if (!nextCategorySlug) return

    if (recipeDetail.value) {
      const newSlug = recipesStore.getFavoriteSlugById(recipeDetail.value.id)
      if (newSlug) {
        selectedSlug.value = newSlug
        const targetPath = favoritesPath(nextCategorySlug, newSlug)
        if (route.path !== targetPath) {
          await navigateTo(targetPath, { replace: true })
        }
        return
      }
    }

    const targetPath = favoritesPath(nextCategorySlug)
    if (route.path !== targetPath) {
      await navigateTo(targetPath, { replace: true })
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
    await navigateToLocalizedFavorites()
  })

  watch(
    () => user.value?.id,
    async (nextUserId, previousUserId) => {
      if (nextUserId === previousUserId) return
      if (!nextUserId) return
      await invalidateUserScopedQueries()
      await refreshFavorites()
      if (recipeId.value) await refreshDetail()
    },
  )

  const favoritesInCurrentFilter = (list: FavoriteListItem[] | null | undefined) => {
    const items = list ?? []
    if (isAllCategory.value) return items
    if (!categoryId.value) return []
    return items.filter((recipe) => recipe.category.id === categoryId.value)
  }

  watch(
    favoriteItems,
    async (list, previous) => {
      if (listLoading.value || !list) return
      const slug = recipeSlugParam.value ?? selectedSlug.value
      const currentId =
        recipeDetail.value?.id ??
        (previous ?? []).find((recipe) =>
          Object.values(recipe.locale).some((entry) => entry?.slug === slug),
        )?.id
      if (!currentId) return
      if (list.some((recipe) => recipe.id === currentId)) return

      const previousFiltered = sortFavoriteList(favoritesInCurrentFilter(previous))
      const oldIndex = previousFiltered.findIndex((recipe) => recipe.id === currentId)
      const candidate = previousFiltered[oldIndex + 1] ?? previousFiltered[oldIndex - 1]
      const remaining = sortedFavorites.value
      const next = remaining.find((recipe) => recipe.id === candidate?.id) ?? remaining[0]

      if (!next) {
        selectedSlug.value = undefined
        await goToFavorite(undefined)
        return
      }

      const nextSlug = slugForFavorite(next)
      selectedSlug.value = nextSlug
      await goToFavorite(nextSlug)
    },
  )
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #left-menu>
      <RecipeSortSelect variant="favorites" />
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
        v-else-if="hasAnyFavorites"
        data-testid="favorites-sidebar-list"
        class="mt-8 w-full min-w-0"
      >
        <RecipeList
          v-model="selectedSlug"
          :items="filteredFavorites"
          :loading="false"
          :nav-label="t('favorites.list.nav')"
          :resolve-to="(slug) => recipePath(slug)"
        />
      </div>
    </template>
    <template #content>
      <div
        v-if="detailLoading && !recipeDetail"
        class="flex justify-center items-center h-full"
      >
        <ProgressSpinner
          style="width: 60px; height: 60px"
          stroke-width="4"
        />
      </div>
      <div
        v-else-if="!hasAnyFavorites"
        class="flex flex-col justify-center items-center h-full gap-4 text-center px-4"
        data-testid="favorites-empty"
      >
        <i class="pi pi-heart text-6xl text-french-lilac-300 dark:text-french-lilac-600" />
        <h2 class="text-2xl font-semibold text-french-lilac-700 dark:text-french-lilac-300">
          {{ t('favorites.empty') }}
        </h2>
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-french-lilac-700 bg-french-lilac-100 hover:bg-french-lilac-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200 dark:bg-french-lilac-900/40 dark:hover:bg-french-lilac-900/70"
        >
          {{ t('favorites.emptyCta') }}
        </NuxtLink>
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
        v-else-if="categoryMissing"
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
      <CategorySelect
        :category="categoryUrlName"
        include-all
        :auto-navigate="false"
        @select="handleCategorySelect"
      />
    </template>
  </NuxtLayout>
</template>
