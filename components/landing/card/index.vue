<script setup lang="ts">
interface Props {
  icon: string
  title: string
  description: string
  darkIcon?: string
}

const { description, icon, title, darkIcon } = defineProps<Props>()
const colorMode = useColorMode()

const calculatedIcon = computed(() => {
  if (darkIcon && colorMode.value === 'dark') {
    return darkIcon
  }
  return icon
})

const cardRef = ref<{ $el: HTMLElement } | null>(null)
const transformStyle = ref('rotateX(0deg) rotateY(0deg) scale(1)')
let animationFrameId: number | null = 0

const handleMouseMove = (e: MouseEvent) => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(() => {
    const card = cardRef.value?.$el
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = -(y - centerY) / 10
    const rotateY = (x - centerX) / 10

    transformStyle.value = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
  })
}

const resetTransform = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  transformStyle.value = 'rotateX(0deg) rotateY(0deg) scale(1)'
}

onMounted(() => {
  const el = cardRef.value?.$el
  if (el) {
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', resetTransform)
  }
})

onUnmounted(() => {
  const el = cardRef.value?.$el
  if (el) {
    el.removeEventListener('mousemove', handleMouseMove)
    el.removeEventListener('mouseleave', resetTransform)
  }
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <Card
    ref="cardRef"
    class="cursor-pointer card-container"
    :style="{ transform: transformStyle }"
    :pt="{
      content: {
        class: 'content',
      },
    }"
  >
    <template #header>
      <h3 class="flex items-center p-2 pl-4 gap-2 title text-2xl!">
        <slot
          name="icon"
          :calculated-icon
        />
        <span>{{ title }}</span>
      </h3>
    </template>
    <p>{{ description }}</p>
    <template #content>
      {{ description }}
    </template>
  </Card>
</template>

<style scoped>
.card-container {
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.35s ease; /* más suave */
}
</style>
