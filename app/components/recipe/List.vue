<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"

  const RECIPE_LIST_VISIBLE_ITEMS = 10

  const { categoryId } = defineProps<{
    categoryId: string
  }>()

  const recipe = defineModel<string>()
  const { t, locale } = useI18n()

  const recipesStore = useRecipes()
  const { sortRecipeList } = useRecipeSort()
  const loading = computed(() => recipesStore.loadingList)
  const listRoot = useTemplateRef<HTMLElement>("listRoot")
  const listScrollHeight = shallowRef("")

  const options = computed(() => {
    const recipes = sortRecipeList(recipesStore.recipesByCategory.get(categoryId) ?? [])
    const localeKey = locale.value as LocaleKey

    return recipes.map((item) => ({
      id: item.id,
      slug: item.locale[localeKey]?.slug || item.id,
      title: item.locale[localeKey]?.title || "",
      ratingAvg: item.rating_avg,
      ratingCount: item.rating_count,
    }))
  })

  const measureListViewport = () => {
    const root = listRoot.value
    if (!root) return

    const optionEls = [...root.querySelectorAll<HTMLElement>(".p-listbox-option")]
    const list = root.querySelector<HTMLElement>(".p-listbox-list")
    if (optionEls.length === 0 || !list) return

    const itemHeight = optionEls[0].getBoundingClientRect().height
    if (itemHeight <= 0) return

    const listStyles = getComputedStyle(list)
    const gap = Number.parseFloat(listStyles.rowGap || listStyles.gap || "0") || 0
    const paddingTop = Number.parseFloat(listStyles.paddingTop) || 0
    const paddingBottom = Number.parseFloat(listStyles.paddingBottom) || 0
    const visibleCount = Math.min(RECIPE_LIST_VISIBLE_ITEMS, optionEls.length)
    let itemsSpan = 0
    for (let index = 0; index < visibleCount; index += 1) {
      const height = optionEls[index].getBoundingClientRect().height
      if (height <= 0) return
      itemsSpan += height
      if (index < visibleCount - 1) itemsSpan += gap
    }
    const maxHeight = paddingTop + itemsSpan + paddingBottom

    if (maxHeight <= 0) return

    root.style.setProperty("--recipe-list-item-height", `${itemHeight}px`)
    root.style.setProperty("--recipe-list-item-gap", `${gap}px`)
    root.style.setProperty("--recipe-list-padding-block", `${paddingTop + paddingBottom}px`)
    root.style.setProperty("--recipe-list-visible-items", String(RECIPE_LIST_VISIBLE_ITEMS))
    root.style.setProperty("--recipe-list-max-height", `${maxHeight}px`)

    const nextHeight = `${maxHeight}px`
    if (listScrollHeight.value !== nextHeight) {
      listScrollHeight.value = nextHeight
    }
  }

  const scrollSelectedIntoView = () => {
    const root = listRoot.value
    if (!root) return

    const container = root.querySelector<HTMLElement>(".p-listbox-list-container")
    const selected = container?.querySelector<HTMLElement>("[data-p-selected='true']")
    if (!container || !selected) return

    // block: "nearest" inside the list container only — do not use
    // Element.scrollIntoView, which would also scroll the page.
    const containerRect = container.getBoundingClientRect()
    const selectedRect = selected.getBoundingClientRect()
    if (selectedRect.bottom > containerRect.bottom) {
      container.scrollTop += selectedRect.bottom - containerRect.bottom
    } else if (selectedRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - selectedRect.top
    }
  }

  let syncQueued = false
  const syncListViewport = async () => {
    if (syncQueued) return
    syncQueued = true
    await nextTick()
    syncQueued = false
    if (loading.value || options.value.length === 0) return
    measureListViewport()
    await nextTick()
    scrollSelectedIntoView()
  }

  watch(
    [options, recipe, loading],
    () => {
      void syncListViewport()
    },
    { flush: "post", immediate: true },
  )

  useResizeObserver(listRoot, () => {
    void syncListViewport()
  })
