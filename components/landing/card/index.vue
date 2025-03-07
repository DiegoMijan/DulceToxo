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
</script>

<template>
  <Card
    class="cursor-pointer card-container"
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
