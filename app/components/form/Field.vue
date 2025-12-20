<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
  const { fieldName, form, label, fakeLabel } = defineProps<{
    fieldName: string
    form: {
      [key: string]: {
        invalid: boolean
        error: {
          message: string
        }
      }
    }
    label?: string
    fakeLabel?: boolean
  }>()

  const field = computed(() => {
    try {
      if (!fieldName.includes(".")) return form[fieldName]

      const attributes = fieldName.split(".")
      const firstAttribute = attributes[0]
      if (form[firstAttribute as keyof typeof form] === undefined) {
        return undefined
      }

      return attributes.reduce(
        (acc, attr) => acc[attr as keyof typeof acc],
        form as unknown as Record<string, any>,
      )
    } catch (error) {
      console.error(error)
      return undefined
    }
  })
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      v-if="label || fakeLabel"
      :for="fieldName"
      class="text-sm font-medium text-french-lilac-600"
    >
      {{ label || '&nbsp;' }}
    </label>
    <slot name="field" />
    <slot name="error">
      <Message
        v-if="field?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ field?.error?.message }}
      </Message>
    </slot>
  </div>
</template>
