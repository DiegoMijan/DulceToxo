<script setup lang="ts">
const { fieldName, form } = defineProps<{
  fieldName: string
  form: {
    [key: string]: {
      invalid: boolean
      error: {
        message: string
      }
    }
  }
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
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
