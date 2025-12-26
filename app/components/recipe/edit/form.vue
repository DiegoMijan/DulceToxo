<script setup lang="ts">
  import type { FormFieldState, FormSubmitEvent } from "@primevue/forms/form"
  import { valibotResolver } from "@primevue/forms/resolvers/valibot"
  import type { SelectChangeEvent } from "primevue/select"
  import { FormField } from "#components"
  import es from "@/../public/img/es.svg"
  import gl from "@/../public/img/es-ga.svg"
  import en from "@/../public/img/gb.svg"
  import { FormField as PrimeVueFormField } from "@primevue/forms"

  const route = useRoute()
  const { recipe } = route.params as {
    recipe?: string
  }

  const localePath = useLocalePath()
  const { t } = useI18n()
  const { formStates, resetForm, form } = useStateForm("form")
  const resolver = ref(valibotResolver(recipeFormSchema(t)))

  const options = ref<{ id: string; title: string; noSave?: boolean }[]>([
    { id: "chocolateCupcake", title: "Cupcake de chocolate" },
    { id: "kinderBuenoCupcake", title: "Cupcake de kinder bueno" },
    { id: "tiramisuCupcake", title: "Cupcake de tiramisú" },
    { id: "chipsAhoyCupcake", title: "Cupcake de chips ahoy" },
    { id: "oreoCupcake", title: "Cupcake de oreo" },
    { id: "cheeseCupcake", title: "Chesse Cupcake" },
    { id: "operaCupcake", title: "Cupcake opera" },
    { id: "cheeseCreamCupcake", title: "Cupcake con crema de queso" },
    { id: "chocoLotusCupcake", title: "Cupcake de choco-lotus" },
  ])

  const locales = {
    es: {
      id: "",
      title: "",
      description: "",
      ingredients: [],
      instructions: [],
    },
    en: {
      id: "",
      title: "",
      description: "",
      ingredients: [],
      instructions: [],
    },
    gl: {
      id: getInitialRecipe().id || "",
      title: getInitialRecipe().title || "",
      description: "",
      ingredients: [],
      instructions: [],
    },
  }

  const { reactiveForm: initialValues } = useForm<Recipe>({
    id: recipe || "",
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
    images: [],
    difficulty: 2,
    prepTime: 1,
    cookTime: 1,
    createdAt: new Date(),
    updatedAt: null,
    category: "",
    locales: structuredClone(locales),
  })

  const categoryOptions = ref<{ id: string; title: string }[]>([
    { id: "cupcakes", title: "Cupcakes" },
    { id: "cheesecakes", title: "Cheesecakes" },
    { id: "cookies", title: "Cookies" },
  ])

  const steps = ref<{ id: number; locale: "es" | "en" | "gl"; img: string }[]>([
    { id: 1, locale: "gl", img: gl },
    { id: 2, locale: "es", img: es },
    { id: 3, locale: "en", img: en },
  ])

  const activeStep = ref(1)

  watch(formStates, () => {
    if (formStates.value.isDirty) {
      setOptionNoSave(true)
    }
  })

  function setOptionNoSave(noSave: boolean) {
    const option = options.value.find((option) => option.id === recipe)
    if (option) {
      option.noSave = noSave
    }
  }

  const onSubmit = (valuesForm: FormSubmitEvent<Recipe>) => {
    const { valid } = valuesForm
    if (!valid) return
  }

  const handleChange = (event: SelectChangeEvent) => {
    navigateTo(localePath(`/edit/${event.value}`))
  }

  const onCancel = () => {
    if (form.value?.states?.images) {
      form.value.states.images.value = []
      initialValues.value.images = []
    }
    initialValues.value.locales = structuredClone(locales)
    setOptionNoSave(false)
    resetForm()
  }

  const onBack = () => {
    const { category, id } = initialValues.value
    if (!category || !id) return
    navigateTo(localePath(`/${category}/${id}`))
  }

  function getInitialRecipe() {
    const { title, id } = options.value.find((option) => option.id === recipe) || {}
    return { title, id }
  }

  const triggerImagesChange = () => {
    if (form.value?.states?.images) {
      form.value.states.images.dirty = true
      form.value.states.images.pristine = false
    }
  }

  const triggerLocalesChange = (
    locale: "es" | "en" | "gl",
    type: "ingredients" | "instructions",
  ) => {
    const localesStates = form.value?.states?.locales as
      | Record<"es" | "en" | "gl", { ingredients?: FormFieldState; instructions?: FormFieldState }>
      | undefined

    if (!localesStates) return

    const fieldState = localesStates[locale]?.[type]
    if (!fieldState) return

    fieldState.dirty = true
    fieldState.pristine = false
  }
