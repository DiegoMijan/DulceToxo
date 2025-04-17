<script setup lang="ts">
const colorMode = useColorMode()

const toggleDarkMode = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <NuxtIcon
    v-tooltip.bottom="$t('header.theme')"
    :name="colorMode.preference === 'dark' ? 'material-symbols:dark-mode-outline-rounded' :'material-symbols:sunny-outline' "
    class="text-2xl cursor-pointer text-white"
    :aria-label="$t('header.theme')"
    :aria-pressed="colorMode.preference === 'dark'"
    @click="toggleDarkMode"
  />
</template>
