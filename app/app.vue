<script setup lang="ts">
  import { useQuery } from "@pinia/colada"
  import { categoriesQuery } from "~/queries/options"

  const { refresh } = useQuery(categoriesQuery)

  onMounted(() => {
    void refresh()
  })
</script>

<template>
  <div id="app">
    <Toast position="top-right" />
    <HeaderContainer />
    <NuxtPage />
  </div>
</template>
