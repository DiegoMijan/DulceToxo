<script setup lang="ts">
  import type { LocaleKey } from "#shared/types/Recipe"
  import type { RecipeListItem } from "~/stores/recipes"

  const RECIPE_LIST_VISIBLE_ITEMS = 10

  const {
    categoryId,
    items,
    loading: loadingProp,
    resolveTo,
    navLabel,
  } = defineProps<{
    categoryId?: string
    items?: RecipeListItem[]
    loading?: boolean
    resolveTo?: (slug: string) => string
    navLabel?: string
  }>()

  const recipe = defineModel<string>()
  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const recipesStore = useRecipes()
  const { sortRecipeList, sortFavoriteList } = useRecipeSort()
  const loading = computed(() => loadingProp ?? recipesStore.loadingList)
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
    const source = items ?? recipesStore.recipesByCategory.get(categoryId ?? "") ?? []
    const recipes = items ? sortFavoriteList(source) : sortRecipeList(source)
    const localeKey = locale.value as LocaleKey

    return recipes.map((item) => {
      const slug = item.locale[localeKey]?.slug || item.id
      return {
        id: item.id,
        slug,
        title: item.locale[localeKey]?.title || "",
        ratingAvg: item.rating_avg,
        ratingCount: item.rating_count,
        isFavorite: item.is_favorite,
        to: resolveTo?.(slug) ?? localePath(`/${categoryUrlName.value}/${slug}`),
      }
    })
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
    class="recipe-list p-listbox p-component p-listbox-fluid flex-1 min-w-0 w-full"
    :aria-label="navLabel || t('recipe.list.nav')"
  >
    <ul
      ref="scroller"
      class="recipe-list-scroll p-listbox-list"
      :class="{ 'recipe-list-scroll--measured': measured }"
      data-testid="recipe-list-scroll"
    >
      <li
        v-for="item in options"
        :key="item.id"
        class="recipe-list-row min-w-0 w-full"
      >
        <NuxtLink
          :to="item.to"
          class="recipe-list-item-link p-listbox-option"
          :class="{ 'p-listbox-option-selected': item.slug === activeSlug }"
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
        <RecipeFavoriteButton
          class="recipe-list-favorite"
          compact
          :recipe-id="item.id"
          :is-favorite="item.isFavorite"
        />
      </li>
    </ul>
  </nav>
</template>
<style scoped>
  .recipe-list {
    --font-recipe-title: "Quicksand", ui-sans-serif, sans-serif;
    --recipe-list-title-gap: 0.375rem;
    overflow: hidden;
  }

  .recipe-list-scroll {
    max-height: none;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-inline: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--color-french-lilac-400) var(--color-french-lilac-100);
  }

  .recipe-list-row {
    position: relative;
    min-width: 0;
    width: 100%;
  }

  .recipe-list-item-link {
    display: block;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border-radius: 0;
    padding-right: 1.75rem;
    text-decoration: none;
  }

  .recipe-list-favorite {
    position: absolute;
    top: 50%;
    right: 0.15rem;
    z-index: 1;
    transform: translateY(-50%);
  }

  .recipe-list-item-link:focus-visible:not(.p-listbox-option-selected) {
    background: var(--p-listbox-option-focus-background);
    color: var(--p-listbox-option-focus-color);
    outline: none;
  }

  .recipe-list-item-link.p-listbox-option-selected:focus-visible {
    background: var(--p-listbox-option-selected-focus-background);
    color: var(--p-listbox-option-selected-focus-color);
    outline: none;
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
