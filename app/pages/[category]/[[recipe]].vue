<script setup lang="ts">
const route = useRoute()
const { category, recipe: recipeParam } = route.params as {
  category: string
  recipe?: string
}

const recipeSelected = ref<string | undefined>(recipeParam)
const recipe = ref<Recipe>({
  id: "",
  title: "Delicioso Cheesecake Brownie",
  description:
    "Un brownie con un sabor irresistible y una textura única. Ideal para cualquier ocasión.",
  ingredients: [],
  instructions: [],
  difficulty: 2,
  prepTime: 30,
  cookTime: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
  category,
})

watch(recipeSelected, (newRecipe) => {
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
        v-model="recipeSelected"
        class="w-full"
      />
    </template>
    <template #content>
      <RecipeContent
        v-if="recipeSelected"
        :recipe
      />
    </template>
    <template #right-menu>
      <div>Selecciona una receta</div>
    </template>
  </NuxtLayout>
</template>