</script>
<template>
  <div
    v-if="loading"
    class="flex justify-center items-center py-8"
  >
    <ProgressSpinner
      style="width: 40px; height: 40px"
      stroke-width="4"
    />
  </div>
  <div
    v-else-if="options.length === 0"
    class="text-center text-surface-500 py-4"
  >
    {{ t('common.empty') }}
  </div>
  <div
    v-else
    ref="listRoot"
    class="recipe-list w-full min-h-0"
    :class="{ 'recipe-list--measured': listScrollHeight }"
  >
    <ListBox
      v-model="recipe"
      :options="options"
      option-label="title"
      option-value="slug"
      class="w-full"
      :scroll-height="listScrollHeight || 'none'"
      :auto-option-focus="false"
      :focus-on-hover="false"
      :pt="{
        listContainer: { class: 'recipe-list-scroll' },
        option: { class: 'min-w-0' },
      }"
    >
      <template #option="{ option }">
        <div class="recipe-list-item min-w-0 w-full">
          <span class="recipe-list-title">{{ option.title }}</span>
          <RecipeRatingSummary
            class="recipe-list-rating"
            :rating-avg="option.ratingAvg"
            :rating-count="option.ratingCount"
            compact
          />
        </div>
      </template>
    </ListBox>
  </div>
</template>
<style scoped>
  .recipe-list {
    --font-recipe-title-nunito: "Nunito", ui-sans-serif, sans-serif;
    --font-recipe-title-quicksand: "Quicksand", ui-sans-serif, sans-serif;
    --font-recipe-title-lora: "Lora", ui-serif, serif;
    --font-recipe-title-fraunces: "Fraunces", ui-serif, serif;
    --font-recipe-title-cormorant: "Cormorant Garamond", ui-serif, serif;
    /* Switch list titles by changing only the next line. */
    --font-recipe-title: var(--font-recipe-title-nunito);
    --recipe-list-title-gap: 0.375rem;
    --recipe-list-visible-items: 10;
  }

  .recipe-list-item {
    display: flex;
    min-width: 0;
    width: 100%;
    flex-direction: column;
    gap: var(--recipe-list-title-gap);
  }

  .recipe-list-title {
    min-width: 0;
    overflow: hidden;
    font-family: var(--font-recipe-title);
    font-weight: 600;
    line-height: 1.25rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recipe-list-rating {
    min-height: 0.8rem;
  }

  .recipe-list :deep(.recipe-list-scroll) {
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--color-french-lilac-400) var(--color-french-lilac-100);
  }

  .recipe-list--measured {
    max-height: var(--recipe-list-max-height);
    overflow: hidden;
  }

  .recipe-list--measured :deep(.p-listbox),
  .recipe-list--measured :deep(.recipe-list-scroll) {
    max-height: var(--recipe-list-max-height);
  }

  .dark .recipe-list :deep(.recipe-list-scroll) {
    scrollbar-color: var(--color-french-lilac-500) var(--color-french-lilac-950);
  }

  .recipe-list :deep(.recipe-list-scroll)::-webkit-scrollbar {
    width: 6px;
  }

  .recipe-list :deep(.recipe-list-scroll)::-webkit-scrollbar-track {
    background: var(--color-french-lilac-100);
    border-radius: 999px;
  }

  .dark .recipe-list :deep(.recipe-list-scroll)::-webkit-scrollbar-track {
    background: var(--color-french-lilac-950);
  }

  .recipe-list :deep(.recipe-list-scroll)::-webkit-scrollbar-thumb {
    background: var(--color-french-lilac-400);
    border-radius: 999px;
  }

  .dark .recipe-list :deep(.recipe-list-scroll)::-webkit-scrollbar-thumb {
    background: var(--color-french-lilac-500);
  }
</style>
