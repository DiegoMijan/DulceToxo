<script setup lang="ts">
const route = useRoute()
const { category, recipe: recipeParam } = route.params as {
  category: string
  recipe?: string
}

const localePath = useLocalePath()

const recipeSelected = ref<string | undefined>(recipeParam)
const recipe = ref<Recipe>({
  id: "",
  title: "Delicioso Cheesecake Brownie",
  description:
    "Un brownie con un sabor irresistible y una textura única. Ideal para cualquier ocasión.",
  ingredients: [
    {
      id: "1",
      description: "100g de chocolate",
      order: 1,
    },
    {
      id: "2",
      description: "200g de queso crema",
      order: 2,
    },
    {
      id: "3",
      description: "100g de chocolate",
      order: 3,
    },
    {
      id: "4",
      description: "100g de chocolate",
      order: 4,
    },
  ],
  instructions: [
    {
      id: "1",
      description: "Precalentar el horno a 180°C",
      order: 1,
    },
    {
      id: "2",
      description: "Mezclar los ingredientes",
      order: 2,
    },
    {
      id: "3",
      description: "Hornear por 30 minutos",
      order: 3,
    },
    {
      id: "4",
      description: "Dejar enfriar",
      order: 4,
    },
  ],
  difficulty: 2,
  prepTime: 30,
  cookTime: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
  category,
})

watch(recipeSelected, (newRecipe) => {
  navigateTo(localePath(`/${category}/${newRecipe}`))
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
      <CategorySelect
        :category
      />
    </template>
  </NuxtLayout>
</template>