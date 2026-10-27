<script setup lang="ts">
  const { t } = useI18n()
  const {
    sortCode,
    sortDirection,
    sortOptions,
    selectedSortOption,
    setSortCode,
    toggleSortDirection,
  } = useRecipeSort()

  const pt = {
    overlay: {
      class: "dark:bg-french-lilac-950!",
    },
  }

  const directionLabel = computed(() =>
    t("recipe.sort.toggleDirection", {
      direction: t(
        sortDirection.value === "asc" ? "recipe.sort.ascending" : "recipe.sort.descending",
      ),
    }),
  )
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <Select
      :model-value="sortCode"
      :options="sortOptions"
      option-label="name"
      option-value="code"
      :placeholder="t('recipe.sortBy')"
      :aria-label="t('recipe.sortBy')"
      class="w-full"
      size="small"
      :pt
      @update:model-value="setSortCode"
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
          v-if="selectedSortOption && slotProps.value"
          class="flex items-center"
        >
          <NuxtIcon
            :name="selectedSortOption.icon"
            class="mr-2 text-xl"
          />
          <div>{{ selectedSortOption.name }}</div>
        </div>
        <span v-else>
          {{ slotProps.placeholder }}
        </span>
      </template>
    </Select>
    <Button
      type="button"
      severity="secondary"
      text
      rounded
      size="small"
      class="shrink-0"
      :aria-label="directionLabel"
      :title="directionLabel"
      @click="toggleSortDirection"
    >
      <NuxtIcon
        :name="sortDirection === 'asc' ? 'tabler:sort-ascending' : 'tabler:sort-descending'"
        class="text-xl"
      />
    </Button>
  </div>
</template>
