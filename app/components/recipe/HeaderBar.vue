<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"

  const { recipe, isLoggedIn } = defineProps<{
    recipe: RecipeDetail
    isLoggedIn: boolean
  }>()

  const emit = defineEmits<{
    downloadPdf: []
  }>()

  const { t } = useI18n()
  const difficultyDrawerVisible = ref(false)

  const prepLabel = computed(() => t("recipe.prepTime", { time: recipe.prep_time }))
  const cookLabel = computed(() => t("recipe.cookTime", { time: recipe.cook_time }))

  const handleOpenDifficulty = () => {
    difficultyDrawerVisible.value = true
  }

  const handleDownloadPdf = () => {
    emit("downloadPdf")
  }
</script>

<template>
  <div
    class="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    data-testid="recipe-header-bar"
  >
    <div class="flex min-w-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600 sm:gap-x-0 dark:text-stone-300">
      <span
        v-tooltip.top="prepLabel"
        class="inline-flex items-center gap-1.5 whitespace-nowrap py-1 sm:pr-3"
        :aria-label="prepLabel"
      >
        <NuxtIcon
          name="tabler:clock"
          class="text-lg"
          aria-hidden="true"
        />
        <span>{{ t("recipe.timeMinutes", { time: recipe.prep_time }) }}</span>
      </span>
      <span
        class="mx-3 hidden h-4 w-px shrink-0 self-center bg-stone-300 sm:inline-block dark:bg-stone-600"
        aria-hidden="true"
      />
      <span
        v-tooltip.top="cookLabel"
        class="inline-flex items-center gap-1.5 whitespace-nowrap py-1 sm:pr-3"
        :aria-label="cookLabel"
      >
        <NuxtIcon
          name="tabler:flame"
          class="text-lg"
          aria-hidden="true"
        />
        <span>{{ t("recipe.timeMinutes", { time: recipe.cook_time }) }}</span>
      </span>
      <span
        class="mx-3 hidden h-4 w-px shrink-0 self-center bg-stone-300 sm:inline-block dark:bg-stone-600"
        aria-hidden="true"
      />
      <button
        v-tooltip.top="t('recipe.difficultyTooltip')"
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-0 bg-transparent py-1 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 sm:pr-3 [&_.p-rating-option]:cursor-pointer"
        :aria-label="t('recipe.difficultyTooltip')"
        @click="handleOpenDifficulty"
      >
        {{ t("recipe.difficulty") }}
        <Rating
          disabled
          readonly
          :stars="recipe.difficulty"
        >
          <template #onicon>
            <NuxtIcon
              class="text-lg"
              name="icon-park-twotone:chef-hat-one"
              aria-hidden="true"
            />
          </template>
          <template #officon>
            <NuxtIcon
              class="text-lg"
              name="icon-park-twotone:chef-hat-one"
              aria-hidden="true"
            />
          </template>
        </Rating>
      </button>
      <span
        class="mx-3 hidden h-4 w-px shrink-0 self-center bg-stone-300 sm:inline-block dark:bg-stone-600"
        aria-hidden="true"
      />
      <RecipeRatingSummary
        class="whitespace-nowrap py-1"
        text-only
        :rating-avg="recipe.rating_avg"
        :rating-count="recipe.rating_count"
      />
    </div>
    <div class="flex shrink-0 flex-row items-center justify-end gap-1">
      <RecipeFavoriteButton
        v-if="isLoggedIn"
        :recipe-id="recipe.id"
        :is-favorite="recipe.is_favorite"
      />
      <button
        v-tooltip.top="t('recipe.downloadPdf')"
        type="button"
        class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-french-lilac-100 hover:text-french-lilac-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-300 dark:hover:bg-french-lilac-900/50 dark:hover:text-french-lilac-300"
        :aria-label="t('recipe.downloadPdf')"
        data-testid="recipe-download-pdf"
        @click="handleDownloadPdf"
      >
        <i
          class="pi pi-file-pdf text-lg"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
  <RecipeDifficultyDrawer
    v-model:visible="difficultyDrawerVisible"
    :difficulty-selected="recipe.difficulty"
  />
</template>
