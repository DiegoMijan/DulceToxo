<script setup lang="ts">
  const { categoryId } = defineProps<{
    categoryId: string
  }>()

  const { isAdmin } = useAuth()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const handleCreateRecipe = async () => {
    await navigateTo(
      localePath({
        path: "/edit",
        query: { category: categoryId },
      }),
    )
  }
</script>

<template>
  <Button
    v-if="isAdmin"
    type="button"
    class="w-full my-4"
    size="small"
    outlined
    :aria-label="t('recipe.edit.newRecipe')"
    @click="handleCreateRecipe"
  >
    <i class="pi pi-plus mr-2" />
    {{ t('recipe.edit.newRecipe') }}
  </Button>
</template>
