<script setup lang="ts">
  import { FormField as PrimeVueFormField } from "@primevue/forms"
  import type { DataTableCellEditCompleteEvent, DataTableRowReorderEvent } from "primevue/datatable"
  import { FormField } from "#components"

  type FormInstance = {
    [key: string]: {
      invalid: boolean
      error: {
        message: string
      }
      value: string[]
    }
  }

  const {
    locale,
    formInstance,
    slugError,
    disabled = false,
  } = defineProps<{
    locale: "es" | "en" | "gl"
    formInstance: FormInstance
    slugError?: string | null
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    change: [locale: "es" | "en" | "gl", type: "ingredients" | "instructions"]
  }>()

  const form = defineModel<{
    [key: string]: RecipeLocaleForm
  }>("form", { required: true })

  const { t } = useI18n()
  const confirm = useConfirm()

  const handleBlur = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement
    const trimmed = input.value.trim()
    if (input.value !== trimmed) {
      input.value = trimmed
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  const onRowReorder = (event: DataTableRowReorderEvent, type: "ingredients" | "instructions") => {
    if (disabled) return
    if (!form.value[locale]?.[type]?.value) return
    form.value[locale][type].value = event.value?.map((item: Ingredient | Step, index: number) => ({
      ...item,
      order: index + 1,
    }))
  }

  const onCellEditComplete = (
    event: DataTableCellEditCompleteEvent,
    type: "ingredients" | "instructions",
  ) => {
    if (disabled) return

    const { data, newValue, field } = event
    if (field !== "description" || typeof newValue !== "string") return
    data[field] = newValue.trim()
    emit("change", locale, type)
  }

  const handleHeadingChange = (data: Ingredient, value: boolean) => {
    if (disabled || locale !== "gl") return

    data.is_heading = value

    ;(["es", "en"] as const).forEach((otherLocale) => {
      const match = form.value[otherLocale]?.ingredients?.value?.find(
        (item: Ingredient) => item.order === data.order,
      )
      if (match) {
        match.is_heading = value
      }
    })

    emit("change", locale, "ingredients")
  }

  const addItem = (type: "ingredients" | "instructions") => {
    if (disabled) return
    if (form.value[locale]?.[type]?.value) {
      const newId = crypto.randomUUID()

      const newItem = {
        id: newId,
        description: "",
        order: form.value[locale]?.[type]?.value.length + 1,
        ...(type === "ingredients" ? { is_heading: false } : {}),
      } as Ingredient | Step

      form.value[locale]?.[type]?.value.push({ ...newItem })

      newItem.description = "Falta traducir"

      ;["es", "en"].forEach((local) => {
        form.value[local]?.[type]?.value.push({ ...newItem })
      })
      emit("change", locale, type)
    }
  }

  const deleteItem = (type: "ingredients" | "instructions", data: Ingredient | Step) => {
    if (disabled) return
    if (form.value[locale]?.[type]?.value) {
      form.value[locale][type].value = form.value[locale][type].value
        .filter((item: Ingredient | Step) => item.id !== data.id)
        .map((item: Ingredient | Step, index: number) => ({
          ...item,
          order: index + 1,
        }))

      ;["es", "en"].forEach((local) => {
        if (form.value[local]?.[type]?.value) {
          form.value[local][type].value = form.value[local][type].value
            .filter((item: Ingredient | Step) => item.id !== data.id)
            .map((item: Ingredient | Step, index: number) => ({
              ...item,
              order: index + 1,
            }))
        }
      })
      emit("change", locale, type)
    }
  }

  const confirmDelete = (
    event: Event,
    type: "ingredients" | "instructions",
    data: Ingredient | Step,
  ) => {
    if (disabled) return

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: t("recipe.edit.form.confirmDelete"),
      icon: "pi pi-info-circle",
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("common.delete"),
        severity: "danger",
      },
      accept: () => {
        deleteItem(type, data)
      },
    })
  }
