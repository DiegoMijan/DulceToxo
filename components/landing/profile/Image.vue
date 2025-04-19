<script lang="ts" setup>
const { size = '150px', showGradient = false } = defineProps<{
  size?: string
  showGradient?: boolean
}>()
</script>

<template>
  <div
    :class="[
      'mx-auto rounded-full mb-3!',
      showGradient ? 'p-[3px] relative overflow-hidden gradient-border' : '',
    ]"
    :style="{
      width: size,
      height: size,
    }"
  >
    <NuxtImg
      src="/img/lucia.jpg"
      alt="Lucia"
      :class="[
        'rounded-full w-full h-full object-cover',
        showGradient ? 'relative z-10' : '',
      ]"
      :width="size"
    />
  </div>
</template>

<style scoped>
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(270deg, #83C59B, #FCF09A, #FF69B4, #9370DB, #71CAEE, #83C59B);
  background-size: 300% 300%;
  animation: moveGradient 4s alternate infinite;
  z-index: 0;
}

@keyframes moveGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
