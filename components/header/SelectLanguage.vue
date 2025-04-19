<script setup lang="ts">
import type Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import gl from '@/public/img/es-ga.svg'
import es from '@/public/img/es.svg'
import en from '@/public/img/gb.svg'

const { locales, setLocale, locale } = useI18n()

type MenuType = InstanceType<typeof Menu>

const menu = useTemplateRef<MenuType>('menu')
const items = ref<MenuItem[]>([
])

const toggle = (event: Event) => {
  menu.value?.toggle(event)
}

onMounted(() => {
  locales.value.forEach(({ code: key, name: label }) => {
    const img = key === 'es' ? es : key === 'en' ? en : gl
    items.value.push({
      key,
      label,
      img,
      command: () => {
        setLocale(key)
      },
    })
  })
})
</script>

<template>
  <NuxtIcon
    name="clarity:language-solid"
    class="cursor-pointer text-2xl text-white transition-transform duration-200 hover:scale-110"
    aria-controls="language-menu"
    :aria-label="$t('header.language')"
    @mouseover="toggle"
  />
  <Menu
    id="language-menu"
    ref="menu"
    :model="items"
    :popup="true"
    :aria-label="$t('header.languageMenu')"
  >
    <template #itemicon="{ item }">
      <div
        class="w-[0.25rem] h-4 rounded"
        :class="[item.key === locale ? 'bg-french-lilac-500' : '']"
      />
      <img
        :src="item.img"
        :alt="$t(`languages.${item.key}`)"
        class="h-4 rounded"
      >
    </template>
  </Menu>
</template>

<style scoped>
.transition-transform {
  transition: transform 0.2s ease-in-out;
}
</style>
