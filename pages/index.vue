<script setup lang="ts">
const cards = ref([
  {
    darkIcon: 'twemoji:cupcake',
    description: 'Pequeñas obras de arte en forma de pastel. Esponjosos, coloridos y con deliciosos toppings que los hacen irresistibles. ¡Un bocado de felicidad!',
    title: 'Cupcakes',
    icon: 'fluent-emoji:cupcake',
  },
  {
    darkIcon: 'unjs:cookie-es',
    description: 'Pequeñas delicias crujientes por fuera y tiernas por dentro. Desde las clásicas choco chips hasta las más innovadoras, ¡perfectas para cualquier momento dulce!',
    title: 'Cookies',
    icon: 'twemoji:cookie',
  },
  {
    icon: 'noto:shortcake',
    description: 'Suaves, cremosas y llenas de sabor. Desde la clásica New York hasta las más sorprendentes versiones, cada bocado es pura tentación.',
    title: 'Tartas de queso',
    darkIcon: 'emojione:shortcake',
  },
  {
    icon: 'logos:cakephp-icon',
    description: 'Esponjosos y caseros, perfectos para acompañar con café o té. Tradicionales o con un toque especial, siempre son un acierto.',
    title: 'Bizcochos',
    darkIcon: 'streamline-emojis:birthday-cake-3',
  },

])
</script>

<template>
  <main class="flex justify-center py-8">
    <div class="max-w-[100ch] flex flex-col gap-4">
      <LandingProfile />
      <div class="grid grid-cols-2 gap-4">
        <LandingCard
          v-for="{ description, icon, title, darkIcon } in cards"
          :key="icon"
          :description
          :icon
          :title
          :dark-icon
        />
      </div>
    </div>
  </main>
</template>
