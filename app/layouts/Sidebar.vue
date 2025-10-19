<script setup lang="ts">
const { parentIsFlex = true } = defineProps<{
  parentIsFlex?: boolean
}>()

const classList = computed(() => {
  return parentIsFlex ? "flex-1" : ""
})
</script>
<template>
  <div
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
</template>

