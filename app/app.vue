<script setup lang="ts">
  const { getCategories } = useCategories()

  onMounted(async () => {
    await getCategories()
  })
</script>

<template>
  <div id="app">
    <HeaderContainer />
    <NuxtPage />
  </div>
</template>
