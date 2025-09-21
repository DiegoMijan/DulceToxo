<script setup lang="ts">
const recipe = defineModel<string>()

const options = ref([
  { id: "chocolateCupcake", name: "Cupcake de chocolate" },
  { id: "kinderBuenoCupcake", name: "Cupcake de kinder bueno" },
  { id: "tiramisuCupcake", name: "Cupcake de tiramisú" },
  { id: "chipsAhoyCupcake", name: "Cupcake de chips ahoy" },
  { id: "oreoCupcake", name: "Cupcake de oreo" },
  { id: "cheeseCupcake", name: "Chesse Cupcake" },
  { id: "operaCupcake", name: "Cupcake opera" },
  { id: "cheeseCreamCupcake", name: "Cupcake con crema de queso" },
  { id: "chocoLotusCupcake", name: "Cupcake de choco-lotus" },
])
</script>
<template>
  <ListBox
    v-model="recipe"
    :options="options"
    option-label="name"
    option-value="id"
    class="flex-1"
    list-style="max-height: 100% !important;"
  />
</template>