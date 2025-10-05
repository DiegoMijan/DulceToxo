<script setup lang="ts">
const { recipe } = defineProps<{
  recipe: Recipe
}>()

const { t } = useI18n()
</script>

<template>
  <div class="w-full h-full pl-6 pr-6">
    <section class="flex flex-col gap-4 mb-8 text-center">
      <h1 class="title text-5xl font-bold">{{ recipe.title }}</h1>
      <p class="sub-title flex flex-row gap-3 text-sm justify-center">
        <span
          class="separator-right pr-3"
        >
          {{ t("recipe.prepTime", { time: recipe.prepTime }) }}
        </span>
        <span
          class="separator-right pr-3"
        >
          {{ t("recipe.cookTime", { time: recipe.cookTime }) }}
        </span>
        <span class="flex flex-row gap-2 justify-center cursor-pointer">
          {{ t("recipe.difficulty") }}<Rating
            disabled
            :stars="recipe.difficulty"
          >
            <template #onicon>
              <NuxtIcon
                name="icon-park-twotone:chef-hat-one"
              />
            </template>
            <template #officon>
              <NuxtIcon
                class="text-lg"
                name="icon-park-twotone:chef-hat-one"
              />
            </template>
          </Rating>
        </span>
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.separator-right {
  border-right: 2px solid white !important;
  border-right-color: #ffffff !important;
}
</style>