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
        v-if="form[fieldName]?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ form[fieldName]?.error?.message }}
      </Message>
    </slot>
  </div>
</template>
