<script setup lang="ts">
interface Props {
  icon: string
  title: string
  description: string
  darkIcon?: string
  isModalOpen?: boolean
}

const { description, icon, title, darkIcon, isModalOpen } = defineProps<Props>()
const colorMode = useColorMode()

const calculatedIcon = computed(() => {
  if (darkIcon && colorMode.value === "dark") {
    return darkIcon
  }
  return icon
})

const cardRef = ref<HTMLElement | null>(null)
const transformStyle = ref("rotateX(0deg) rotateY(0deg) scale(1)")

const { elementX, elementY, isOutside } = useMouseInElement(cardRef)
const { width, height } = useElementBounding(cardRef)

watchEffect(() => {
  if (isOutside.value || isModalOpen) {
    transformStyle.value = "rotateX(0deg) rotateY(0deg) scale(1)"
    return
  }

  const centerX = width.value / 2
  const centerY = height.value / 2

  const rotateX = -(elementY.value - centerY) / 10
  const rotateY = (elementX.value - centerX) / 10

  transformStyle.value = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
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
      <NuxtLink :to="`/${title.toLowerCase()}`">
        <h3 class="flex items-center p-2 pl-4 gap-2 title text-2xl!">
          <slot
            name="icon"
            :calculated-icon
          />
          <span>{{ title }}</span>
        </h3>
      </NuxtLink>
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
  transition: transform 0.35s ease;
}
</style>
