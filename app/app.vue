<script setup lang="ts">
  const { getCategories } = useCategories()

  onMounted(async () => {
    await getCategories(true)
  })
</script>

<template>
  <div id="app">
    <HeaderContainer />
    <NuxtPage />
  </div>
</template>
