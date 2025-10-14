<script setup lang="ts">
import Image from "primevue/image"

const { recipe } = defineProps<{
  recipe: Recipe
}>()

const { t } = useI18n()
</script>

<template>
  <div class="w-full h-full pl-10 pr-10 overflow-auto text-center">
    <section class="flex flex-col gap-4 mb-10 text-center">
      <h1 class="title text-5xl font-bold ">{{ recipe.title }}</h1>
      <p class="sub-title flex flex-row gap-3 text-sm justify-center">
        <span
          class="separator-right  pr-3"
        >
          {{ t("recipe.prepTime", { time: recipe.prepTime }) }}
        </span>
        <span
          class="separator-right  pr-3"
        >
          {{ t("recipe.cookTime", { time: recipe.cookTime }) }}
        </span>
        <span class="flex flex-row gap-2 justify-center cursor-pointer ">
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
      <Image
        src="/img/ejemplo_receta.jpg"
        alt="Brownie"
        image-class="rounded w-full mt-4"
        image-style="height: 360px !important; object-fit: cover;"
        preview
      />
    </section>
    <section class="flex gap-4">
      <div class="flex flex-1 flex-col gap-4">
        <h2 class="title text-3xl text-left">Ingredientes</h2>
        <div class="flex flex-col gap-4">
          <div
            v-for="ingredient in recipe.ingredients"
            :key="ingredient.id"
            class="flex flex-row gap-2 items-center"
          >
            <NuxtIcon
              name="emojione-v1:sparkles"
              class="text-xl"
            />
            <span class="text-md">{{ ingredient.description }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-2 flex-col gap-4">
        <h2 class="title text-3xl text-left">Instrucciones</h2>
        <div class="flex flex-col gap-4">
          <div
            v-for="instruction, index in recipe.instructions"
            :key="instruction.id"
            class="flex flex-row gap-2 items-center"
          >
            <Badge :value="index + 1" />
            <span class="text-md">{{ instruction.description }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.separator-right {
  border-right: 2px solid white !important;
  border-right-color: #ffffff !important;
}
</style>