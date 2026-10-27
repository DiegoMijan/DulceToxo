<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"

  const RECIPE_LIST_VISIBLE_ITEMS = 10

  const { categoryId } = defineProps<{
    categoryId: string
  }>()

  const recipe = defineModel<string>()
  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const recipesStore = useRecipes()
  const { sortRecipeList } = useRecipeSort()
  const loading = computed(() => recipesStore.loadingList)
  const scroller = useTemplateRef<HTMLElement>("scroller")
  const measured = ref(false)
  let pendingAlignSelected = true

  const categoryUrlName = computed(() => String(route.params.category ?? ""))
  const activeSlug = computed(() => {
    const param = route.params.recipe
    if (typeof param === "string" && param.length > 0) return param
    return recipe.value
  })

  const options = computed(() => {
    const recipes = sortRecipeList(recipesStore.recipesByCategory.get(categoryId) ?? [])
    const localeKey = locale.value as LocaleKey

    return recipes.map((item) => ({
      id: item.id,
      slug: item.locale[localeKey]?.slug || item.id,
      title: item.locale[localeKey]?.title || "",
      ratingAvg: item.rating_avg,
      ratingCount: item.rating_count,
      to: localePath(`/${categoryUrlName.value}/${item.locale[localeKey]?.slug || item.id}`),
    }))
  })

  const measureListViewport = () => {
    const list = scroller.value
    if (!list || measured.value) return

    const itemEls = [...list.querySelectorAll<HTMLElement>(".recipe-list-item-link")]
    if (itemEls.length === 0) return

    const itemHeight = itemEls[0].getBoundingClientRect().height
    if (itemHeight <= 0) return

    const listStyles = getComputedStyle(list)
    const gap = Number.parseFloat(listStyles.rowGap || listStyles.gap || "0") || 0
    const paddingTop = Number.parseFloat(listStyles.paddingTop) || 0
    const paddingBottom = Number.parseFloat(listStyles.paddingBottom) || 0
    const visibleCount = Math.min(RECIPE_LIST_VISIBLE_ITEMS, itemEls.length)
    const maxHeight = paddingTop + paddingBottom + itemHeight * visibleCount + gap * Math.max(0, visibleCount - 1)

    if (maxHeight <= 0) return

    list.style.maxHeight = `${maxHeight}px`
    measured.value = true
  }

  const alignActiveIntoView = () => {
    const container = scroller.value
    const selected = container?.querySelector<HTMLElement>("[aria-current='page']")
    if (!container || !selected) return

    const containerRect = container.getBoundingClientRect()
    const selectedRect = selected.getBoundingClientRect()
    if (selectedRect.bottom > containerRect.bottom) {
      container.scrollTop += selectedRect.bottom - containerRect.bottom
    } else if (selectedRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - selectedRect.top
    }
  }

  const waitForFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

  const syncListViewport = async () => {
    if (loading.value || options.value.length === 0) return
    await nextTick()
    measureListViewport()
    if (!measured.value) {
      await waitForFrame()
      await waitForFrame()
      measureListViewport()
    }
    if (!pendingAlignSelected || !measured.value) return
    alignActiveIntoView()
    pendingAlignSelected = false
  }

  watch(
    () => categoryId,
    (nextId, previousId) => {
      if (previousId && nextId !== previousId) {
        pendingAlignSelected = true
        measured.value = false
      }
    },
  )

  watch(scroller, (element) => {
    if (element) void syncListViewport()
  })

  watch(
    [options, loading],
    () => {
      void syncListViewport()
    },
    { flush: "post", immediate: true },
  )
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
  <nav
    v-else
    class="recipe-list w-full min-h-0"
    :aria-label="t('recipe.list.nav')"
  >
    <ul
      ref="scroller"
      class="recipe-list-scroll"
      :class="{ 'recipe-list-scroll--measured': measured }"
      data-testid="recipe-list-scroll"
    >
      <li
        v-for="item in options"
        :key="item.id"
        class="min-w-0"
      >
        <NuxtLink
          :to="item.to"
          class="recipe-list-item-link"
          :aria-current="item.slug === activeSlug ? 'page' : undefined"
          :data-recipe-slug="item.slug"
        >
          <span class="recipe-list-item">
            <span class="recipe-list-title">{{ item.title }}</span>
            <RecipeRatingSummary
              class="recipe-list-rating"
              aria-hidden="true"
              :rating-avg="item.ratingAvg"
              :rating-count="item.ratingCount"
              compact
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
<style scoped>
  .recipe-list {
    --font-recipe-title: "Quicksand", ui-sans-serif, sans-serif;
    --recipe-list-title-gap: 0.375rem;
  }

  .recipe-list-scroll {
    display: flex;
    max-height: none;
    flex-direction: column;
    gap: var(--p-listbox-list-gap, 2px);
    margin: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--p-listbox-list-padding, 0.25rem);
    list-style: none;
    scrollbar-width: thin;
    scrollbar-color: var(--color-french-lilac-400) var(--color-french-lilac-100);
  }

  .recipe-list-item-link {
    display: block;
    min-width: 0;
    padding: var(--p-listbox-option-padding, 0.5rem 0.75rem);
    border-radius: var(--p-listbox-option-border-radius, 6px);
    color: inherit;
    text-decoration: none;
  }

  .recipe-list-item-link:hover {
    background: var(--p-listbox-option-focus-background, var(--color-french-lilac-50));
  }

  .recipe-list-item-link[aria-current="page"] {
    background: var(--p-listbox-option-selected-background, var(--color-french-lilac-100));
    color: var(--p-listbox-option-selected-color, inherit);
  }

  .recipe-list-item-link:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-french-lilac-500);
  }

  .dark .recipe-list-item-link:hover:not([aria-current="page"]) {
    background: var(--p-listbox-option-focus-background, rgb(90 50 93 / 0.35));
  }

  .dark .recipe-list-item-link[aria-current="page"] {
    background: var(--p-listbox-option-selected-background, rgb(90 50 93 / 0.55));
  }

  .recipe-list-item {
    display: flex;
    min-width: 0;
    width: 100%;
    flex-direction: column;
    gap: var(--recipe-list-title-gap);
    pointer-events: none;
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

  .dark .recipe-list-scroll {
    scrollbar-color: var(--color-french-lilac-500) var(--color-french-lilac-950);
  }

  .recipe-list-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .recipe-list-scroll::-webkit-scrollbar-track {
    background: var(--color-french-lilac-100);
    border-radius: 999px;
  }

  .dark .recipe-list-scroll::-webkit-scrollbar-track {
    background: var(--color-french-lilac-950);
  }

  .recipe-list-scroll::-webkit-scrollbar-thumb {
    background: var(--color-french-lilac-400);
    border-radius: 999px;
  }

  .dark .recipe-list-scroll::-webkit-scrollbar-thumb {
    background: var(--color-french-lilac-500);
  }
</style>
