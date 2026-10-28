<script setup lang="ts">
  import type { PaletteItem } from "~/composables/useRecipeSearch"

  const { item, active, query } = defineProps<{
    item: PaletteItem
    active: boolean
    query: string
  }>()

  const emit = defineEmits<{
    select: [item: PaletteItem]
    hover: [item: PaletteItem]
  }>()

  const colorMode = useColorMode()

  const resolvedIcon = computed(() => {
    if (colorMode.value === "dark" && item.darkIcon) return item.darkIcon
    return item.icon
  })

  const handleSelect = () => {
    emit("select", item)
  }

  const handleMouseEnter = () => {
    emit("hover", item)
  }
</script>

<template>
  <div
    :id="item.optionId"
    role="option"
    class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-french-lilac-950 dark:text-french-lilac-50"
    :class="active ? 'bg-french-lilac-100 dark:bg-french-lilac-800/80' : 'bg-transparent'"
    :aria-selected="active"
    data-testid="command-palette-option"
    :data-kind="item.kind"
    @mousedown.prevent
    @click="handleSelect"
    @mouseenter="handleMouseEnter"
  >
    <span
      v-if="item.kind === 'category' || item.kind === 'recent'"
      class="flex h-8 w-8 shrink-0 items-center justify-center text-xl"
      aria-hidden="true"
    >
      <img
        v-if="item.isImage && resolvedIcon"
        :src="resolvedIcon"
        alt=""
        width="24"
        height="24"
        class="h-6 w-6 object-contain"
      >
      <NuxtIcon
        v-else-if="resolvedIcon"
        :name="resolvedIcon"
        class="text-2xl"
        :class="item.kind === 'recent' ? 'text-french-lilac-600 dark:text-french-lilac-300' : undefined"
      />
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex min-w-0 items-baseline gap-2">
        <span class="truncate font-semibold">{{ item.label }}</span>
        <span
          v-if="item.categoryLabel"
          class="truncate text-sm text-french-lilac-500 dark:text-french-lilac-300"
        >
          › {{ item.categoryLabel }}
        </span>
      </span>
      <span
        v-if="item.kind === 'ingredient' && item.matchedIngredient"
        class="mt-0.5 block truncate text-xs text-french-lilac-600 dark:text-french-lilac-200"
      >
        <SearchHighlightText
          :text="item.matchedIngredient"
          :query="query"
        />
      </span>
    </span>

    <span
      v-if="item.kind !== 'category'"
      class="pointer-events-none flex shrink-0 items-center gap-1"
      aria-hidden="true"
    >
      <RecipeRatingStars
        v-if="item.ratingCount"
        :model-value="ratingStarsValue(item.ratingAvg ?? null)"
        readonly
        disabled
        allow-half
        compact
        :aria-label="item.label"
      />
      <i
        v-if="item.isFavorite"
        class="pi pi-heart-fill text-sm text-french-lilac-600 dark:text-french-lilac-300"
      />
    </span>
  </div>
</template>
