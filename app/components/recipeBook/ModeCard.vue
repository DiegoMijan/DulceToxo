<script setup lang="ts">
  const { selected, title } = defineProps<{
    selected: boolean
    title: string
  }>()

  const emit = defineEmits<{
    select: []
  }>()

  const handleClick = () => {
    emit("select")
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    emit("select")
  }
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    class="flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500"
    :class="
      selected
        ? 'border-yellow-300 bg-french-lilac-100 text-french-lilac-900 shadow-sm dark:border-yellow-300 dark:bg-french-lilac-800 dark:text-french-lilac-50'
        : 'border-french-lilac-200 bg-white text-stone-700 hover:border-french-lilac-400 dark:border-french-lilac-800 dark:bg-french-lilac-950 dark:text-stone-200 dark:hover:border-french-lilac-500'
    "
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <span
      class="text-sm font-semibold"
      :class="selected ? 'text-french-lilac-800 dark:text-french-lilac-100' : ''"
    >
      {{ title }}
    </span>
  </button>
</template>
