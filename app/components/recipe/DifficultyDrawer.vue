<script setup lang="ts">
  const { difficultySelected } = defineProps<{
    difficultySelected: Nullable<number>
  }>()

  const visible = defineModel<boolean>("visible", { required: true })

  const { t } = useI18n()

  const overflow = document.body.style.overflow
  const difficultyList = [1, 2, 3, 4, 5]

  const difficultyListTranslated = computed(() =>
    difficultyList.map((difficulty) => ({
      difficulty,
      title: t(`recipe.difficultyExplanation.${difficulty}.title`),
      description: t(`recipe.difficultyExplanation.${difficulty}.description`),
      explanation: t(`recipe.difficultyExplanation.${difficulty}.explanation`),
    })),
  )

  const getVisibleValue = computed(() => (visible.value ? "hidden" : "auto"))

  onUnmounted(() => {
    document.body.style.overflow = overflow
    document.documentElement.style.overflow = overflow
  })

  const toggleBodyOverflow = () => {
    document.body.style.overflow = getVisibleValue.value
    document.documentElement.style.overflow = getVisibleValue.value
  }
</script>

<template>
  <Drawer
    v-model:visible="visible"
    :header="t('recipe.difficultyExplanationTitle')"
    position="right"
    class="w-full! md:w-80! lg:w-120!"
    @show="toggleBodyOverflow"
    @hide="toggleBodyOverflow"
  >
    <div class="flex flex-col gap-4 text-left">
      <div
        v-for="difficulty in difficultyListTranslated"
        :key="difficulty.difficulty"
        class="flex flex-col gap-2"
        :class="{ 'selected-difficulty': difficulty.difficulty === difficultySelected }"
      >
        <h1 class="flex flex-row gap-1 items-center">
          <span class="text-lg font-bold">{{ difficulty.title }}</span>
          <template
            v-for="star in [...Array(difficulty.difficulty).keys()]"
            :key="star"
          >
            <NuxtIcon
              name="icon-park-twotone:chef-hat-one"
              class="text-lg"
            />
          </template>
        </h1>
        <p class="text-sm text-gray-500">{{ difficulty.description }}</p>
        <p class="text-sm text-gray-500">{{ difficulty.explanation }}</p>
      </div>
    </div>
  </Drawer>
</template>
<style scoped lang="scss">
.selected-difficulty {
  font-weight: bold;
  color: var(--color-yellow-600);

  > h1 {
    border-bottom: 0.15rem solid var(--color-yellow-600);
  }
}
</style>