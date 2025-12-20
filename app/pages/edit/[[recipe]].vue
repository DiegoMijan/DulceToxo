<script setup lang="ts">
  definePageMeta({
    key: "recipe-edit", // Clave fija = componente persiste siempre
  })
</script>
<template>
  <NuxtLayout
    name="sidebar"
  >
    <template #content>
      <ConfirmPopup />
      <RecipeEditForm />
    </template>
  </NuxtLayout>
</template>