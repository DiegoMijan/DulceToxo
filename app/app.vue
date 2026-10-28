<script setup lang="ts">
  const { getCategories } = useCategories()
  const colorMode = useColorMode()

  // Color de la barra del sistema (movil y app instalada) igual que la cabecera.
  // La etiqueta viene en el HTML desde nuxt.config (app.head); aqui solo se actualiza.
  watchEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>("meta[name=\"theme-color\"]")
    if (meta) meta.content = colorMode.value === "dark" ? "#3a183a" : "#854388"
  })

  onMounted(async () => {
    await getCategories(true)
  })
</script>

<template>
  <div id="app">
    <Toast position="top-right" />
    <HeaderContainer />
    <PwaOfflineNotice />
    <NuxtPage />
    <PwaUpdateNotice />
  </div>
</template>
