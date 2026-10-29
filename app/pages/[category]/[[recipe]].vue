<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"
  import type { RecipeDetail } from "~/stores/recipes"

  definePageMeta({
    // Clave fija: ni cambiar de receta, ni de categoria, ni de idioma (que traduce la categoria
    // en la URL) remonta la pagina; los watch de la ruta recargan los datos.
    key: () => "recipes",
    middleware: "approved",
  })

  const route = useRoute()
  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const categoriesStore = useCategories()
  const recipesStore = useRecipes()
  const { user, isAdmin } = useAuth()
  const { sortRecipeList } = useRecipeSort()
  const { findIdBySlug, removeById, removeBySlug } = useRecentRecipes()

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
  // Sin red y sin copia guardada: no es que la receta no exista
  const recipeOffline = ref(false)
  const online = useOnline()
  let recipeLoadGeneration = 0

  // URL en cada idioma (categoria y receta traducidas): al cambiar de idioma i18n navega
  // directamente a la URL traducida, sin pasar por la del idioma anterior ni remontar la pagina.
  const setI18nParams = useSetI18nParams()
  watchEffect(() => {
    const category = categoriesStore.categories.find((item) => item.id === categoryId.value)
    if (!category) return
    const detail = selectedSlug.value ? recipeDetail.value : null
    setI18nParams(
      Object.fromEntries(
        LOCALE_KEYS.map((code) => [
          code,
          {
            category: category.locale[code]?.url_name || categoryUrlName.value,
            ...(detail ? { recipe: detail.locales[code]?.slug || selectedSlug.value } : {}),
          },
        ]),
      ),
    )
  })

  const recipePath = (slug: string) => localePath(`/${categoryUrlName.value}/${slug}`)

  // En escritorio la categoria sin receta abre la primera de la lista segun la ordenacion
  // del usuario. En movil se mantiene la lista en linea para elegir.
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const openFirstRecipe = async (): Promise<boolean> => {
    if (!isDesktop.value || recipeSlugParam.value || !categoryId.value) return false
    const [first] = sortRecipeList(recipesStore.recipesByCategory.get(categoryId.value) ?? [])
    const slug = first?.locale[locale.value as LocaleKey]?.slug
    if (!slug) return false
    await navigateTo(recipePath(slug), { replace: true })
    return true
  }

  const loadRecipeBySlug = async (slug: string | undefined) => {
    const generation = ++recipeLoadGeneration
    recipeNotFound.value = false
    recipeOffline.value = false

    if (!slug || !categoryId.value) {
      if (generation === recipeLoadGeneration) {
        recipeDetail.value = null
      }
      return
    }

    const listedId = recipesStore.findRecipeIdBySlug(categoryId.value, slug)
    const recentId = findIdBySlug(slug)
    const recipeId = listedId ?? recentId
    if (!recipeId) {
      if (generation === recipeLoadGeneration) {
        recipeDetail.value = null
        if (!online.value) {
          recipeOffline.value = true
        } else {
          recipeNotFound.value = true
          removeBySlug(slug)
        }
      }
      return
    }

    const forceRefresh = Boolean(recentId)
    if (recipeDetail.value?.id === recipeId && !forceRefresh) return

    const detail = await recipesStore.getRecipeDetail(recipeId, forceRefresh)
    if (generation !== recipeLoadGeneration) return

    recipeDetail.value = detail
    if (!detail) {
      if (!online.value) {
        recipeOffline.value = true
      } else {
        recipeNotFound.value = true
        removeById(recipeId)
      }
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
    if (await openFirstRecipe()) {
      loading.value = false
      return
    }
    await loadRecipeBySlug(recipeSlugParam.value)

    loading.value = false
  }

  await initializeData()

  // Al volver la conexion se reintenta lo que no se pudo cargar
  watch(online, async (isOnline) => {
    if (isOnline && (recipeOffline.value || !recipeDetail.value)) await initializeData()
  })

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
    async (recipeSlug) => {
      if (!recipeSlug && !loading.value && (await openFirstRecipe())) return
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

  const bookItems = computed(() => {
    if (!categoryId.value) return []
    const localeKey = locale.value as LocaleKey
    return sortRecipeList(recipesStore.recipesByCategory.get(categoryId.value) ?? []).map(
      (item) => ({
        id: item.id,
        title: item.locale[localeKey]?.title || "",
        imagePublicId: item.main_image_public_id,
      }),
    )
  })

  const collectionName = computed(
    () =>
      categoriesStore.categoriesByLocale.find((category) => category.id === categoryId.value)
        ?.name ?? "",
  )

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
  <NuxtLayout
    name="sidebar"
    :menu-count="bookItems.length"
    :content-empty="Boolean(categoryId) && !selectedSlug"
  >
    <template #left-menu>
      <RecipeSortSelect />
      <RecipeBookDownloadButton
        :items="bookItems"
        :dialog-title="t('recipeBook.titleCategory', { name: collectionName })"
        :collection-name="collectionName"
        :file-stem="collectionName"
      />
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
        class="w-full min-w-0"
        :class="{ 'mt-4': !isAdmin }"
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
        v-else-if="recipeOffline"
        class="flex flex-col justify-center items-center h-full gap-4 text-center px-4"
        data-testid="recipe-offline"
      >
        <i class="pi pi-wifi text-6xl text-french-lilac-300 dark:text-french-lilac-600" />
        <h2 class="text-2xl font-semibold text-french-lilac-700 dark:text-french-lilac-300">
          {{ t('recipe.offline.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          {{ t('recipe.offline.description') }}
        </p>
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
