<script setup lang="ts">
  const { isApproved } = useAuth()
  const { open } = useCommandPalette()
  const { t } = useI18n()

  const shortcutLabel = computed(() => {
    if (!import.meta.client) return "Ctrl+K"
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    return isApple ? "⌘K" : "Ctrl+K"
  })

  const tooltip = computed(() => t("header.searchShortcut", { shortcut: shortcutLabel.value }))

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    open()
  }
</script>

<template>
  <template v-if="isApproved">
    <NuxtIcon
      v-tooltip.bottom="tooltip"
      name="material-symbols:search-rounded"
      class="cursor-pointer text-2xl text-white transition-transform duration-200 hover:scale-110 focus:bg-amber-300! focus:dark:bg-french-lilac-500!"
      :aria-label="tooltip"
      aria-keyshortcuts="Control+K Meta+K"
      aria-hidden="false"
      tabindex="0"
      data-testid="header-search-button"
      @click="open"
      @keydown="handleKeyDown"
    />
    <SearchCommandPalette />
  </template>
</template>
