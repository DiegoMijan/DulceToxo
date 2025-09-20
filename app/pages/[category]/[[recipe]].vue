<script setup lang="ts">
const route = useRoute()
const { category, recipe: recipeParam } = route.params as {
  category: string
  recipe?: string
}

const recipe = ref(recipeParam)

watch(recipe, (newRecipe) => {
  navigateTo(`/${category}/${newRecipe}`)
})
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #left-menu>
      <RecipeSortSelect />
      <Divider
        type="dotted"
        class="my-8!"
      />
      <RecipeList
        v-model="recipe"
        class="w-full"
      />
    </template>
    <template #content>
      <div>Main</div>
    </template>
    <template #right-menu>
      <div>Selecciona una receta</div>
    </template>
  </NuxtLayout>
</template>