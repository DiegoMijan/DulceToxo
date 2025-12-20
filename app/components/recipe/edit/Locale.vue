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

  const { locale, formInstance } = defineProps<{
    locale: "es" | "en" | "gl"
    formInstance: FormInstance
  }>()

  const form = defineModel<{
    [key: string]: {
      title: {
        invalid: boolean
        error: {
          message: string
        }
        value: string
      }
      ingredients: {
        invalid: boolean
        error: {
          message: string
        }
        value: Ingredient[]
      }
      instructions: {
        invalid: boolean
        error: {
          message: string
        }
        message: string
        value: Step[]
      }
    }
  }>("form", { required: true })

  const { t } = useI18n()
  const confirm = useConfirm()

  const handleTitleBlur = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement
    const trimmed = input.value.trim()
    if (input.value !== trimmed) {
      input.value = trimmed
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  const onRowReorder = (event: DataTableRowReorderEvent, type: "ingredients" | "instructions") => {
    if (!form.value[locale]?.[type]?.value) return
    form.value[locale][type].value = event.value?.map((item: Ingredient | Step, index: number) => ({
      ...item,
      order: index + 1,
    }))
  }

  const onCellEditComplete = (event: DataTableCellEditCompleteEvent) => {
    const { data, newValue, field } = event
    data[field] = newValue ? newValue.trim() : ""
  }

  const addItem = (type: "ingredients" | "instructions") => {
    if (form.value[locale]?.[type]?.value) {
      const newId = crypto.randomUUID()

      const newItem = {
        id: newId,
        description: "",
        order: form.value[locale]?.[type]?.value.length + 1,
      } as Ingredient | Step

      form.value[locale]?.[type]?.value.push({ ...newItem })

      newItem.description = "Falta traducir"

      ;["es", "en"].forEach((local) => {
        form.value[local]?.[type]?.value.push({ ...newItem })
      })
    }
  }

  const deleteItem = (type: "ingredients" | "instructions", data: Ingredient | Step) => {
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
    }
  }

  const confirmDelete = (
    event: Event,
    type: "ingredients" | "instructions",
    data: Ingredient | Step,
  ) => {
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
    class="flex flex-col gap-4"
  >
    <FormField
      :fieldName="`locales.${locale}.title`"
      :form="formInstance"
      class="w-1/2"
      fakeLabel
    >
      <template #field>
        <InputText
          :name="`locales.${locale}.title`"
          :placeholder="t('recipe.edit.form.title')"
          :maxlength="200"
          :value="form?.[locale]?.title?.value"
          @blur="handleTitleBlur"
        />
      </template>
    </FormField>
    <div class="w-full">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold text-french-lilac-600">{{ t('recipe.edit.form.ingredients') }}</h1>
        <Button
          v-if="locale === 'gl'"
          icon="pi pi-plus"
          size="small"
          @click="addItem('ingredients')"
        />
      </div>
      <PrimeVueFormField
        :name="`locales.${locale}.ingredients`"
      />
      <DataTable
        :value="form?.[locale]?.ingredients?.value"
        tableStyle="min-width: 50rem"
        editMode="cell"
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
        @cell-edit-complete="onCellEditComplete"
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
              icon="pi pi-trash"
              rounded
              severity="secondary"
              size="small"
              @click="confirmDelete($event, 'ingredients', data as Ingredient)"
            />
          </template>
        </Column>
        <template #empty>
          <div class="flex justify-center items-center h-full">
            {{ t('common.empty') }}
          </div>
        </template>
      </DataTable>
    </div>
    <div class="w-full">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold text-french-lilac-600">{{ t('recipe.edit.form.instructions') }}</h1>
        <Button
          v-if="locale === 'gl'"
          icon="pi pi-plus"
          size="small"
          @click="addItem('instructions')"
        />
      </div>
      <PrimeVueFormField
        :name="`locales.${locale}.instructions`"
      />
      <DataTable
        :value="form?.[locale]?.instructions?.value"
        tableStyle="min-width: 50rem"
        editMode="cell"
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
        @cell-edit-complete="onCellEditComplete"
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
              icon="pi pi-trash"
              rounded
              severity="secondary"
              size="small"
              @click="confirmDelete($event, 'instructions', data as Step)"
            />
          </template>
        </Column>
        <template #empty>
          <div class="flex justify-center items-center h-full">
            {{ t('common.empty') }}
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>