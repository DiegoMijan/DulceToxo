<script setup lang="ts">
  const { recipe } = defineProps<{
    recipe: Recipe
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()

  const difficultyDrawerVisible = ref(false)
  const images = ref<{ src: string; alt: string }[]>([
    {
      src: "/img/ejemplo_receta.jpg",
      alt: "Brownie",
    },
    {
      src: "/img/ejemplo_receta.jpg",
      alt: "Brownie",
    },
  ])

  const goToEdit = () => {
    navigateTo(localePath(`/edit/${recipe.id}`))
  }
</script>

<template>
  <div class="w-full h-full pl-10 pr-10 overflow-auto text-center">
    <section class="flex flex-col gap-4 mb-10 text-center">
      <h1 class="title text-5xl font-bold flex flex-row gap-2 items-center justify-center">
        {{ recipe.title }}
      </h1>
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
        <span
          v-tooltip.top="$t('recipe.difficultyTooltip')"
          class="flex flex-row gap-2 justify-center cursor-pointer"
          @click="difficultyDrawerVisible = true"
        >
          {{ t("recipe.difficulty") }}
          <Rating
            disabled
            :stars="recipe.difficulty"
          >
            <template #onicon>
              <NuxtIcon
                class="text-lg"
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
      <Carousel
        :value="images"
        :num-visible="1"
        :num-scroll="1"
        orientation="horizontal"
      >
        <template #item="{ data }">
          <Image
            :src="data.src"
            :alt="data.alt"
            class="mt-4 rounded w-full"
            image-class="rounded w-full"
            image-style="height: 320px !important; object-fit: cover;"
            preview
          />
        </template>
      </Carousel>
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
    <RecipeDifficultyDrawer
      v-model:visible="difficultyDrawerVisible"
      :difficulty-selected="recipe.difficulty"
    />
  </div>
  <div
    v-tooltip.top="t('recipe.edit.button')"
    class="absolute bottom-10 right-10"
  >
    <Button
      icon="pi pi-pencil"
      rounded
      size="large"
      :aria-label="t('recipe.edit.button')"
      @click="goToEdit"
    />
  </div>
</template>

<style scoped lang="scss">
.separator-right {
  border-right: 2px solid white !important;
  border-right-color: white !important;
}
</style>