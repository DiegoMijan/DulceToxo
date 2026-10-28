<script setup lang="ts">
  const { recipeId, isFavorite, compact = false } = defineProps<{
    recipeId: string
    isFavorite: boolean
    compact?: boolean
  }>()

  const { t } = useI18n()
  const toast = useToast()
  const recipesStore = useRecipes()

  const saving = ref(false)

  const label = computed(() =>
    isFavorite ? t("recipe.favorite.remove") : t("recipe.favorite.add"),
  )

  const handleToggle = async (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    if (saving.value) return

    saving.value = true
    try {
      await recipesStore.toggleFavorite(recipeId)
    } catch (error) {
      if (isUnauthorizedError(error)) return
      toast.add({
        severity: "error",
        summary: t("recipe.favorite.error"),
        life: 5000,
      })
      console.error("Failed to toggle recipe favorite:", error)
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <button
    v-tooltip.top="label"
    type="button"
    class="recipe-favorite-button inline-flex items-center justify-center rounded-full text-stone-500 transition-colors hover:text-french-lilac-600 hover:bg-french-lilac-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-300 dark:hover:text-french-lilac-300 dark:hover:bg-french-lilac-900/50"
    :class="
      compact
        ? 'recipe-favorite-button--compact h-6 w-6 text-sm'
        : 'h-9 w-9 text-lg'
    "
    :aria-label="label"
    :aria-pressed="isFavorite"
    :title="label"
    :disabled="saving"
    data-testid="recipe-favorite-toggle"
    @click="handleToggle"
    @pointerdown.stop
  >
    <i
      :class="isFavorite ? 'pi pi-heart-fill text-french-lilac-600 dark:text-french-lilac-300' : 'pi pi-heart'"
      aria-hidden="true"
    />
  </button>
</template>
