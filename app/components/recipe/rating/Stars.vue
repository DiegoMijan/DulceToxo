<script setup lang="ts">
  const {
    modelValue,
    readonly = false,
    disabled = false,
    allowHalf = false,
    compact = false,
    ariaLabel,
  } = defineProps<{
    modelValue: number | null
    readonly?: boolean
    disabled?: boolean
    allowHalf?: boolean
    compact?: boolean
    ariaLabel: string
  }>()

  const emit = defineEmits<{
    "update:modelValue": [value: number | null]
    change: [value: number | null]
  }>()

  const handleChange = (event: { value: number | null }) => {
    emit("update:modelValue", event.value)
    emit("change", event.value)
  }
</script>

<template>
  <span
    class="recipe-rating-stars inline-flex items-center"
    :class="{ 'recipe-rating-stars--compact': compact }"
  >
    <Rating
      :model-value="modelValue"
      :readonly
      :disabled
      :allow-half="allowHalf"
      :stars="5"
      :aria-label="ariaLabel"
      @change="handleChange"
    />
  </span>
</template>

<style scoped>
  .recipe-rating-stars :deep(.p-rating-option) {
    color: #d6d3d1;
  }

  .dark .recipe-rating-stars :deep(.p-rating-option) {
    color: #78716c;
  }

  .recipe-rating-stars :deep(.p-rating-option[data-highlighted]) {
    color: #d97706;
  }

  .dark .recipe-rating-stars :deep(.p-rating-option[data-highlighted]) {
    color: #fbbf24;
  }

  .recipe-rating-stars :deep(.p-rating[data-readonly] .p-rating-option:hover),
  .recipe-rating-stars :deep(.p-rating[data-disabled] .p-rating-option:hover) {
    color: inherit;
  }

  .recipe-rating-stars :deep(.p-rating[data-disabled]:not([data-readonly]) .p-rating-option) {
    cursor: not-allowed;
  }

  .recipe-rating-stars :deep(.p-rating:not([data-readonly]):not([data-disabled]) .p-rating-option:hover) {
    color: #b45309;
  }

  .dark .recipe-rating-stars :deep(.p-rating:not([data-readonly]):not([data-disabled]) .p-rating-option:hover) {
    color: #fcd34d;
  }

  .recipe-rating-stars--compact :deep(.p-rating) {
    gap: 0.05rem;
  }

  .recipe-rating-stars--compact :deep(.p-rating-option svg) {
    width: 0.8rem;
    height: 0.8rem;
  }
</style>
