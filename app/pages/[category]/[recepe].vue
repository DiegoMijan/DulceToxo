<script setup lang="ts">
const { category, recepe } = useRoute().params as {
  category: string
  recepe: string
}
</script>

<template>
  <div>
    <h1>{{ category }} - {{ recepe }}</h1>
  </div>
</template>