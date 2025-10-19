<script setup lang="ts">
const { category } = defineProps<{
  category: string
}>()

const localePath = useLocalePath()

const selectedCategory = ref<string>(category)
const categoryOptions = ref<SelectOption[]>([
  { name: "Cupcakes", code: "cupcakes" },
  { name: "Tortas", code: "cheesecakes" },
  { name: "Cookies", code: "cookies" },
])

const pt = {
  overlay: {
    class: "dark:bg-french-lilac-950!",
  },
}

const handleChange = () => {
  navigateTo(localePath(`/${selectedCategory.value}`))
}
</script>
<template>
  <div class="w-full">
    <Select
      v-model="selectedCategory"
      :options="categoryOptions"
      option-label="name"
      option-value="code"
      :placeholder="$t('recipe.sortBy')"
      class="w-full"
      :category
      size="small"
      :pt
      @change="handleChange"
    >
      <template #dropdownicon>
        <NuxtIcon name="line-md:cookie" />
      </template>
    </Select>
  </div>
</template>
