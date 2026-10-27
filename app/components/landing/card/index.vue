<script setup lang="ts">
interface Props {
  icon: string
  title: string
  description: string
  urlName?: string
  darkIcon?: string
  isModalOpen?: boolean
}

const { icon, title, urlName, darkIcon, isModalOpen } = defineProps<Props>()

const localePath = useLocalePath()
const colorMode = useColorMode()

const cardRef = ref<HTMLElement | null>(null)
const transformStyle = ref("rotateX(0deg) rotateY(0deg) scale(1)")

const { elementX, elementY, isOutside } = useMouseInElement(cardRef)
const { width, height } = useElementBounding(cardRef)

const calculatedIcon = computed(() => {
  if (darkIcon && colorMode.value === "dark") {
    return darkIcon
  }
  return icon
})

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

const categoryPath = computed(() => (urlName ? localePath(`/${urlName}`) : undefined))

const cardPt = {
  root: { class: "h-full flex flex-col" },
  body: { class: "flex flex-1 flex-col" },
  content: { class: "content flex-1" },
}
</script>

<template>
  <NuxtLink
    v-if="categoryPath"
    :to="categoryPath"
    class="block h-full no-underline text-inherit"
    :aria-label="title"
  >
    <Card
      ref="cardRef"
      class="cursor-pointer card-container h-full"
      :style="{ transform: transformStyle }"
      :pt="cardPt"
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
  </NuxtLink>
  <Card
    v-else
    ref="cardRef"
    class="card-container h-full"
    :style="{ transform: transformStyle }"
    :pt="cardPt"
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
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.35s ease;
}
</style>
