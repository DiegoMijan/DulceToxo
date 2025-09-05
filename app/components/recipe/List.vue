<script setup lang="ts">
const options = ref([
  { id: 1, name: "Cupcake de chocolate" },
  { id: 2, name: "Cupcake de kinder bueno" },
  { id: 3, name: "Cupcake de tiramisú" },
  { id: 4, name: "Cupcake de chips ahoy" },
  { id: 5, name: "Cupcake de oreo" },
  { id: 6, name: "Chesse Cupcake" },
  { id: 7, name: "Cupcake opera" },
  { id: 8, name: "Cupcake con crema de queso" },
  { id: 9, name: "Cupcake de choco-lotus" },
])

const selectedOption = ref(null)
</script>
<template>
  <ListBox
    :options="options"
    option-label="name"
    option-value="id"
    v-model="selectedOption"
    class="flex-1"
    listStyle="max-height: 100% !important;"
  />
</template>