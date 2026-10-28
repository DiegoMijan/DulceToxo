<script setup lang="ts">
  import { RECIPE_TARGET_LOCALES, type RecipeTargetLocale } from "~/utils/recipeLocales"
  import type { FormFieldState, FormSubmitEvent } from "@primevue/forms/form"
  import { valibotResolver } from "@primevue/forms/resolvers/valibot"
  import type { SelectChangeEvent } from "primevue/select"
  import { FormField } from "#components"
  import es from "@/../public/img/es.svg"
  import gl from "@/../public/img/es-ga.svg"
  import en from "@/../public/img/gb.svg"
  import { FormField as PrimeVueFormField } from "@primevue/forms"
  import type { RecipeDetail, RecipeListItem } from "~/stores/recipes"
  import type { RecipeLocaleForm } from "#shared/types/Recipe"
  import type { components } from "#shared/types/api"

  type LocaleKey = "es" | "en" | "gl"

  interface RecipeOption {
    id: string
    title: string
    isNew?: boolean
    isDirty?: boolean
  }

  type IngredientFormRow = Pick<
    components["schemas"]["RecipeIngredientContent"],
    "id" | "order" | "description" | "is_heading"
  >
  type RecipeIngredientInput = components["schemas"]["RecipeIngredientInput"]

  interface LocaleData {
    slug: string
    title: string
    description: string
    ingredients: IngredientFormRow[]
    instructions: { id: string; order: number; description: string }[]
  }

  interface RecipeFormValues {
    id: string
    category: string
    difficulty: 1 | 2 | 3 | 4 | 5
    prepTime: number
    cookTime: number
    images: string[]
    locales: Record<LocaleKey, LocaleData>
  }

  const NEW_RECIPE_ID = "__new__"

  const route = useRoute()
  const { recipe: recipeParam } = route.params as { recipe?: string }
  const preselectedCategoryQuery = computed(() => {
    const value = route.query.category
    return typeof value === "string" ? value : ""
  })

  const localePath = useLocalePath()
  const { t, locale } = useI18n()
  const toast = useToast()
  const { formStates, form } = useStateForm("form")
  const categoriesStore = useCategories()
  const { categories, categoriesByLocale } = storeToRefs(categoriesStore)
  const { getCategories } = categoriesStore
  const recipesStore = useRecipes()
  const uploadRef = useTemplateRef<{
    discardSessionUploads: () => Promise<void>
    markSessionPersisted: () => void
  }>("uploadRef")

  const resolver = ref(valibotResolver(recipeFormSchema(t)))
  const cachedRecipeDetail = recipeParam ? recipesStore.recipesCache.get(recipeParam) : undefined
  const loading = ref(Boolean(recipeParam) && !cachedRecipeDetail)
  const loadingRecipes = ref(false)
  const saving = ref(false)
  const { translating, translateFromSource } = useRecipeTranslate()
  const formLocked = computed(() => saving.value || translating.value)
  const noPendingReview = (): Record<RecipeTargetLocale, boolean> =>
    Object.fromEntries(RECIPE_TARGET_LOCALES.map((locale) => [locale, false])) as Record<
      RecipeTargetLocale,
      boolean
    >
  const pendingReview = ref(noPendingReview())
  const selectedRecipeId = ref<string>(recipeParam || NEW_RECIPE_ID)
  const currentRecipe = ref<RecipeDetail | null>(cachedRecipeDetail ?? null)
  const slugErrors = ref<Record<LocaleKey, string | null>>({ es: null, en: null, gl: null })
  const formKey = ref(0)

  const applyFormValues = (values: RecipeFormValues) => {
    initialValues.value = values
    formKey.value += 1
    activeStep.value = 1
    pendingReview.value = noPendingReview()
  }

  const allRecipes = ref<RecipeListItem[]>([])

  const listItemFromDetail = (detail: RecipeDetail): RecipeListItem => ({
    id: detail.id,
    difficulty: detail.difficulty,
    prep_time: detail.prep_time,
    cook_time: detail.cook_time,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    locale: {
      ...(detail.locales.es
        ? { es: { slug: detail.locales.es.slug, title: detail.locales.es.title } }
        : {}),
      ...(detail.locales.en
        ? { en: { slug: detail.locales.en.slug, title: detail.locales.en.title } }
        : {}),
      ...(detail.locales.gl
        ? { gl: { slug: detail.locales.gl.slug, title: detail.locales.gl.title } }
        : {}),
    },
  })

  const recipeOptions = computed<RecipeOption[]>(() => {
    const newOption: RecipeOption = {
      id: NEW_RECIPE_ID,
      title: t("recipe.edit.newRecipe"),
      isNew: true,
    }

    const recipesById = new Map<string, RecipeListItem>()
    for (const recipe of allRecipes.value) {
      recipesById.set(recipe.id, recipe)
    }
    if (currentRecipe.value && !recipesById.has(currentRecipe.value.id)) {
      recipesById.set(currentRecipe.value.id, listItemFromDetail(currentRecipe.value))
    }

    const existingRecipes = [...recipesById.values()].map((r) => ({
      id: r.id,
      title: r.locale[locale.value as LocaleKey]?.title || r.locale.gl?.title || r.id,
      isDirty: selectedRecipeId.value === r.id && formStates.value.isDirty,
    }))

    return [newOption, ...existingRecipes]
  })

  const isNewRecipe = computed(() => selectedRecipeId.value === NEW_RECIPE_ID)

  const createEmptyLocaleData = (): LocaleData => ({
    slug: "",
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
  })

  const resolveCategoryUrlName = (categoryRef: string): string => {
    if (!categoryRef) return ""

    const byId = categories.value.find((category) => category.id === categoryRef)
    if (byId) {
      return byId.locale[locale.value as LocaleKey]?.url_name || byId.locale.gl?.url_name || ""
    }

    const byUrlName = categories.value.find((category) =>
      Object.values(category.locale).some((entry) => entry?.url_name === categoryRef),
    )
    if (byUrlName) {
      return byUrlName.locale[locale.value as LocaleKey]?.url_name || categoryRef
    }

    return ""
  }

  const createInitialValues = (): RecipeFormValues => ({
    id: "",
    category: resolveCategoryUrlName(preselectedCategoryQuery.value),
    difficulty: 2,
    prepTime: 1,
    cookTime: 1,
    images: [],
    locales: {
      es: createEmptyLocaleData(),
      en: createEmptyLocaleData(),
      gl: createEmptyLocaleData(),
    },
  })

  const mapLocaleFormData = (data: RecipeDetail, localeKey: LocaleKey): LocaleData => ({
    slug: data.locales[localeKey]?.slug || "",
    title: data.locales[localeKey]?.title || "",
    description: data.locales[localeKey]?.description || "",
    ingredients:
      data.ingredients[localeKey]?.map((item) => ({
        id: item.id,
        order: item.order,
        description: item.description,
        is_heading: item.is_heading ?? false,
      })) || [],
    instructions:
      data.steps[localeKey]?.map((item) => ({
        id: item.id,
        order: item.order,
        description: item.description,
      })) || [],
  })

  const mapDetailToFormValues = (data: RecipeDetail): RecipeFormValues => ({
    id: data.id,
    category:
      categories.value.find((c) => c.id === data.category_id)?.locale[locale.value as LocaleKey]
        ?.url_name || "",
    difficulty: data.difficulty as RecipeFormValues["difficulty"],
    prepTime: data.prep_time,
    cookTime: data.cook_time,
    images: data.images.map((img) => img.public_id),
    locales: {
      es: mapLocaleFormData(data, "es"),
      en: mapLocaleFormData(data, "en"),
      gl: mapLocaleFormData(data, "gl"),
    },
  })

  const { reactiveForm: initialValues } = useForm<RecipeFormValues>(
    cachedRecipeDetail ? mapDetailToFormValues(cachedRecipeDetail) : createInitialValues(),
  )

  // Primero el idioma maestro (RECIPE_SOURCE_LOCALE), despues los que se traducen de el
  const steps = ref<{ id: number; locale: LocaleKey; img: string }[]>([
    { id: 1, locale: "es", img: es },
    { id: 2, locale: "gl", img: gl },
    { id: 3, locale: "en", img: en },
  ])

  const activeStep = ref(1)

  const collectRecipesFromStore = (): RecipeListItem[] => {
    const categoryList = Array.isArray(categories.value) ? categories.value : []
    return categoryList.flatMap((category) => recipesStore.recipesByCategory.get(category.id) || [])
  }

  const loadAllRecipes = async (force = false) => {
    loadingRecipes.value = true
    try {
      await getCategories()
      if (!force) {
        allRecipes.value = collectRecipesFromStore()
      }

      const categoryList = Array.isArray(categories.value) ? categories.value : []
      const lists = await Promise.all(
        categoryList.map((category) => recipesStore.getRecipesByCategory(category.id, force)),
      )
      allRecipes.value = lists.flat()
    } finally {
      loadingRecipes.value = false
    }
  }

  const applyLoadedRecipe = (data: RecipeDetail) => {
    currentRecipe.value = data
    applyFormValues(mapDetailToFormValues(data))
    loading.value = false
  }

  const loadRecipeDetail = async (recipeId: string, options: { force?: boolean } = {}) => {
    const force = options.force ?? false

    if (recipeId === NEW_RECIPE_ID) {
      currentRecipe.value = null
      loading.value = false
      applyFormValues(createInitialValues())
      return
    }

    slugErrors.value = { es: null, en: null, gl: null }
    await getCategories()

    if (!force) {
      const cached =
        recipesStore.recipesCache.get(recipeId) ??
        (currentRecipe.value?.id === recipeId ? currentRecipe.value : undefined)
      if (cached) {
        if (currentRecipe.value?.id === recipeId && !loading.value) {
          return
        }
        applyLoadedRecipe(cached)
        return
      }
    }

    loading.value = true

    try {
      const data = await recipesStore.getRecipeDetail(recipeId, force)
      if (!data) {
        throw new Error("Failed to load recipe")
      }
      applyLoadedRecipe(data)
    } catch (error) {
      toast.add({
        severity: "error",
        summary: t("recipe.edit.error.loadFailed"),
        life: 5000,
      })
      console.error("Failed to load recipe:", error)
      loading.value = false
    }
  }

  const buildRequestBody = (values: RecipeFormValues) => {
    const categoryId = categories.value.find((c) =>
      Object.values(c.locale).some((l) => l?.url_name === values.category),
    )?.id

    const locales = (["es", "en", "gl"] as const).map((loc) => ({
      locale: loc,
      slug: values.locales[loc].slug,
      title: values.locales[loc].title,
      description: values.locales[loc].description,
    }))

    const ingredients: RecipeIngredientInput[] = (["es", "en", "gl"] as const).flatMap((loc) =>
      values.locales[loc].ingredients.map((ing) => ({
        locale: loc,
        order: ing.order,
        description: ing.description,
        is_heading: ing.is_heading ?? false,
      })),
    )

    const steps = (["es", "en", "gl"] as const).flatMap((loc) =>
      values.locales[loc].instructions.map((step) => ({
        locale: loc,
        order: step.order,
        description: step.description,
      })),
    )

    const images = values.images.map((publicId, index) => ({
      public_id: publicId,
      order: index + 1,
    }))

    return {
      category_id: categoryId,
      difficulty: values.difficulty,
      prep_time: values.prepTime,
      cook_time: values.cookTime,
      locales,
      ingredients,
      steps,
      images,
    }
  }

  const getFetchStatus = (error: unknown): number | undefined => {
    if (!error || typeof error !== "object") return undefined
    const fetchError = error as {
      statusCode?: number
      status?: number
      data?: { statusCode?: number }
    }
    return fetchError.statusCode ?? fetchError.status ?? fetchError.data?.statusCode
  }

  const getFetchMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") return ""
    const fetchError = error as { data?: { message?: string }; message?: string }
    return fetchError.data?.message || fetchError.message || ""
  }

  const handleSlugConflict = (errorMessage: string) => {
    const localeMatch = errorMessage.match(/locale "(\w+)"/)
    if (localeMatch) {
      const conflictLocale = localeMatch[1] as LocaleKey
      slugErrors.value[conflictLocale] = t("recipe.edit.error.slugConflict")
      const stepIndex = steps.value.findIndex((s) => s.locale === conflictLocale)
      if (stepIndex !== -1) {
        activeStep.value = stepIndex + 1
      }
    }
  }

  const onSubmit = async (formEvent: FormSubmitEvent<RecipeFormValues>) => {
    const { valid, values } = formEvent
    if (!valid) return

    saving.value = true
    slugErrors.value = { es: null, en: null, gl: null }

    try {
      const body = buildRequestBody(values)

      if (isNewRecipe.value) {
        const result = await $fetch<components["schemas"]["CreateRecipeResponse"]>("/api/recipes", {
          method: "POST",
          body,
        })

        toast.add({
          severity: "success",
          summary: t("recipe.edit.success.created"),
          life: 3000,
        })

        uploadRef.value?.markSessionPersisted()
        await loadAllRecipes(true)
        selectedRecipeId.value = result.id
        await navigateTo(localePath(`/edit/${result.id}`))
        await loadRecipeDetail(result.id, { force: true })
      } else {
        await $fetch<components["schemas"]["UpdateRecipeResponse"]>(
          `/api/recipes/${selectedRecipeId.value}`,
          {
            method: "PUT",
            body,
          },
        )

        toast.add({
          severity: "success",
          summary: t("recipe.edit.success.updated"),
          life: 3000,
        })

        uploadRef.value?.markSessionPersisted()
        await loadAllRecipes(true)
        await loadRecipeDetail(selectedRecipeId.value, { force: true })
      }
    } catch (error: unknown) {
      if (getFetchStatus(error) === 409) {
        const errorMessage = getFetchMessage(error)
        handleSlugConflict(errorMessage)
        toast.add({
          severity: "error",
          summary: t("recipe.edit.error.slugConflict"),
          life: 5000,
        })
      } else {
        toast.add({
          severity: "error",
          summary: t("recipe.edit.error.saveFailed"),
          life: 5000,
        })
      }
      console.error("Failed to save recipe:", error)
    } finally {
      saving.value = false
    }
  }

  const isTargetLocale = (locale: LocaleKey): locale is RecipeTargetLocale =>
    (RECIPE_TARGET_LOCALES as readonly LocaleKey[]).includes(locale)

  const isPendingReview = (locale: LocaleKey): boolean =>
    isTargetLocale(locale) && pendingReview.value[locale]

  const clearPendingReview = (locale: LocaleKey) => {
    if (isTargetLocale(locale)) pendingReview.value[locale] = false
  }

  const markTranslatedLocalesForReview = () => {
    pendingReview.value = Object.fromEntries(
      RECIPE_TARGET_LOCALES.map((locale) => [locale, true]),
    ) as Record<RecipeTargetLocale, boolean>
    const currentLocale = steps.value.find((step) => step.id === activeStep.value)?.locale
    if (currentLocale) clearPendingReview(currentLocale)
  }

  const handleTranslate = async () => {
    const locales = form.value?.states?.locales as Record<LocaleKey, RecipeLocaleForm> | undefined
    const outcome = await translateFromSource(locales)
    if (!outcome.applied) return
    markTranslatedLocalesForReview()
  }

  const handleActivateStep = (locale: LocaleKey, activateCallback: () => void) => {
    clearPendingReview(locale)
    activateCallback()
  }

  watch(activeStep, (stepId) => {
    const currentLocale = steps.value.find((step) => step.id === stepId)?.locale
    if (currentLocale) clearPendingReview(currentLocale)
  })

  const handleRecipeChange = async (event: SelectChangeEvent) => {
    if (formLocked.value) return

    await uploadRef.value?.discardSessionUploads()
    const newId = event.value as string
    selectedRecipeId.value = newId

    if (newId === NEW_RECIPE_ID) {
      navigateTo(localePath("/edit"))
    } else {
      navigateTo(localePath(`/edit/${newId}`))
    }

    await loadRecipeDetail(newId)
  }

  const onCancel = async () => {
    if (formLocked.value) return

    slugErrors.value = { es: null, en: null, gl: null }
    await uploadRef.value?.discardSessionUploads()
    if (currentRecipe.value) {
      applyLoadedRecipe(currentRecipe.value)
    } else {
      applyFormValues(createInitialValues())
    }
  }

  const onBack = () => {
    if (formLocked.value || !currentRecipe.value) return
    const categoryUrlName = categories.value.find((c) => c.id === currentRecipe.value!.category_id)
      ?.locale[locale.value as LocaleKey]?.url_name
    const recipeSlug = currentRecipe.value.locales[locale.value as LocaleKey]?.slug
    if (categoryUrlName && recipeSlug) {
      navigateTo(localePath(`/${categoryUrlName}/${recipeSlug}`))
    }
  }

  const triggerImagesChange = () => {
    if (form.value?.states?.images) {
      form.value.states.images.dirty = true
      form.value.states.images.pristine = false
    }
  }

  const triggerLocalesChange = (localeKey: LocaleKey, type: "ingredients" | "instructions") => {
    slugErrors.value[localeKey] = null

    const localesStates = form.value?.states?.locales as
      | Record<LocaleKey, { ingredients?: FormFieldState; instructions?: FormFieldState }>
      | undefined

    if (!localesStates) return

    const fieldState = localesStates[localeKey]?.[type]
    if (!fieldState) return

    fieldState.dirty = true
    fieldState.pristine = false
  }

  onMounted(() => {
    void loadAllRecipes()

    if (recipeParam) {
      selectedRecipeId.value = recipeParam
      void loadRecipeDetail(recipeParam)
      return
    }

    loading.value = false
    if (preselectedCategoryQuery.value) {
      applyFormValues(createInitialValues())
    }
  })
