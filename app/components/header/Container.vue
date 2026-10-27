<script setup lang="ts">
  const isScrolled = ref(false)

  const { y } = useWindowScroll()
  const localePath = useLocalePath()
  const colorMode = useColorMode()

  // En tema claro, al hacer scroll la cabecera es translucida sobre fondo claro: textos e iconos en morado
  const onLightBackground = computed(() => isScrolled.value && colorMode.value !== "dark")

  watch(y, () => {
    isScrolled.value = y.value > 0
  })

  const goToHome = () => {
    navigateTo(localePath("/"))
  }
</script> 

<template>
  <header
    role="banner"
    class="sticky top-0 left-0 right-0 flex px-6 md:px-8 xl:px-[20rem] py-2 items-center z-25"
    :class="[
      isScrolled
        ? 'dark:bg-french-lilac-950/80! backdrop-blur-sm'
        : ' bg-french-lilac-700 dark:bg-french-lilac-950! header-border-width border-gradient-to-r',
      { 'header-on-light': onLightBackground },
    ]"
  >
    <NuxtImg
      class="cursor-pointer"
      src="/img/logo_toxo.webp"
      alt="Logo Dulce Toxo"
      style="height: 50px;"
      @click="goToHome"
    />
    <nav
      role="toolbar"
      class="ml-auto flex gap-3 items-center"
    >
      <HeaderAuthSection />
      <HeaderThemeToggle />
      <HeaderSelectLanguage />
    </nav>
  </header>
</template>

<style scoped>
/* Ancho que ayuda a la lectura => max-width:65ch*/

.header-border-width {
    border-bottom-width: 0.15rem;
}
.header-on-light :deep(.text-white:not(.theme-toggle)) {
  color: var(--color-french-lilac-700);
  transition: color 0.2s ease;
}
.header-on-light :deep(.bg-white\/20) {
  background-color: color-mix(in srgb, var(--color-french-lilac-700) 15%, transparent);
}
.header-on-light :deep(.hover\:bg-white\/10:hover) {
  background-color: color-mix(in srgb, var(--color-french-lilac-700) 10%, transparent);
}
.border-gradient-to-r {
  border-image: linear-gradient(to right, transparent, var(--color-yellow-300), transparent) 1;
}
</style>
