<script setup lang="ts">
  defineProps<{
    title: string
    titleClass: string
    accent: "bar" | "dashed" | "flourish"
  }>()
</script>

<template>
  <div>
    <h2 :class="titleClass">
      {{ title }}
    </h2>
    <span
      v-if="accent === 'bar'"
      class="mt-2 mb-5 block h-0.5 w-14 rounded-full bg-french-lilac-500"
      aria-hidden="true"
    />
    <span
      v-else-if="accent === 'dashed'"
      class="mt-2 mb-5 block border-b border-dashed border-french-lilac-300 dark:border-french-lilac-700"
      aria-hidden="true"
    />
    <div
      v-else
      class="mt-3 mb-6 flex items-center gap-3"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-french-lilac-200 dark:bg-french-lilac-800" />
      <span class="size-1.5 rotate-45 bg-french-lilac-500" />
      <span class="h-px flex-1 bg-french-lilac-200 dark:bg-french-lilac-800" />
    </div>
  </div>
</template>
