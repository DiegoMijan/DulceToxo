<script setup lang="ts">
const { parentIsFlex = true } = defineProps<{
  parentIsFlex?: boolean
}>()

const classList = computed(() => {
  return parentIsFlex ? "flex-1" : ""
})
</script>
<template>
  <div class="grid grid-cols-5" :class="classList">
    <aside class="col-span-1 p-4 overflow-y-auto">
      <slot name="left-menu" />
    </aside>
    <main class="col-span-3 p-6 overflow-y-auto">
      <slot />
    </main>
    <aside class="col-span-1 p-4 overflow-y-auto">
      <slot name="right-menu" />
    </aside>
  </div>
</template>

