<script setup lang="ts">
import brownie from '@/public/img/brownie.webp'
import darBrownie from '@/public/img/dark_brownie.webp'

const cards = ref([
  {
    darkIcon: 'twemoji:cupcake',
    description: 'Pequeñas obras de arte en forma de pastel. Esponjosos, coloridos y con deliciosos'
      + 'toppings que los hacen irresistibles. ¡Un bocado de felicidad!',
    title: 'Cupcakes',
    icon: 'fluent-emoji:cupcake',
  },
  {
    darkIcon: 'unjs:cookie-es',
    description: 'Pequeñas delicias crujientes por fuera y tiernas por dentro. '
      + 'Desde las clásicas choco chips hasta las más innovadoras,¡perfectas para cualquier momento dulce!',
    title: 'Cookies',
    icon: 'twemoji:cookie',
  },
  {
    icon: 'noto:shortcake',
    description: 'Suaves, cremosas y llenas de sabor. Desde la clásica New York hasta las más sorprendentes versiones, '
      + 'cada bocado es pura tentación.',
    title: 'Tartas de queso',
    darkIcon: 'emojione:shortcake',
  },
  {
    icon: 'logos:cakephp-icon',
    description: 'Esponjosos y caseros, perfectos para acompañar con café o té. '
      + 'Tradicionales o con un toque especial, siempre son un acierto.',
    title: 'Bizcochos',
    darkIcon: 'streamline-emojis:birthday-cake-3',
  },
  {
    icon: brownie,
    title: 'Brownies',
    darkIcon: darBrownie,
    description: 'Deliciosamente densos y húmedos, con un equilibrio perfecto entre lo crujiente y lo suave. '
      + 'Ideales para los amantes del chocolate.',
    isImage: true,
  },
  {
    icon: 'emojione-v1:shortcake',
    title: 'Tartas frías',
    darkIcon: 'streamline-emojis:shortcake-1',
    description: 'Refrescantes y cremosas, perfectas para cualquier ocasión. '
      + 'Con combinaciones irresistibles de sabores y texturas que enamoran.',
  },

])
</script>

<template>
  <main class="flex justify-center py-8">
    <div class="max-w-[100ch] flex flex-col gap-7">
      <LazyLandingProfile />
      <div class="grid md:grid-cols-2 gap-10 sm:grid-cols-1 lg:px-0 px-4">
        <LandingCard
          v-for="{ description, icon, title, darkIcon, isImage } in cards"
          :key="icon"
          :description
          :icon
          :dark-icon
          :title
        >
          <template #icon="{ calculatedIcon }">
            <NuxtIcon
              v-if="!isImage"
              :name="calculatedIcon"
            />
            <img
              v-else
              :src="calculatedIcon"
              alt="Header image"
              height="24"
              width="24"
            >
          </template>
        </LandingCard>
      </div>
    </div>
  </main>
</template>
