<script setup lang="ts">
const isScrolled = ref(false)

const checkScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <header
    class="sticky top-0 left-0 right-0 flex px-6 md:px-8 xl:px-[20rem] py-2 items-center transition-all duration-300"
    :class="[
      isScrolled
        ? 'bg-french-lilac-950/80 backdrop-blur-sm'
        : 'bg-french-lilac-950 header-border-width border-gradient-to-r',
    ]"
  >
    <img
      class="cursor-pointer"
      src="/public/img/logo_toxo.webp"
      alt="Logo Dulce Toxo"
      style="height: 50px;"
    >
    <div class="ml-auto flex gap-3">
      <HeaderThemeToggle />
      <HeaderSelectLanguage />
    </div>
  </header>
</template>

<style scoped>
/* Ancho que ayuda a la lectura => max-width:65ch*/

.header-border-width {
    border-bottom-width: 0.15rem;
}
.border-gradient-to-r {
  border-image: linear-gradient(to right, transparent, var(--color-yellow-300), transparent) 1;
}
</style>
