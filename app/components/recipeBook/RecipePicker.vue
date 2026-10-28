<script setup lang="ts">
  export type RecipeBookItem = {
    id: string
    title: string
  }

  const { items } = defineProps<{
    items: RecipeBookItem[]
  }>()

  const selectedIds = defineModel<string[]>({ default: () => [] })
  const { t } = useI18n()
  const recipesStore = useRecipes()
  const img = useImage()
  const query = ref("")

  const filteredItems = computed(() => {
    const needle = foldSearchText(query.value.trim())
    if (!needle) return items
    return items.filter((item) => foldSearchText(item.title).includes(needle))
  })

  const selectedCount = computed(() => selectedIds.value.length)

  const thumbnailSrc = (id: string): string => {
    const detail = recipesStore.recipesCache.get(id)
    const mainImage = detail ? getMainRecipeImage(detail.images) : undefined
    if (!mainImage) return "/img/ejemplo_receta.jpg"
    if (mainImage.public_id.startsWith("/")) return mainImage.public_id
    return img(
      mainImage.public_id,
      { width: 96, height: 96, fit: "cover", quality: 70, format: "jpg" },
      { provider: "cloudinary" },
    )
  }

  const orderedSelectedIds = (ids: Iterable<string>): string[] => {
    const selected = new Set(ids)
    return items.filter((item) => selected.has(item.id)).map((item) => item.id)
  }

  const isSelected = (id: string): boolean => selectedIds.value.includes(id)

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      selectedIds.value = orderedSelectedIds([...selectedIds.value, id])
      return
    }
    selectedIds.value = selectedIds.value.filter((currentId) => currentId !== id)
  }

  const handleSelectAll = () => {
    const next = new Set(selectedIds.value)
    for (const item of filteredItems.value) next.add(item.id)
    selectedIds.value = orderedSelectedIds(next)
  }

  const handleSelectNone = () => {
    const remove = new Set(filteredItems.value.map((item) => item.id))
    selectedIds.value = selectedIds.value.filter((id) => !remove.has(id))
  }
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <InputText
      v-model="query"
      type="search"
      fluid
      :placeholder="t('recipeBook.search')"
      :aria-label="t('recipeBook.search')"
      data-testid="recipe-book-search"
    />
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="cursor-pointer text-sm font-medium text-french-lilac-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200"
          data-testid="recipe-book-select-all"
          @click="handleSelectAll"
        >
          {{ t("recipeBook.selectAll") }}
        </button>
        <span
          class="text-french-lilac-300"
          aria-hidden="true"
        >
          /
        </span>
        <button
          type="button"
          class="cursor-pointer text-sm font-medium text-french-lilac-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200"
          data-testid="recipe-book-select-none"
          @click="handleSelectNone"
        >
          {{ t("recipeBook.selectNone") }}
        </button>
      </div>
      <p
        class="text-sm text-stone-500 dark:text-stone-300"
        aria-live="polite"
      >
        {{ t("recipeBook.selectedCount", { n: selectedCount }) }}
      </p>
    </div>
    <ul
      class="min-h-0 max-h-56 overflow-y-auto rounded-xl border border-french-lilac-200 dark:border-french-lilac-800"
      :aria-label="t('recipeBook.recipeList')"
      data-testid="recipe-book-recipe-list"
    >
      <li
        v-if="filteredItems.length === 0"
        class="px-3 py-6 text-center text-sm text-stone-500 dark:text-stone-300"
      >
        {{ t("recipeBook.emptySearch") }}
      </li>
      <li
        v-for="item in filteredItems"
        :key="item.id"
        class="border-b border-french-lilac-100 last:border-b-0 dark:border-french-lilac-900"
      >
        <label
          class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-french-lilac-50 dark:hover:bg-french-lilac-900/40"
        >
          <Checkbox
            :model-value="isSelected(item.id)"
            binary
            :input-id="`recipe-book-item-${item.id}`"
            :aria-label="item.title"
            @update:model-value="(value: boolean) => handleToggle(item.id, value)"
          />
          <img
            :src="thumbnailSrc(item.id)"
            :alt="t('recipeBook.thumbnailAlt', { title: item.title })"
            class="h-12 w-12 shrink-0 rounded-lg object-cover"
            width="48"
            height="48"
          >
          <span class="min-w-0 flex-1 truncate text-sm text-stone-800 dark:text-stone-100">
            {{ item.title }}
          </span>
        </label>
      </li>
    </ul>
  </div>
</template>
