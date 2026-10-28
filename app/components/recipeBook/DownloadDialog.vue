<script setup lang="ts">
  import type { RecipeBookItem } from "~/components/recipeBook/RecipePicker.vue"

  const { items, dialogTitle, collectionName, fileStem } = defineProps<{
    items: RecipeBookItem[]
    dialogTitle: string
    collectionName: string
    fileStem: string
  }>()

  const visible = defineModel<boolean>("visible", { default: false })

  const { t, locale } = useI18n()
  const { downloadCookbookPdf } = useRecipePdf()
  const toast = useToast()
  const isMobile = useMediaQuery("(max-width: 640px)")

  const mode = ref<"all" | "pick">("all")
  const selectedIds = ref<string[]>([])
  const includePhotos = ref(true)
  const includeCover = ref(true)
  const generating = ref(false)
  const preparingIndex = ref(0)
  const preparingTotal = ref(0)
  let abortController: AbortController | null = null

  const itemIds = computed(() => items.map((item) => item.id))
  const downloadIds = computed(() => {
    if (mode.value === "all") return itemIds.value
    const selected = new Set(selectedIds.value)
    return items.filter((item) => selected.has(item.id)).map((item) => item.id)
  })
  const downloadCount = computed(() => downloadIds.value.length)
  const progressValue = computed(() => {
    if (!preparingTotal.value) return 0
    return Math.round((preparingIndex.value / preparingTotal.value) * 100)
  })
  const preparingLabel = computed(() =>
    t("recipeBook.preparing", {
      i: Math.max(preparingIndex.value, 1),
      n: Math.max(preparingTotal.value, downloadCount.value, 1),
    }),
  )

  const dialogPt = computed(() => {
    const mobile = isMobile.value
    return {
      root: {
        class: mobile
          ? "recipe-book-dialog !fixed !inset-0 !m-0 !h-dvh !max-h-dvh !w-screen !max-w-none overflow-hidden !rounded-none !border-0 bg-french-lilac-50 !shadow-none dark:bg-french-lilac-950"
          : "recipe-book-dialog w-full max-w-xl overflow-hidden rounded-2xl border border-french-lilac-200 bg-french-lilac-50 shadow-xl dark:border-french-lilac-800 dark:bg-french-lilac-950",
        style: mobile
          ? {
              width: "100vw",
              height: "100dvh",
              maxWidth: "100vw",
              maxHeight: "100dvh",
              margin: 0,
              top: 0,
              left: 0,
              borderRadius: 0,
            }
          : undefined,
      },
      content: {
        class: mobile ? "h-full p-0 bg-transparent" : "p-0 bg-transparent",
      },
      mask: {
        class: mobile
          ? "!items-stretch !justify-stretch !p-0 bg-french-lilac-950/40 backdrop-blur-sm dark:bg-black/60"
          : "bg-french-lilac-950/40 backdrop-blur-sm dark:bg-black/60",
        style: mobile
          ? { alignItems: "stretch", justifyContent: "stretch", padding: 0 }
          : undefined,
      },
    }
  })

  const pdfLabels = computed(() => ({
    prepTime: t("recipe.prepTime", { time: "{time}" }),
    cookTime: t("recipe.cookTime", { time: "{time}" }),
    difficulty: t("recipe.difficulty"),
    ingredients: t("recipe.edit.form.ingredients"),
    instructions: t("recipe.edit.form.instructions"),
  }))

  const resetForm = () => {
    mode.value = "all"
    selectedIds.value = itemIds.value
    includePhotos.value = true
    includeCover.value = true
    generating.value = false
    preparingIndex.value = 0
    preparingTotal.value = 0
  }

  const handleSelectAllMode = () => {
    mode.value = "all"
  }

  const handleSelectPickMode = () => {
    mode.value = "pick"
    if (selectedIds.value.length === 0) selectedIds.value = itemIds.value
  }

  const handleClose = () => {
    if (generating.value) return
    visible.value = false
  }

  const handleCancel = () => {
    abortController?.abort()
    generating.value = false
  }

  const handleProgress = (completed: number, total: number) => {
    preparingTotal.value = Math.max(preparingTotal.value, total)
    preparingIndex.value = Math.max(preparingIndex.value, completed)
  }

  const handleDownload = async () => {
    if (downloadCount.value === 0 || generating.value) return

    abortController = new AbortController()
    generating.value = true
    preparingIndex.value = 0
    preparingTotal.value = downloadCount.value

    try {
      await downloadCookbookPdf(downloadIds.value, {
        collectionName,
        fileStem,
        includePhotos: includePhotos.value,
        includeCoverAndIndex: includeCover.value,
        labels: pdfLabels.value,
        cookbookLabels: {
          indexTitle: t("recipeBook.indexTitle"),
          recipesCount: t("recipeBook.coverCount", { n: downloadCount.value }),
          date: formatCookbookDate(locale.value),
        },
        signal: abortController.signal,
        onProgress: handleProgress,
      })
      visible.value = false
    } catch (error) {
      if (isAbortError(error)) return
      toast.add({
        severity: "error",
        summary: t("recipeBook.error"),
        life: 5000,
      })
    } finally {
      generating.value = false
      abortController = null
    }
  }

  watch(visible, (open) => {
    if (open) {
      resetForm()
      return
    }
    abortController?.abort()
    generating.value = false
  })

  watch(itemIds, (ids) => {
    const allowed = new Set(ids)
    selectedIds.value = selectedIds.value.filter((id) => allowed.has(id))
  })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :dismissable-mask="!generating"
    :close-on-escape="!generating"
    :show-header="false"
    :closable="false"
    :draggable="false"
    :maximized="isMobile"
    :breakpoints="{ '640px': '100vw' }"
    :pt="dialogPt"
    aria-labelledby="recipe-book-dialog-title"
    :aria-busy="generating"
    data-testid="recipe-book-dialog"
  >
    <div
      class="flex min-h-0 flex-col max-h-[min(40rem,85vh)] max-[640px]:h-dvh max-[640px]:max-h-dvh"
    >
      <div class="flex items-start justify-between gap-3 border-b border-french-lilac-200 px-5 py-4 dark:border-french-lilac-800">
        <h2
          id="recipe-book-dialog-title"
          class="title text-xl font-semibold text-french-lilac-900 dark:text-french-lilac-50"
        >
          {{ dialogTitle }}
        </h2>
        <button
          v-if="!generating"
          type="button"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-french-lilac-600 transition-colors hover:bg-french-lilac-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200 dark:hover:bg-french-lilac-800"
          :aria-label="t('recipeBook.close')"
          data-testid="recipe-book-close"
          @click="handleClose"
        >
          <i
            class="pi pi-times"
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        v-if="generating"
        class="flex flex-1 flex-col justify-center gap-4 px-5 py-8"
        role="status"
        aria-live="polite"
        data-testid="recipe-book-progress"
      >
        <p class="text-sm text-stone-700 dark:text-stone-200">
          {{ preparingLabel }}
        </p>
        <ProgressBar
          :value="progressValue"
          :aria-label="t('recipeBook.progress')"
        />
        <Button
          type="button"
          severity="secondary"
          outlined
          class="cursor-pointer self-start"
          data-testid="recipe-book-cancel"
          @click="handleCancel"
        >
          {{ t("recipeBook.cancel") }}
        </Button>
      </div>

      <div
        v-else
        class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
      >
        <div
          role="radiogroup"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
          :aria-label="t('recipeBook.modeGroup')"
        >
          <RecipeBookModeCard
            :selected="mode === 'all'"
            :title="t('recipeBook.modeAll', { n: items.length })"
            data-testid="recipe-book-mode-all"
            @select="handleSelectAllMode"
          />
          <RecipeBookModeCard
            :selected="mode === 'pick'"
            :title="t('recipeBook.modePick')"
            data-testid="recipe-book-mode-pick"
            @select="handleSelectPickMode"
          />
        </div>

        <RecipeBookRecipePicker
          v-if="mode === 'pick'"
          v-model="selectedIds"
          :items="items"
        />

        <fieldset class="flex flex-col gap-3 border-0 p-0">
          <legend class="sr-only">
            {{ t("recipeBook.optionsGroup") }}
          </legend>
          <label class="flex cursor-pointer items-center gap-3 text-sm text-stone-700 dark:text-stone-200">
            <Checkbox
              v-model="includePhotos"
              binary
              input-id="recipe-book-include-photos"
            />
            <span>{{ t("recipeBook.includePhotos") }}</span>
          </label>
          <label class="flex cursor-pointer items-center gap-3 text-sm text-stone-700 dark:text-stone-200">
            <Checkbox
              v-model="includeCover"
              binary
              input-id="recipe-book-include-cover"
            />
            <span>{{ t("recipeBook.includeCover") }}</span>
          </label>
        </fieldset>
      </div>

      <div
        v-if="!generating"
        class="border-t border-french-lilac-200 px-5 py-4 dark:border-french-lilac-800"
      >
        <Button
          type="button"
          class="w-full cursor-pointer"
          :disabled="downloadCount === 0"
          data-testid="recipe-book-confirm"
          @click="handleDownload"
        >
          <i
            class="pi pi-file-pdf mr-2"
            aria-hidden="true"
          />
          {{ t("recipeBook.confirm", { n: downloadCount }) }}
        </Button>
      </div>
    </div>
  </Dialog>
</template>

<style>
@media screen and (max-width: 640px) {
  .p-dialog-mask:has(.recipe-book-dialog) {
    align-items: stretch !important;
    justify-content: stretch !important;
    padding: 0 !important;
  }

  .p-dialog.recipe-book-dialog {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    max-width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
}
</style>
