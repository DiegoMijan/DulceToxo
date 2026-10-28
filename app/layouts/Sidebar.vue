<script setup lang="ts">
const {
  parentIsFlex = true,
  menuCount,
  contentEmpty = false,
} = defineProps<{
  parentIsFlex?: boolean
  // Numero de recetas del menu izquierdo (se muestra en el boton movil)
  menuCount?: number
  // Sin receta abierta: en movil el menu izquierdo se muestra en linea en lugar del contenido
  contentEmpty?: boolean
}>()

const { t } = useI18n()
const route = useRoute()

// Por debajo de lg la rejilla de 3 columnas no cabe: menu izquierdo en un Drawer
const isDesktop = useMediaQuery("(min-width: 1024px)")
const menuVisible = ref(false)

const classList = computed(() => {
  return parentIsFlex ? "flex-1" : ""
})

const menuLabel = computed(() =>
  t("recipe.list.open", { count: menuCount ?? 0 }),
)

watch(() => route.fullPath, () => {
  menuVisible.value = false
})

watch(isDesktop, (desktop) => {
  if (desktop) menuVisible.value = false
})
</script>
<template>
  <div
    v-if="isDesktop"
    class="grid grid-cols-5"
    :class="classList"
  >
    <aside class="col-span-1 md:px-2 lg:pl-[8rem] py-10 flex flex-col">
      <slot name="left-menu" />
    </aside>
    <main class="col-span-3 p-6 py-10 overflow-y-auto">
      <slot name="content" />
    </main>
    <aside class="col-span-1 md:px-2 lg:pr-[8rem] py-10 flex flex-col">
      <slot name="right-menu" />
    </aside>
  </div>
  <div
    v-else
    class="sidebar-mobile flex min-w-0 flex-col"
    :class="classList"
  >
    <div class="flex items-center gap-3 px-4 pt-4 sm:px-6">
      <Button
        v-if="!contentEmpty && menuCount !== 0"
        :label="menuLabel"
        icon="pi pi-list"
        severity="secondary"
        outlined
        class="min-h-11 shrink-0"
        data-testid="sidebar-menu-button"
        @click="menuVisible = true"
      />
      <div
        class="ml-auto w-full min-w-0"
        :class="{ 'max-w-56': !contentEmpty }"
      >
        <slot name="right-menu" />
      </div>
    </div>
    <main class="min-w-0 px-4 py-6 sm:px-6">
      <div
        v-if="contentEmpty"
        class="mx-auto flex w-full max-w-md flex-col"
        data-testid="sidebar-menu-inline"
      >
        <slot name="left-menu" />
      </div>
      <slot
        v-else
        name="content"
      />
    </main>
    <Drawer
      v-model:visible="menuVisible"
      :header="menuLabel"
      position="left"
      block-scroll
      class="sidebar-mobile w-[85vw]! max-w-sm!"
      data-testid="sidebar-menu-drawer"
    >
      <div class="flex flex-col">
        <slot name="left-menu" />
      </div>
    </Drawer>
  </div>
</template>

<style>
/* En movil la lista fluye con la pagina (o el Drawer) en lugar de su caja de 7 elementos */
.sidebar-mobile .recipe-list-scroll {
  max-height: none !important;
}
</style>
