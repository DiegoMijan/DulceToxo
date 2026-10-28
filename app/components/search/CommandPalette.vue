<script setup lang="ts">
  import type { PaletteItem } from "~/composables/useRecipeSearch"

  const { isOpen, close, toggle } = useCommandPalette()
  const {
    query,
    loading,
    groups,
    activeItem,
    showEmpty,
    maxQueryLength,
    loadIdleData,
    moveActive,
    setActiveItem,
    reset,
    clearRecent,
  } = useRecipeSearch()

  const { t } = useI18n()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const searchInput = useTemplateRef<HTMLInputElement>("searchInput")

  const listboxId = "command-palette-listbox"
  const activeOptionId = computed(() => activeItem.value?.optionId)
  const dialogPt = computed(() => {
    const mobile = isMobile.value
    return {
      root: {
        class: mobile
          ? "command-palette-dialog !m-0 h-screen !max-h-screen w-screen !max-w-none overflow-hidden rounded-none border-0 bg-french-lilac-50 shadow-none dark:bg-french-lilac-950"
          : "command-palette-dialog w-full max-w-2xl overflow-hidden rounded-2xl border border-french-lilac-200 bg-french-lilac-50 shadow-xl dark:border-french-lilac-800 dark:bg-french-lilac-950",
        style: mobile
          ? { width: "100vw", height: "100vh", maxWidth: "100vw", margin: 0, top: 0 }
          : { marginTop: "12vh" },
      },
      content: {
        class: mobile ? "h-full p-0 bg-transparent" : "p-0 bg-transparent",
      },
      mask: {
        class: "bg-french-lilac-950/40 backdrop-blur-sm dark:bg-black/60",
      },
    }
  })

  const handleShow = async () => {
    await loadIdleData()
    await nextTick()
    searchInput.value?.focus()
  }

  const handleHide = () => {
    reset()
  }

  const handleSelect = async (item: PaletteItem) => {
    close()
    await navigateTo(item.to)
  }

  const handleSelectActive = async () => {
    if (!activeItem.value) return
    await handleSelect(activeItem.value)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target
    if (event.key === "Enter" && target instanceof HTMLElement && target.closest("button")) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(1)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(-1)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      void handleSelectActive()
    }
  }

  const handleClearRecent = () => {
    clearRecent()
    searchInput.value?.focus()
  }

  const handleShortcut = (event: KeyboardEvent) => {
    if (event.isComposing || event.altKey || event.shiftKey) return
    if (!(event.metaKey || event.ctrlKey)) return
    if (event.key.toLowerCase() !== "k") return
    event.preventDefault()
    toggle()
  }

  useEventListener("keydown", handleShortcut)

  watch(activeOptionId, async (optionId) => {
    if (!optionId) return
    await nextTick()
    document.getElementById(optionId)?.scrollIntoView({ block: "nearest" })
  })

  watch(isOpen, (open) => {
    if (open) return
    handleHide()
  })
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    dismissable-mask
    :show-header="false"
    :closable="false"
    :draggable="false"
    :maximized="isMobile"
    :position="isMobile ? 'center' : 'top'"
    :pt="dialogPt"
    :aria-label="t('search.dialog')"
    @show="handleShow"
    @hide="close"
  >
    <div
      class="flex min-h-0 flex-col"
      :class="isMobile ? 'h-screen' : 'max-h-[min(32rem,70vh)]'"
      data-testid="command-palette"
      @keydown="handleKeyDown"
    >
      <div class="flex items-center gap-3 border-b border-french-lilac-200 px-4 py-3 dark:border-french-lilac-800">
        <NuxtIcon
          name="material-symbols:search-rounded"
          class="text-2xl text-french-lilac-600 dark:text-french-lilac-300"
          aria-hidden="true"
        />
        <input
          id="command-palette-input"
          ref="searchInput"
          v-model="query"
          type="text"
          role="combobox"
          class="min-w-0 flex-1 bg-transparent text-lg text-french-lilac-950 outline-none placeholder:text-french-lilac-400 dark:text-french-lilac-50 dark:placeholder:text-french-lilac-400"
          :placeholder="t('search.placeholder')"
          :aria-label="t('search.placeholder')"
          :aria-expanded="true"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-activedescendant="activeOptionId"
          :aria-busy="loading"
          :maxlength="maxQueryLength"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          data-testid="command-palette-input"
        >
        <i
          v-if="loading"
          class="pi pi-spinner pi-spin text-french-lilac-500"
          :aria-label="t('search.loading')"
        />
        <button
          type="button"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-french-lilac-600 transition-colors hover:bg-french-lilac-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200 dark:hover:bg-french-lilac-800"
          :aria-label="t('search.close')"
          data-testid="command-palette-close"
          @click="close"
        >
          <NuxtIcon
            name="material-symbols:close-rounded"
            class="text-xl"
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        :id="listboxId"
        role="listbox"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        :aria-label="t('search.dialog')"
      >
        <p
          v-if="showEmpty"
          class="px-3 py-8 text-center text-sm text-french-lilac-600 dark:text-french-lilac-200"
          data-testid="command-palette-empty"
          role="status"
        >
          {{ t('search.noResults', { query: query.trim() }) }}
        </p>

        <div
          v-for="group in groups"
          :key="group.id"
          role="group"
          class="mb-2"
          :aria-label="group.label"
          :data-testid="`command-palette-group-${group.id}`"
        >
          <div class="flex items-center justify-between gap-2 px-3 py-2">
            <p class="text-xs font-semibold tracking-wide text-french-lilac-500 uppercase dark:text-french-lilac-300">
              {{ group.label }}
            </p>
            <button
              v-if="group.id === 'recent'"
              type="button"
              class="inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium text-french-lilac-600 transition-colors hover:bg-french-lilac-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-french-lilac-500 dark:text-french-lilac-200 dark:hover:bg-french-lilac-800"
              :aria-label="t('search.clearRecentAria')"
              data-testid="command-palette-clear-recent"
              @click.stop="handleClearRecent"
            >
              {{ t('search.clearRecent') }}
            </button>
          </div>
          <SearchPaletteRow
            v-for="item in group.items"
            :key="item.optionId"
            :item="item"
            :active="item.optionId === activeOptionId"
            :query="query"
            @select="handleSelect"
            @hover="setActiveItem"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
