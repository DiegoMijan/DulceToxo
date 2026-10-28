<script setup lang="ts">
  const { recipeId, myRating } = defineProps<{
    recipeId: string
    myRating: number | null
  }>()

  const { t } = useI18n()
  const toast = useToast()
  const { mutateAsync: upsertRating } = useUpsertRating()
  const { mutateAsync: deleteRating } = useDeleteRating()

  const saving = ref(false)
  const ratingKey = ref(0)

  const voteAriaLabel = computed(() => {
    if (myRating == null) return t("recipe.rating.yoursEmptyAria")
    return t("recipe.rating.yoursAria", { value: myRating })
  })

  const handleVoteChange = async (value: number | null) => {
    if (saving.value) return
    if (value === myRating) return

    saving.value = true
    try {
      if (value == null) {
        await deleteRating(recipeId)
        return
      }

      const nextValue = Math.round(value)
      if (nextValue < 1 || nextValue > 5) return
      await upsertRating({ recipeId, value: nextValue })
    } catch (error) {
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
  <div class="flex flex-col items-center gap-1">
    <span class="text-sm font-medium text-stone-700 dark:text-stone-200">
      {{ t("recipe.rating.yours") }}
    </span>
    <div class="flex flex-row items-center gap-2">
      <!--
        La key incluye recipeId: el Rating de PrimeVue guarda un estado de hover
        interno que puede quedarse con el valor del último voto. Como la página no
        se remonta al cambiar de receta, sin esto se vería el voto de la anterior.
      -->
      <RecipeRatingStars
        :key="`${recipeId}-${ratingKey}`"
        :model-value="myRating"
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
