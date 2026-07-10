<script setup lang="ts">
  definePageMeta({
    key: "recipe-edit", // Clave fija = componente persiste siempre
  })
</script>
<template>
  <div class="w-full flex-1 flex justify-center px-4 py-10 md:px-8">
    <div class="w-full max-w-5xl">
      <ConfirmPopup />
      <RecipeEditForm />
    </div>
  </div>
</template>