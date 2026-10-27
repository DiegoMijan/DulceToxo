<script setup lang="ts">
  import type { FormFieldState, FormSubmitEvent } from "@primevue/forms/form"
  import { valibotResolver } from "@primevue/forms/resolvers/valibot"
  import type { SelectChangeEvent } from "primevue/select"
  import { FormField } from "#components"
  import es from "@/../public/img/es.svg"
  import gl from "@/../public/img/es-ga.svg"
  import en from "@/../public/img/gb.svg"
  import { FormField as PrimeVueFormField } from "@primevue/forms"
  import type { RecipeDetail, RecipeListItem } from "~/stores/recipes"

  type LocaleKey = "es" | "en" | "gl"

  interface RecipeOption {
    id: string
    title: string
    isNew?: boolean
    isDirty?: boolean
  }

  interface LocaleData {
    slug: string
    title: string
    description: string
    ingredients: { id: string; order: number; description: string }[]
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

  const localePath = useLocalePath()
  const { t, locale } = useI18n()
  const toast = useToast()
  const { formStates, resetForm, form } = useStateForm("form")
  const categoriesStore = useCategories()
  const { categories, categoriesByLocale } = storeToRefs(categoriesStore)
  const { getCategories } = categoriesStore
  const recipesStore = useRecipes()

  const runtimeConfig = useRuntimeConfig()
  const cloudinaryBaseUrl = runtimeConfig.public.cloudinaryBaseUrl as string

  const resolver = ref(valibotResolver(recipeFormSchema(t)))
  const loading = ref(false)
  const loadingRecipes = ref(false)
  const saving = ref(false)
  const selectedRecipeId = ref<string>(recipeParam || NEW_RECIPE_ID)
  const currentRecipe = ref<RecipeDetail | null>(null)
  const slugErrors = ref<Record<LocaleKey, string | null>>({ es: null, en: null, gl: null })

  const allRecipes = ref<RecipeListItem[]>([])

  const recipeOptions = computed<RecipeOption[]>(() => {
    const newOption: RecipeOption = {
      id: NEW_RECIPE_ID,
      title: t("recipe.edit.newRecipe"),
      isNew: true,
    }

    const existingRecipes = allRecipes.value.map((r) => ({
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

  const createInitialValues = (): RecipeFormValues => ({
    id: "",
    category: "",
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

  const { reactiveForm: initialValues } = useForm<RecipeFormValues>(createInitialValues())

  const steps = ref<{ id: number; locale: LocaleKey; img: string }[]>([
    { id: 1, locale: "gl", img: gl },
    { id: 2, locale: "es", img: es },
    { id: 3, locale: "en", img: en },
  ])

  const activeStep = ref(1)

  const loadAllRecipes = async () => {
    loadingRecipes.value = true
    try {
      await getCategories()
      const allRecipesList: RecipeListItem[] = []

      const categoryList = Array.isArray(categories.value) ? categories.value : []
      for (const category of categoryList) {
        const recipes = await recipesStore.getRecipesByCategory(category.id, true)
        allRecipesList.push(...recipes)
      }

      allRecipes.value = allRecipesList
    } finally {
      loadingRecipes.value = false
    }
  }

  const loadRecipeDetail = async (recipeId: string) => {
    if (recipeId === NEW_RECIPE_ID) {
      currentRecipe.value = null
      initialValues.value = createInitialValues()
      resetForm()
      return
    }

    loading.value = true
    slugErrors.value = { es: null, en: null, gl: null }

    try {
      const data = await $fetch<RecipeDetail>(`/api/recipes/${recipeId}`)
      currentRecipe.value = data

      const categoryUrlName = categories.value
        .find((c) => c.id === data.category_id)
        ?.locale[locale.value as LocaleKey]?.url_name || ""

      const newValues: RecipeFormValues = {
        id: data.id,
        category: categoryUrlName,
        difficulty: data.difficulty,
        prepTime: data.prep_time,
        cookTime: data.cook_time,
        images: data.images.map((img) => `${cloudinaryBaseUrl}${img.public_id}`),
        locales: {
          es: {
            slug: data.locales.es?.slug || "",
            title: data.locales.es?.title || "",
            description: data.locales.es?.description || "",
            ingredients: data.ingredients.es?.map((i) => ({
              id: i.id,
              order: i.order,
              description: i.description,
            })) || [],
            instructions: data.steps.es?.map((s) => ({
              id: s.id,
              order: s.order,
              description: s.description,
            })) || [],
          },
          en: {
            slug: data.locales.en?.slug || "",
            title: data.locales.en?.title || "",
            description: data.locales.en?.description || "",
            ingredients: data.ingredients.en?.map((i) => ({
              id: i.id,
              order: i.order,
              description: i.description,
            })) || [],
            instructions: data.steps.en?.map((s) => ({
              id: s.id,
              order: s.order,
              description: s.description,
            })) || [],
          },
          gl: {
            slug: data.locales.gl?.slug || "",
            title: data.locales.gl?.title || "",
            description: data.locales.gl?.description || "",
            ingredients: data.ingredients.gl?.map((i) => ({
              id: i.id,
              order: i.order,
              description: i.description,
            })) || [],
            instructions: data.steps.gl?.map((s) => ({
              id: s.id,
              order: s.order,
              description: s.description,
            })) || [],
          },
        },
      }

      initialValues.value = newValues
      resetForm()
    } catch (error) {
      toast.add({
        severity: "error",
        summary: t("recipe.edit.error.loadFailed"),
        life: 5000,
      })
      console.error("Failed to load recipe:", error)
    } finally {
      loading.value = false
    }
  }

  const buildRequestBody = (values: RecipeFormValues) => {
    const categoryId = categories.value.find((c) =>
      Object.values(c.locale).some((l) => l.url_name === values.category),
    )?.id

    const locales = (["es", "en", "gl"] as const).map((loc) => ({
      locale: loc,
      slug: values.locales[loc].slug,
      title: values.locales[loc].title,
      description: values.locales[loc].description,
    }))

    const ingredients = (["es", "en", "gl"] as const).flatMap((loc) =>
      values.locales[loc].ingredients.map((ing) => ({
        locale: loc,
        order: ing.order,
        description: ing.description,
      })),
    )

    const steps = (["es", "en", "gl"] as const).flatMap((loc) =>
      values.locales[loc].instructions.map((step) => ({
        locale: loc,
        order: step.order,
        description: step.description,
      })),
    )

    const images = values.images
      .filter((url) => !url.startsWith("data:") && !url.startsWith("blob:"))
      .map((url, index) => {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
        const publicId = match ? match[1].replace(/\.[^.]+$/, "") : url
        return { public_id: publicId, order: index + 1 }
      })

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
        const result = await $fetch<{ id: string }>("/api/recipes", {
          method: "POST",
          body,
        })

        toast.add({
          severity: "success",
          summary: t("recipe.edit.success.created"),
          life: 3000,
        })

        await loadAllRecipes()
        selectedRecipeId.value = result.id
        await navigateTo(localePath(`/edit/${result.id}`))
        await loadRecipeDetail(result.id)
      } else {
        await $fetch(`/api/recipes/${selectedRecipeId.value}`, {
          method: "PUT",
          body,
        })

        toast.add({
          severity: "success",
          summary: t("recipe.edit.success.updated"),
          life: 3000,
        })

        await loadAllRecipes()
        await loadRecipeDetail(selectedRecipeId.value)
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

  const handleRecipeChange = async (event: SelectChangeEvent) => {
    const newId = event.value as string
    selectedRecipeId.value = newId

    if (newId === NEW_RECIPE_ID) {
      navigateTo(localePath("/edit"))
    } else {
      navigateTo(localePath(`/edit/${newId}`))
    }

    await loadRecipeDetail(newId)
  }

  const onCancel = () => {
    slugErrors.value = { es: null, en: null, gl: null }
    if (currentRecipe.value) {
      loadRecipeDetail(currentRecipe.value.id)
    } else {
      initialValues.value = createInitialValues()
      resetForm()
    }
  }

  const onBack = () => {
    if (!currentRecipe.value) return
    const categoryUrlName = categories.value
      .find((c) => c.id === currentRecipe.value!.category_id)
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

  const triggerLocalesChange = (
    localeKey: LocaleKey,
    type: "ingredients" | "instructions",
  ) => {
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

  onMounted(async () => {
    await loadAllRecipes()
    if (recipeParam) {
      selectedRecipeId.value = recipeParam
      await loadRecipeDetail(recipeParam)
    }
  })
</script>
<template>
  <Form
    v-slot="$form"
    ref="form"
    :resolver
    :initialValues
    class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col flex-1 overflow-hidden"
    @submit="onSubmit"
  >
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

    <div
      v-if="loading"
      class="flex justify-center items-center py-16"
    >
      <ProgressSpinner
        style="width: 50px; height: 50px"
        stroke-width="4"
      />
    </div>

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
              v-model:listSrcs="$form.images.value"
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
                  class="bg-transparent border-0 inline-flex flex-col gap-2 cursor-pointer"
                  v-bind="a11yAttrs.header"
                  type="button"
                  @click="activateCallback"
                >
                  <span
                    :class="[
                      'rounded-full border-2 w-12 h-12 inline-flex items-center justify-center transition-colors',
                      { 'border-fuchsia-600 border-primary bg-fuchsia-50 dark:bg-fuchsia-950': Number(value) === activeStep, 'border-french-lilac-200 dark:border-gray-600': Number(value) !== activeStep },
                      { 'ring-2 ring-red-500': slugErrors[step.locale] }
                    ]"
                  >
                    <img
                      :src="step.img"
                      :alt="step.locale"
                      class="h-4 rounded"
                    >
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
                @change="triggerLocalesChange"
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
        @click="onBack"
      >
        <i class="pi pi-arrow-left mr-2" />
        {{ t('recipe.edit.back') }}
      </Button>
      <Button
        type="button"
        severity="danger"
        outlined
        :disabled="!formStates.isDirty"
        @click="onCancel"
      >
        <i class="pi pi-times mr-2" />
        {{ t('recipe.edit.cancelChanges') }}
      </Button>
      <Button
        type="submit"
        :disabled="!formStates.isDirty || saving"
        :loading="saving"
      >
        <i
          v-if="!saving"
          class="pi pi-save mr-2"
        />
        {{ t('recipe.edit.save') }}
      </Button>
    </div>
  </Form>
</template>