</script>
<template>
  <Form
    v-slot="$form"
    :key="formKey"
    ref="form"
    :resolver
    :initialValues
    class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col flex-1 overflow-hidden"
    :aria-busy="formLocked || loading || loadingRecipes"
    @submit="onSubmit"
  >
    <fieldset
      :disabled="formLocked"
      :inert="formLocked ? true : undefined"
      :class="[
        'm-0 flex min-w-0 flex-1 flex-col border-0 p-0',
        { 'pointer-events-none opacity-60': formLocked },
      ]"
    >
      <legend class="sr-only">{{ t('recipe.edit.button') }}</legend>
      <div class="flex flex-wrap items-end gap-6 p-6 md:p-8 border-b border-french-lilac-100 dark:border-gray-700">
        <FormField
          fieldName="id"
          :label="t('recipe.edit.recipeSelected')"
          :form="$form"
          class="min-w-64 grow max-w-sm"
        >
          <template #field>
            <Select
              filter
              name="id"
              :modelValue="selectedRecipeId"
              :options="recipeOptions"
              option-value="id"
              option-label="title"
              :placeholder="t('recipe.edit.recipeSelected')"
              :loading="loadingRecipes"
              :disabled="formLocked"
              class="w-full"
              @change="handleRecipeChange"
            >
              <template #value="slotProps">
                <div
                  v-if="slotProps.value"
                  class="flex items-center gap-2"
                >
                  <NuxtIcon
                    v-if="recipeOptions.find((o) => o.id === slotProps.value)?.isNew"
                    name="line-md:plus"
                    class="text-xl text-green-500"
                  />
                  <div>{{ recipeOptions.find((o) => o.id === slotProps.value)?.title }}</div>
                  <NuxtIcon
                    v-if="recipeOptions.find((o) => o.id === slotProps.value)?.isDirty"
                    name="line-md:pencil-twotone"
                    class="text-xl text-amber-300"
                  />
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <NuxtIcon
                    v-if="slotProps.option.isNew"
                    name="line-md:plus"
                    class="text-xl text-green-500"
                  />
                  <NuxtIcon
                    v-else-if="slotProps.option.isDirty"
                    name="line-md:pencil-twotone"
                    class="text-xl text-amber-300"
                  />
                  <div :class="{ 'ml-7': !slotProps.option.isNew && !slotProps.option.isDirty }">
                    {{ slotProps.option.title }}
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="p-4 text-center text-gray-500">
                  {{ loadingRecipes ? t('recipe.edit.loadingRecipes') : t('recipe.edit.noRecipesYet') }}
                </div>
              </template>
            </Select>
          </template>
        </FormField>

        <div class="flex flex-col gap-1">
          <span class="text-sm font-medium text-french-lilac-600">{{ t('recipe.edit.form.difficulty') }}</span>
          <Rating
            :model-value="$form.difficulty?.value"
            name="difficulty"
            :disabled="formLocked"
          >
            <template #onicon>
              <NuxtIcon
                class="text-xl text-french-lilac-700 dark:text-french-lilac-400"
                name="icon-park-twotone:chef-hat-one"
              />
            </template>
            <template #officon>
              <NuxtIcon
                class="text-xl text-gray-300 dark:text-gray-600"
                name="icon-park-twotone:chef-hat-one"
              />
            </template>
          </Rating>
        </div>
      </div>

      <RecipeEditFormSkeleton v-if="loading" />

      <div
        v-else
        class="flex flex-col gap-8 p-6 md:p-8"
      >
        <section>
          <h2 class="text-lg font-semibold text-french-lilac-700 dark:text-french-lilac-300 mb-3">
            {{ t('upload.title') }}
          </h2>
          <PrimeVueFormField name="images">
            <template v-if="$form.images?.value">
              <FormUpload
                ref="uploadRef"
                v-model:publicIds="$form.images.value"
                :persistedPublicIds="currentRecipe?.images.map((img) => img.public_id) ?? []"
                :disabled="formLocked"
                @change="triggerImagesChange"
              />
            </template>
          </PrimeVueFormField>
        </section>

        <section>
          <Stepper
            v-model:value="activeStep"
            class="basis-160"
          >
            <StepList>
              <Step
                v-for="step in steps"
                v-slot="{ activateCallback, value, a11yAttrs }"
                :key="step.id"
                asChild
                :value="step.id"
              >
                <div
                  :class="['flex flex-row flex-auto gap-2', step.id === 3 ? 'flex-none': 'flex-auto']"
                  v-bind="a11yAttrs.root"
                >
                  <button
                    class="bg-transparent border-0 inline-flex flex-col gap-2 cursor-pointer disabled:cursor-not-allowed"
                    v-bind="a11yAttrs.header"
                    type="button"
                    :disabled="formLocked"
                    @click="handleActivateStep(step.locale, activateCallback)"
                  >
                    <span
                      :class="[
                        'relative rounded-full border-2 w-12 h-12 inline-flex items-center justify-center transition-colors',
                        { 'border-fuchsia-600 border-primary bg-fuchsia-50 dark:bg-fuchsia-950': Number(value) === activeStep, 'border-french-lilac-200 dark:border-gray-600': Number(value) !== activeStep },
                        { 'ring-2 ring-red-500': slugErrors[step.locale] }
                      ]"
                    >
                      <img
                        :src="step.img"
                        :alt="step.locale"
                        class="h-4 rounded"
                      >
                      <span
                        v-if="isPendingReview(step.locale)"
                        class="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[var(--p-primary-color)] ring-2 ring-[var(--p-content-background)]"
                        :data-testid="`translate-pending-review-${step.locale}`"
                        role="img"
                        :aria-label="t('recipe.edit.translate.pendingReview')"
                      />
                    </span>
                  </button>
                  <Divider
                    v-if="step.id !== steps.length"
                    class="mr-2!"
                  />
                </div>
              </Step>
            </StepList>
            <StepPanels class="px-0! pt-4!">
              <StepPanel
                v-for="step in steps"
                :key="step.id"
                :value="step.id"
                class="bg-transparent!"
              >
                <RecipeEditLocale
                  v-model:form="$form.locales"
                  :locale="step.locale"
                  :formInstance="$form"
                  :slug-error="slugErrors[step.locale]"
                  :disabled="formLocked"
                  :translating="translating"
                  @change="triggerLocalesChange"
                  @translate="handleTranslate"
                />
              </StepPanel>
            </StepPanels>
          </Stepper>
        </section>

        <div class="flex flex-wrap gap-4 w-full">
          <FormField
            fieldName="category"
            :label="t('recipe.edit.category')"
            :form="$form"
            class="basis-1/3 grow"
          >
            <template #field>
              <Select
                filter
                name="category"
                :options="categoriesByLocale"
                optionValue="url_name"
                optionLabel="name"
                showClear
                class="w-full"
                :placeholder="t('recipe.edit.categorySelected')"
                :disabled="formLocked"
              />
            </template>
          </FormField>
          <FormField
            fieldName="cookTime"
            :label="t('recipe.edit.form.cookTime')"
            :form="$form"
            class="basis-32 grow"
          >
            <template #field>
              <InputNumber
                name="cookTime"
                class="w-full"
                :min="1"
                :max="10000"
                fluid
                :useGrouping="false"
                :disabled="formLocked"
              />
            </template>
          </FormField>
          <FormField
            fieldName="prepTime"
            :label="t('recipe.edit.form.prepTime')"
            :form="$form"
            class="basis-32 grow"
          >
            <template #field>
              <InputNumber
                name="prepTime"
                class="w-full"
                :min="1"
                :max="10000"
                fluid
                :useGrouping="false"
                :disabled="formLocked"
              />
            </template>
          </FormField>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3 px-6 md:px-8 py-5 bg-french-lilac-50 dark:bg-gray-900/40 border-t border-french-lilac-100 dark:border-gray-700">
        <Button
          v-if="!isNewRecipe && currentRecipe"
          type="button"
          severity="secondary"
          text
          class="mr-auto!"
          :disabled="formLocked"
          @click="onBack"
        >
          <i class="pi pi-arrow-left mr-2" />
          {{ t('recipe.edit.back') }}
        </Button>
        <Button
          type="button"
          severity="danger"
          outlined
          :disabled="!formStates.isDirty || formLocked"
          @click="onCancel"
        >
          <i class="pi pi-times mr-2" />
          {{ t('recipe.edit.cancelChanges') }}
        </Button>
        <Button
          type="submit"
          data-testid="recipe-edit-save"
          :disabled="!formStates.isDirty || formLocked"
          :loading="saving"
        >
          <i
            v-if="!saving"
            class="pi pi-save mr-2"
          />
          {{ t('recipe.edit.save') }}
        </Button>
      </div>
    </fieldset>
  </Form>
</template>
