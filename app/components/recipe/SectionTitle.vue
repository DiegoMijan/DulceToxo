<script setup lang="ts">
  defineProps<{
    title: string
  }>()
</script>

<template>
  <div>
    <h2
      class="font-pacifico break-words text-left text-[1.85rem] leading-tight text-french-lilac-700 dark:text-french-lilac-300"
    >
      {{ title }}
    </h2>
    <span
      class="mt-2 mb-5 block border-b border-dashed border-french-lilac-300 dark:border-french-lilac-700"
      aria-hidden="true"
    />
  </div>
</template>
