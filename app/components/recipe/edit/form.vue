<script setup lang="ts">
  import type { FormSubmitEvent } from "@primevue/forms/form"
  import { valibotResolver } from "@primevue/forms/resolvers/valibot"
  import type { SelectChangeEvent } from "primevue/select"
  import { FormField } from "#components"

  const route = useRoute()
  const { recipe } = route.params as {
    recipe?: string
  }

  const localePath = useLocalePath()

  const { t } = useI18n()
  const { reactiveForm: initialValues } = useForm<Recipe>({
    id: recipe || "",
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
    difficulty: 2,
    prepTime: 0,
    cookTime: 0,
    createdAt: new Date(),
    updatedAt: null,
    category: "",
  })

  const resolver = ref(valibotResolver(recipeFormSchema(t)))

  const options = ref<{ id: string; title: string }[]>([
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

  const categoryOptions = ref<{ id: string; title: string }[]>([
    { id: "cupcakes", title: "Cupcakes" },
    { id: "cheesecakes", title: "Cheesecakes" },
    { id: "cookies", title: "Cookies" },
  ])

  const onSubmit = (valuesForm: FormSubmitEvent<Recipe>) => {
    const { valid } = valuesForm
    if (!valid) return
  }

  const handleChange = (event: SelectChangeEvent) => {
    navigateTo(localePath(`/edit/${event.value}`))
  }

  const handleTitleBlur = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement
    const trimmed = input.value.trim()
    if (input.value !== trimmed) {
      input.value = trimmed
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }
</script>
<template>
  <Form
    v-slot="$form"
    :resolver
    :initialValues
    class="mt-8 space-y-6 bg-fuchsia-100 p-8 rounded-xl shadow-lg flex flex-col flex-1"
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
            :placeholder="$t('recipe.edit.recipeSelected')"
            @change="handleChange"
          />
        </template>
      </FormField>
      <FormField
        fieldName="category"
        :form="$form"
      >
        <template #field>
          <Select
            filter
            name="category"
            :options="categoryOptions"
            option-value="id"
            option-label="title"
            :placeholder="$t('recipe.edit.categorySelected')"
          />
        </template>
      </FormField>
      <Rating
        v-model="$form.difficulty.value"
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
    <FormUpload />
    <div class="flex gap-4 flex-wrap w-full align-center">
      <FormField
        fieldName="title"
        :form="$form"
        class="flex-2"
        fakeLabel
      >
        <template #field>
          <InputText
            name="title"
            :placeholder="$t('recipe.edit.form.title')"
            :maxlength="100"
            @blur="handleTitleBlur"
          />
        </template>
      </FormField>
      <FormField
        fieldName="cookTime"
        :label="$t('recipe.edit.form.cookTime')"
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
        :label="$t('recipe.edit.form.prepTime')"
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
  </form>
</template>