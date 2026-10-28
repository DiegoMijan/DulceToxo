<script setup lang="ts">
  import type { RecipeBookItem } from "~/components/recipeBook/RecipePicker.vue"

  defineProps<{
    items: RecipeBookItem[]
    dialogTitle: string
    collectionName: string
    fileStem: string
  }>()

  const { t } = useI18n()
  const visible = ref(false)

  const handleOpen = () => {
    visible.value = true
  }
</script>

<template>
  <div>
    <Button
      type="button"
      class="my-4 w-full cursor-pointer"
      size="small"
      outlined
      :aria-label="t('recipeBook.download')"
      data-testid="recipe-book-download-button"
      @click="handleOpen"
    >
      <i
        class="pi pi-file-pdf mr-2"
        aria-hidden="true"
      />
      {{ t("recipeBook.download") }}
    </Button>
    <RecipeBookDownloadDialog
      v-model:visible="visible"
      :items="items"
      :dialog-title="dialogTitle"
      :collection-name="collectionName"
      :file-stem="fileStem"
    />
  </div>
</template>
