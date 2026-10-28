<script setup lang="ts">
  const { recipeId, categoryId, recipeTitle } = defineProps<{
    recipeId: string
    categoryId: string
    recipeTitle: string
  }>()

  const emit = defineEmits<{
    deleted: []
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const confirm = useConfirm()
  const toast = useToast()
  const { isAdmin } = useAuth()
  const recipesStore = useRecipes()
  const categoriesStore = useCategories()

  const deleting = ref(false)

  const goToEdit = () => {
    navigateTo(localePath(`/edit/${recipeId}`))
  }

  const handleDelete = async () => {
    if (deleting.value) return

    deleting.value = true
    try {
      await recipesStore.deleteRecipe(recipeId, categoryId)

      toast.add({
        severity: "success",
        summary: t("recipe.delete.success"),
        life: 3000,
      })

      emit("deleted")

      const categoryUrlName = categoriesStore.getCategoryUrlNameById(categoryId)
      await navigateTo(localePath(categoryUrlName ? `/${categoryUrlName}` : "/"))
    } catch (error) {
      // Sesión caducada: el store ya redirige al login, sin toast de error.
      if (isUnauthorizedError(error)) return
      toast.add({
        severity: "error",
        summary: t("recipe.delete.error"),
        life: 5000,
      })
      console.error("Failed to delete recipe:", error)
    } finally {
      deleting.value = false
    }
  }

  const handleDeleteClick = () => {
    confirm.require({
      group: "recipe-delete",
      header: t("recipe.delete.confirmHeader"),
      message: t("recipe.delete.confirmMessage", { title: recipeTitle }),
      icon: "pi pi-exclamation-triangle text-red-500!",
      defaultFocus: "reject",
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("common.delete"),
        severity: "danger",
      },
      accept: () => {
        void handleDelete()
      },
    })
  }
</script>

<template>
  <div
    v-if="isAdmin"
    class="fixed bottom-4 right-4 lg:bottom-10 lg:right-10 z-20 flex flex-col gap-3"
  >
    <ConfirmDialog group="recipe-delete" />
    <span
      v-tooltip.top="t('recipe.delete.button')"
      class="inline-flex"
    >
      <Button
        rounded
        size="large"
        severity="danger"
        :loading="deleting"
        :disabled="deleting"
        :aria-label="t('recipe.delete.button')"
        @click="handleDeleteClick"
      >
        <i class="pi pi-trash" />
      </Button>
    </span>
    <span
      v-tooltip.top="t('recipe.edit.button')"
      class="inline-flex"
    >
      <Button
        rounded
        size="large"
        :disabled="deleting"
        :aria-label="t('recipe.edit.button')"
        @click="goToEdit"
      >
        <i class="pi pi-pencil" />
      </Button>
    </span>
  </div>
</template>
