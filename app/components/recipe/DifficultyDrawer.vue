<script setup lang="ts">
const { difficultySelected } = defineProps<{
  difficultySelected: number
}>()

const visible = defineModel<boolean>("visible", { required: true })
const { t } = useI18n()

const difficultyList = [1, 2, 3, 4, 5]
const difficultyListTranslated = computed(() =>
  difficultyList.map((difficulty) => ({
    difficulty,
    title: t(`recipe.difficultyExplanation.${difficulty}.title`),
    description: t(`recipe.difficultyExplanation.${difficulty}.description`),
    explanation: t(`recipe.difficultyExplanation.${difficulty}.explanation`),
  })),
)
</script>

<template>
  <Drawer
    v-model:visible="visible"
    :header="$t('recipe.difficultyExplanationTitle')"
  >
    <div class="flex flex-col gap-4">
      <div
        v-for="difficulty in difficultyListTranslated"
        :key="difficulty.difficulty"
        class="flex flex-col gap-2"
        :class="{ 'bg-gray-100': difficulty.difficulty === difficultySelected }"
      >
        <h1>{{ difficulty.title }}</h1>
        <p class="text-sm text-gray-500">{{ difficulty.description }}</p>
        <p class="text-sm text-gray-500">{{ difficulty.explanation }}</p>
      </div>
    </div>
  </Drawer>
</template>