<script setup lang="ts">
  declare global {
    interface Document {
      startViewTransition?: (callback: () => void | Promise<void>) => { finished: Promise<void> }
    }
  }

  const colorMode = useColorMode()

  const switchTheme = () => {
    colorMode.preference = colorMode.preference === "dark" ? "light" : "dark"
  }

  const toggleDarkMode = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!document.startViewTransition || prefersReducedMotion) {
      switchTheme()
      return
    }

    document.startViewTransition(async () => {
      switchTheme()
      await nextTick()
    })
  }
</script>

<template>
  <NuxtIcon
    v-tooltip.bottom="$t('header.theme')"
    :name="colorMode.preference === 'dark' ? 'material-symbols:dark-mode-outline-rounded' :'material-symbols:sunny-outline' "
    class="text-2xl cursor-pointer text-white transition-transform duration-200 hover:scale-110 focus:dark:bg-french-lilac-500!
    focus:bg-amber-300!"
    :aria-label="$t('header.theme')"
    :aria-pressed="colorMode.preference === 'dark'"
    aria-hidden="false"
    tabindex="0"
    @click="toggleDarkMode"
  />
</template>

<style scoped>
.transition-transform {
  transition: transform 0.2s ease-in-out;
}
</style>
