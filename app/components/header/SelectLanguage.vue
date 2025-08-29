<script setup lang="ts">
import type Menu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"
import enPrimevue from "@/../i18n/primevue/en.json"
import esPrimevue from "@/../i18n/primevue/es.json"
import glPrimevue from "@/../i18n/primevue/gl.json"
import es from "@/../public/img/es.svg"
import gl from "@/../public/img/es-ga.svg"
import en from "@/../public/img/gb.svg"

type MenuType = InstanceType<typeof Menu>

const { locales, setLocale, locale } = useI18n()
const primeVue = usePrimeVue()

const menu = useTemplateRef<MenuType>("menu")
const items = ref<MenuItem[]>([])

const toggle = (event: Event) => {
  menu.value?.toggle(event)
}

const primeVueLocales = {
  es: esPrimevue,
  gl: glPrimevue,
  en: enPrimevue,
}

onMounted(() => {
  setPrimeVueLocale(locale.value)

  locales.value.forEach(({ code: key, name: label }) => {
    const img = key === "es" ? es : key === "en" ? en : gl
    items.value.push({
      key,
      label,
      img,
      command: () => {
        setPrimeVueLocale(key)
        setLocale(key)
      },
    })
  })
})

const setPrimeVueLocale = (key: "gl" | "es" | "en") => {
  primeVue.config.locale = {
    ...primeVueLocales[key],
  }
}
</script>

<template>
  <NuxtIcon
    tabindex="0"
    name="clarity:language-solid"
    class="cursor-pointer text-2xl text-white transition-transform duration-200 hover:scale-110 focus:dark:bg-french-lilac-500!
     focus:bg-amber-300!"
    aria-controls="language-menu"
    :aria-label="$t('header.language')"
    aria-hidden="false"
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
