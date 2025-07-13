<script setup lang="ts">
const route = useRoute()
const category = route.params.category as string
</script>

<template>
  <NuxtLayout name="sidebar">
  </NuxtLayout>
</template>