</script>
<template>
  <div
    class="flex flex-col gap-6 mt-2"
  >
    <div class="flex flex-wrap gap-4">
      <FormField
        :fieldName="`locales.${locale}.title`"
        :label="t('recipe.edit.form.title')"
        :form="formInstance"
        class="grow basis-64"
      >
        <template #field>
          <InputText
            :name="`locales.${locale}.title`"
            :placeholder="t('recipe.edit.form.title')"
            :maxlength="200"
            :value="form?.[locale]?.title?.value"
            class="w-full"
            :disabled="disabled"
            @blur="handleBlur"
          />
        </template>
      </FormField>
      <FormField
        :fieldName="`locales.${locale}.slug`"
        :label="t('recipe.edit.form.slug')"
        :form="formInstance"
        class="grow basis-64"
      >
        <template #field>
          <InputText
            :id="`locales.${locale}.slug`"
            :name="`locales.${locale}.slug`"
            :placeholder="t('recipe.edit.form.slug')"
            :maxlength="200"
            :value="form?.[locale]?.slug?.value"
            class="w-full"
            :class="{ 'p-invalid': slugError }"
            :disabled="disabled"
            @blur="handleBlur"
          />
        </template>
        <template
          v-if="slugError"
          #error
        >
          <Message
            severity="error"
            size="small"
            variant="simple"
          >
            {{ slugError }}
          </Message>
        </template>
      </FormField>
    </div>
    <FormField
      :fieldName="`locales.${locale}.description`"
      :label="t('recipe.edit.form.description')"
      :form="formInstance"
      class="w-full"
    >
      <template #field>
        <Textarea
          :name="`locales.${locale}.description`"
          :placeholder="t('recipe.edit.form.description')"
          :value="form?.[locale]?.description?.value"
          class="w-full"
          rows="3"
          :disabled="disabled"
          @blur="handleBlur"
        />
      </template>
    </FormField>
    <div class="w-full">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-lg font-semibold text-french-lilac-700 dark:text-french-lilac-300">{{ t('recipe.edit.form.ingredients') }}</h1>
        <Button
          v-if="locale === 'gl'"
          size="small"
          rounded
          :disabled="disabled"
          @click="addItem('ingredients')"
        >
          <i class="pi pi-plus" />
        </Button>
      </div>
      <PrimeVueFormField
        :name="`locales.${locale}.ingredients`"
      />
      <DataTable
        :value="form?.[locale]?.ingredients?.value"
        tableStyle="min-width: 50rem"
        :editMode="disabled ? undefined : 'cell'"
        class="rounded-lg"
        :name="`locales.${locale}.ingredients`"
        :pt="{
          tableContainer: {
            class: 'rounded-lg'
          },
          table: {
            class: 'rounded-lg'
          },
          column: {
            bodycell: ({ state }: { state: Record<string, boolean> }) => ({
              class: [state['d_editing'] ? '!py-0' : 'py-[9px]!']
            })
          }
        }"
        @cell-edit-complete="(event: DataTableCellEditCompleteEvent) =>onCellEditComplete(event, 'ingredients')"
        @row-reorder="(event: DataTableRowReorderEvent) =>onRowReorder(event, 'ingredients')"
      >
        <Column
          v-if="locale === 'gl'"
          rowReorder
          headerStyle="width: 3rem"
          :reorderableColumn="false"
        />
        <Column
          field="order"
          :header="t('recipe.edit.form.order')"
          class="w-1/12"
        />
        <Column
          :header="t('recipe.edit.form.heading')"
          headerStyle="width: 6rem; text-align: center"
          bodyStyle="text-align: center"
        >
          <template #body="{ data }">
            <Checkbox
              :modelValue="Boolean((data as Ingredient).is_heading)"
              binary
              :disabled="disabled || locale !== 'gl'"
              :aria-label="t('recipe.edit.form.heading')"
              @click.stop
              @update:model-value="(value: boolean) => handleHeadingChange(data as Ingredient, value)"
            />
          </template>
        </Column>
        <Column
          field="description"
          :header="t('recipe.edit.form.description')"
        >
          <template #body="{ data, field }">
            {{ data[field as keyof typeof data] }}
          </template>
          <template #editor="{ data, field }">
            <InputText
              v-model="data[field]"
              autofocus
              fluid
            />
          </template>
        </Column>
        <Column
          v-if="locale === 'gl'"
          headerStyle="width: 5rem; text-align: center"
          bodyStyle="text-align: center; overflow: visible"
        >
          <template #body="{ data }">
            <Button
              type="button"
              rounded
              severity="secondary"
              size="small"
              :disabled="disabled"
              @click="confirmDelete($event, 'ingredients', data as Ingredient)"
            >
              <i class="pi pi-trash" />
            </Button>
          </template>
        </Column>
        <template #empty>
          <div class="flex justify-center items-center h-full py-6 text-gray-400 dark:text-gray-500">
            {{ t('common.empty') }}
          </div>
        </template>
      </DataTable>
    </div>
    <div class="w-full">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-lg font-semibold text-french-lilac-700 dark:text-french-lilac-300">{{ t('recipe.edit.form.instructions') }}</h1>
        <Button
          v-if="locale === 'gl'"
          size="small"
          rounded
          :disabled="disabled"
          @click="addItem('instructions')"
        >
          <i class="pi pi-plus" />
        </Button>
      </div>
      <PrimeVueFormField
        :name="`locales.${locale}.instructions`"
      />
      <DataTable
        :value="form?.[locale]?.instructions?.value"
        tableStyle="min-width: 50rem"
        :editMode="disabled ? undefined : 'cell'"
        class="rounded-lg"
        dataKey="id"
        :pt="{
          tableContainer: {
            class: 'rounded-lg'
          },
          table: {
            class: 'rounded-lg'
          },
          column: {
            bodycell: ({ state }: { state: Record<string, boolean> }) => ({
              class: [{ '!py-0': state['d_editing'] }]
            })
          }
        }"
        @cell-edit-complete="(event: DataTableCellEditCompleteEvent) => onCellEditComplete(event, 'instructions')"
        @row-reorder="(event: DataTableRowReorderEvent) =>onRowReorder(event, 'instructions')"
      >
        <Column
          v-if="locale === 'gl'"
          rowReorder
          headerStyle="width: 3rem"
          :reorderableColumn="false"
        />
        <Column
          field="order"
          :header="t('recipe.edit.form.order')"
          class="w-1/12"
        />
        <Column
          field="description"
          :header="t('recipe.edit.form.description')"
        >
          <template #body="{ data, field }">
            {{ data[field as keyof typeof data] }}
          </template>
          <template #editor="{ data, field }">
            <InputText
              v-model="data[field]"
              autofocus
              fluid
            />
          </template>
        </Column>
        <Column
          v-if="locale === 'gl'"
          headerStyle="width: 5rem; text-align: center"
          bodyStyle="text-align: center; overflow: visible"
        >
          <template #body="{ data }">
            <Button
              type="button"
              rounded
              severity="secondary"
              size="small"
              :disabled="disabled"
              @click="confirmDelete($event, 'instructions', data as Step)"
            >
              <i class="pi pi-trash" />
            </Button>
          </template>
        </Column>
        <template #empty>
          <div class="flex justify-center items-center h-full py-6 text-gray-400 dark:text-gray-500">
            {{ t('common.empty') }}
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>