<script setup lang="ts">
  const { variant = "category" } = defineProps<{
    variant?: "category" | "favorites"
  }>()

  const { t } = useI18n()
  const {
    sortCode,
    sortDirection,
    sortOptions,
    selectedSortOption,
    setSortCode,
    toggleSortDirection,
    favoriteSortCode,
    favoriteSortDirection,
    favoriteSortOptions,
    selectedFavoriteSortOption,
    setFavoriteSortCode,
    toggleFavoriteSortDirection,
  } = useRecipeSort()

  const isFavorites = computed(() => variant === "favorites")
  const activeSortCode = computed(() =>
    isFavorites.value ? favoriteSortCode.value : sortCode.value,
  )
  const activeSortDirection = computed(() =>
    isFavorites.value ? favoriteSortDirection.value : sortDirection.value,
  )
  const activeSortOptions = computed(() =>
    isFavorites.value ? favoriteSortOptions.value : sortOptions.value,
  )
  const activeSelectedOption = computed(() =>
    isFavorites.value ? selectedFavoriteSortOption.value : selectedSortOption.value,
  )

  const handleSortCode = (code: string | null) => {
    if (isFavorites.value) {
      setFavoriteSortCode(code)
      return
    }
    setSortCode(code)
  }

  const handleToggleDirection = () => {
    if (isFavorites.value) {
      toggleFavoriteSortDirection()
      return
    }
    toggleSortDirection()
  }

  const pt = {
    overlay: {
      class: "dark:bg-french-lilac-950!",
    },
  }

  const directionLabel = computed(() =>
    t("recipe.sort.toggleDirection", {
      direction: t(
        activeSortDirection.value === "asc" ? "recipe.sort.ascending" : "recipe.sort.descending",
      ),
    }),
  )
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <Select
      :model-value="activeSortCode"
      :options="activeSortOptions"
      option-label="name"
      option-value="code"
      :placeholder="t('recipe.sortBy')"
      :aria-label="t('recipe.sortBy')"
      class="w-full"
      size="small"
      :pt
      @update:model-value="handleSortCode"
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
          v-if="activeSelectedOption && slotProps.value"
          class="flex items-center"
        >
          <NuxtIcon
            :name="activeSelectedOption.icon"
            class="mr-2 text-xl"
          />
          <div>{{ activeSelectedOption.name }}</div>
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
      @click="handleToggleDirection"
    >
      <NuxtIcon
        :name="activeSortDirection === 'asc' ? 'tabler:sort-ascending' : 'tabler:sort-descending'"
        class="text-xl"
      />
    </Button>
  </div>
</template>
