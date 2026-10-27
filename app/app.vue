<script setup lang="ts">
  const { getCategories } = useCategories()

  onMounted(async () => {
    await getCategories(true)
  })
</script>

<template>
  <div id="app">
    <Toast position="top-right" />
    <HeaderContainer />
    <NuxtPage />
  </div>
</template>
