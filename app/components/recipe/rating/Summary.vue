<script setup lang="ts">
  const {
    ratingAvg,
    ratingCount,
    compact = false,
    promptLogin = false,
    textOnly = false,
  } = defineProps<{
    ratingAvg: number | null
    ratingCount: number
    compact?: boolean
    promptLogin?: boolean
    textOnly?: boolean
  }>()

  const { t, locale } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()

  const hasVotes = computed(() => hasRecipeVotes(ratingAvg, ratingCount))
  const starsValue = computed(() => ratingStarsValue(ratingAvg))
  const summaryText = computed(() => {
    if (!hasVotes.value || ratingAvg == null) return t("recipe.rating.none")
    return formatRatingSummary(ratingAvg, ratingCount, locale.value)
  })
  const averageAriaLabel = computed(() => {
    if (!hasVotes.value || ratingAvg == null) return t("recipe.rating.none")
    return t("recipe.rating.averageAria", {
      avg: formatRatingAverage(ratingAvg, locale.value),
      count: ratingCount,
    })
  })
  const loginTo = computed(() => ({
    path: localePath("/auth/login"),
    query: { redirect: route.fullPath },
  }))
</script>

<template>
  <span
    v-if="textOnly"
    class="inline-flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300"
    :aria-label="averageAriaLabel"
  >
    <template v-if="hasVotes">
      <span aria-hidden="true">★</span>
      <span>{{ summaryText }}</span>
    </template>
    <template v-else>
      {{ t("recipe.rating.none") }}
    </template>
  </span>
  <div
    v-else
    class="flex flex-col items-center gap-1"
    :class="{ 'items-start! gap-0': compact }"
  >
    <div
      class="flex items-center"
      :class="compact ? 'flex-row items-center gap-1' : 'flex-row gap-2'"
    >
      <NuxtLink
        v-if="promptLogin"
        v-tooltip.top="t('recipe.rating.loginToRate')"
        :to="loginTo"
        class="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        :aria-label="t('recipe.rating.loginToRate')"
      >
        <RecipeRatingStars
          :model-value="starsValue"
          readonly
          disabled
          allow-half
          :compact
          :aria-label="averageAriaLabel"
        />
      </NuxtLink>
      <RecipeRatingStars
        v-else
        :model-value="starsValue"
        readonly
        disabled
        allow-half
        :compact
        :aria-label="averageAriaLabel"
      />
      <span
        v-if="!compact || hasVotes"
        class="text-stone-600 dark:text-stone-300"
        :class="compact ? 'text-xs leading-none' : 'text-sm'"
      >
        {{ summaryText }}
      </span>
    </div>
    <NuxtLink
      v-if="promptLogin && !compact"
      :to="loginTo"
      class="text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
    >
      {{ t("recipe.rating.loginToRate") }}
    </NuxtLink>
  </div>
</template>
