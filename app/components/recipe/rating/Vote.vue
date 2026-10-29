<script setup lang="ts">
  const { recipeId, myRating } = defineProps<{
    recipeId: string
    myRating: number | null
  }>()

  const { t, locale } = useI18n()
  const toast = useToast()
  const recipesStore = useRecipes()

  const saving = ref(false)
  const ratingKey = ref(0)

  const voteAriaLabel = computed(() => {
    if (myRating == null) return t("recipe.rating.yoursEmptyAria")
    // 4 -> "4", 3.5 -> "3,5" (o "3.5" en ingles)
    const value = Number.isInteger(myRating)
      ? String(myRating)
      : formatRatingAverage(myRating, locale.value)
    return t("recipe.rating.yoursAria", { value })
  })

  const handleVoteChange = async (value: number | null) => {
    if (saving.value) return
    if (value === myRating) return

    saving.value = true
    try {
      if (value == null) {
        await recipesStore.deleteRating(recipeId)
        return
      }

      // De media en media estrella (0.5 ... 5), como acepta el backend
      const nextValue = Math.round(value * 2) / 2
      if (nextValue < 0.5 || nextValue > 5) return
      await recipesStore.upsertRating(recipeId, nextValue)
    } catch (error) {
      // Sesión caducada: el store ya redirige al login, sin toast de error.
      if (isUnauthorizedError(error)) return
      ratingKey.value += 1
      toast.add({
        severity: "error",
        summary: t("recipe.rating.saveError"),
        life: 5000,
      })
      console.error("Failed to save recipe rating:", error)
    } finally {
      saving.value = false
    }
  }

  const handleRemove = async () => {
    await handleVoteChange(null)
  }
</script>

<template>
  <div
    class="flex flex-col items-center gap-2"
    data-testid="recipe-rating-prompt"
  >
    <h2 class="title text-xl font-semibold text-stone-800 dark:text-stone-100">
      {{ t("recipe.rating.prompt") }}
    </h2>
    <div class="flex flex-row items-center gap-2">
      <!--
        La key incluye recipeId: el Rating de PrimeVue guarda un estado de hover
        interno que puede quedarse con el valor del último voto. Como la página no
        se remonta al cambiar de receta, sin esto se vería el voto de la anterior.
      -->
      <RecipeRatingStars
        :key="`${recipeId}-${ratingKey}`"
        :model-value="myRating"
        allow-half
        :disabled="saving"
        :aria-label="voteAriaLabel"
        @change="handleVoteChange"
      />
      <Button
        v-if="myRating != null"
        type="button"
        severity="secondary"
        text
        rounded
        size="small"
        class="cursor-pointer disabled:cursor-not-allowed!"
        :disabled="saving"
        :aria-label="t('recipe.rating.remove')"
        :title="t('recipe.rating.remove')"
        @click="handleRemove"
      >
        <i class="pi pi-times" />
      </Button>
    </div>
  </div>
</template>
