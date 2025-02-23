<script setup lang="ts">
import type Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import gl from '@/public/img/es-ga.svg'
import es from '@/public/img/es.svg'
import en from '@/public/img/gb.svg'

const { locales, setLocale, locale } = useI18n()

type Manu = InstanceType<typeof Menu>

const menu = useTemplateRef<Manu>('menu')
const items = ref<MenuItem[]>([
])

const toggle = (event: Event) => {
  menu.value?.toggle(event)
}

onMounted(() => {
  locales.value.forEach(({ code, name }) => {
    const img = code === 'es' ? es : code === 'en' ? en : gl
    items.value.push({ key: code, label: name, img, command: () => {
      setLocale(code)
    },
    })
  })
})
</script>

<template>
  <NuxtIcon
    name="clarity:language-solid"
    class="cursor-pointer text-2xl"
    @mouseover="toggle"
  />
  <Menu
    id="language-menu"
    ref="menu"
    :model="items"
    :popup="true"
  >
    <template #itemicon="{ item }">
      <div
        class="w-[0.25rem] h-4 rounded"
        :class="[item.key === locale ? 'bg-french-lilac-500' : '']"
      />
      <img
        :src="item.img"
        alt="language"
        class="h-4 rounded"
      >
    </template>
  </Menu>
</template>
