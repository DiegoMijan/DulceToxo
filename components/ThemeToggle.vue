<script setup lang="ts">
const colorMode = useColorMode()

const toggleDarkMode = () => {
    colorMode.preference = colorMode.preference === 'dark'? 'light' : 'dark'
}
</script>
<template>
    <div class="ml-auto!">
        <NuxtIcon @click="toggleDarkMode" :name="colorMode.preference === 'dark' ? 'material-symbols:dark-mode-outline-rounded' :'material-symbols:sunny-outline' " class="text-xl cursor-pointer" />
    </div>
</template>