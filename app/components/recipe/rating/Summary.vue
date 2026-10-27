<script setup lang="ts">
  const {
    ratingAvg,
    ratingCount,
    compact = false,
    promptLogin = false,
  } = defineProps<{
    ratingAvg: number | null
    ratingCount: number
    compact?: boolean
    promptLogin?: boolean
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
  <div
    class="flex flex-col items-center gap-1"
    :class="{ 'items-start! gap-0.5': compact }"
  >
    <div
      class="flex items-center gap-2"
      :class="compact ? 'flex-col items-start gap-0.5' : 'flex-row'"
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
        class="text-stone-600 dark:text-stone-300"
        :class="compact ? 'text-[0.7rem] leading-tight break-words' : 'text-sm'"
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
