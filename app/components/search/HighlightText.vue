<script setup lang="ts">
  const { text, query } = defineProps<{
    text: string
    query: string
  }>()

  const segments = computed(() => highlightMatches(text, query))
</script>

<template>
  <span>
    <template
      v-for="(segment, index) in segments"
      :key="`${index}-${segment.match}`"
    >
      <mark
        v-if="segment.match"
        class="rounded-sm bg-french-lilac-200 text-inherit dark:bg-french-lilac-800"
      >
        {{ segment.text }}
      </mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
