<script setup lang="ts">
import { useStorage } from "@vueuse/core"

interface SortOption {
  name: string
  code: string
  icon?: string
}

const selectedSort = useStorage("sort", null, localStorage, {
  mergeDefaults: true,
  serializer: {
    read: (v: null | string) => (v ? JSON.parse(v) : null),
    write: (v: null | SortOption) => JSON.stringify(v),
  },
})

const sortOptions = ref<SortOption[]>([
  { name: "Nombre", code: "name", icon: "line-md:cake-twotone" },
  { name: "Fecha de publicación", code: "date", icon: "line-md:calendar" },
  { name: "Fecha de actualización", code: "update", icon: "line-md:bell-twotone-loop" },
  { name: "Popularidad", code: "popularity", icon: "line-md:emoji-grin-twotone" },
  { name: "Puntuación", code: "score", icon: "line-md:star-twotone" },
  { name: "Dificultad", code: "difficulty", icon: "icon-park-twotone:chef-hat-one" },
])

const pt = {
  overlay: {
    class: "dark:bg-french-lilac-950!",
  },
}
</script>

<template>
  <div>
    <Select
      v-model="selectedSort"
      :options="sortOptions"
      option-label="name"
      placeholder="Ordenar por"
      class="w-full"
      size="small"
      :pt
      show-clear
    >
      <template #dropdownicon>
        <NuxtIcon name="tabler:arrows-down-up" />
      </template>
      <template #option="slotProps">
        <div class="flex items-center">
          <NuxtIcon
            :name="slotProps.option.icon"
            class="mr-2 text-xl"
          />
          <div>{{ slotProps.option.name }}</div>
        </div>
      </template>
      <template #value="slotProps">
        <div
          v-if="slotProps.value"
          class="flex items-center"
        >
          <NuxtIcon
            :name="slotProps.value.icon"
            class="mr-2 text-xl"
          />
          <div>{{ slotProps.value.name }}</div>
        </div>
        <span v-else>
          {{ slotProps.placeholder }}
        </span>
      </template>
    </Select>
  </div>
</template>

<style scoped lang="scss"> 

</style>