</script>
<template>
  <Form
    v-slot="$form"
    ref="form"
    :resolver
    :initialValues
    class="mt-6 space-y-6 bg-fuchsia-100 p-7 rounded-xl shadow-lg flex flex-col flex-1"
    @submit="onSubmit"
  >
    <div class="flex gap-4 flex-wrap">
      <FormField
        fieldName="id"
        :form="$form"
      >
        <template #field>
          <Select
            filter
            name="id"
            :options
            option-value="id"
            option-label="title"
            :placeholder="t('recipe.edit.recipeSelected')"
            @change="handleChange"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value"
                class="flex items-center gap-2"
              >
                <div>{{ options.find((option) => option.id === slotProps.value)?.title }}</div>
                <NuxtIcon
                  v-if="options.find((option) => option.id === slotProps.value)?.noSave"
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
                  v-if="slotProps.option.noSave"
                  name="line-md:pencil-twotone"
                  class="text-xl text-amber-300"
                />
                <div :class="{ 'ml-7': !slotProps.option.noSave }">{{ slotProps.option.title }}</div>
              </div>
            </template>
          </Select>
        </template>
      </FormField>
     
      <Rating
        :model-value="$form.difficulty?.value"
        name="difficulty"
      >
        <template #onicon>
          <NuxtIcon
            class="text-xl text-french-lilac-700"
            name="icon-park-twotone:chef-hat-one"
          />
        </template>
        <template #officon>
          <NuxtIcon
            class="text-xl text-gray-400"
            name="icon-park-twotone:chef-hat-one"
          />
        </template>
      </Rating>
    </div>
    <PrimeVueFormField
      name="images"
    >
      <template v-if="$form.images?.value">
        <FormUpload 
          v-model:listSrcs="$form.images.value"
          @change="triggerImagesChange"
        />
      </template>
    </PrimeVueFormField>
    <div>
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
                    'rounded-full border-2 w-12 h-12 inline-flex items-center justify-center',
                    { 'border-fuchsia-700  border-primary': Number(value) === activeStep, 'border-fuchsia-300': Number(value) !== activeStep }
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
        <StepPanels class="px-0!">
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
              @change="triggerLocalesChange"
            />
          </StepPanel>
        </StepPanels>
      </Stepper>
    </div>
    <div class="flex gap-4 w-full align-center">
      <FormField
        fieldName="category"
        :label="t('recipe.edit.category')"
        :form="$form"
        class="basis-1/3"
      >
        <template #field>
          <Select
            filter
            name="category"
            :options="categoryOptions"
            optionValue="id"
            optionLabel="title"
            showClear 
            :placeholder="t('recipe.edit.categorySelected')"
          />
        </template>
      </FormField>
      <FormField
        fieldName="cookTime"
        :label="t('recipe.edit.form.cookTime')"
        :form="$form"
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
    <div class="flex justify-end gap-4">
      <Button
        :label="t('recipe.edit.back')"
        icon="pi pi-arrow-left"
        type="button"
        class="mr-auto!"
        @click="onBack"
      />
      <Button
        :label="t('recipe.edit.cancelChanges')"
        icon="pi pi-times"
        type="button"
        :disabled="!formStates.isDirty"
        @click="onCancel"
      />
      <Button
        :label="t('recipe.edit.save')"
        icon="pi pi-save"
        type="submit"
        :disabled="!formStates.isDirty"
      />
    </div>
  </form>
</template>