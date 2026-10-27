<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"
  import type { LocaleKey } from "~/../../shared/types/Recipe.d.ts"

  const { recipe } = defineProps<{
    recipe: RecipeDetail
  }>()

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const { isAdmin } = useAuth()

  const currentLocale = computed(() => locale.value as LocaleKey)

  const localeData = computed(() => recipe.locales[currentLocale.value])
  const ingredients = computed(() => recipe.ingredients[currentLocale.value] || [])
  const steps = computed(() => recipe.steps[currentLocale.value] || [])

  const difficultyDrawerVisible = ref(false)

  const images = computed(() => {
    if (recipe.images.length === 0) {
      return [{ src: "/img/ejemplo_receta.jpg", alt: localeData.value?.title || "Recipe" }]
    }
    return recipe.images.map((img) => ({
      src: `https://res.cloudinary.com/dulcetoxo/image/upload/${img.public_id}`,
      alt: localeData.value?.title || "Recipe",
    }))
  })

  const goToEdit = () => {
    navigateTo(localePath(`/edit/${recipe.id}`))
  }

  const { downloadRecipePdf } = useRecipePdf()

  const downloadPdf = () => {
    const recipeForPdf = {
      id: recipe.id,
      title: localeData.value?.title || "",
      description: localeData.value?.description || "",
      ingredients: ingredients.value.map((ing) => ({
        id: ing.id,
        description: ing.description,
        order: ing.order,
      })),
      instructions: steps.value.map((step) => ({
        id: step.id,
        description: step.description,
        order: step.order,
      })),
      difficulty: recipe.difficulty as 1 | 2 | 3 | 4 | 5,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      createdAt: new Date(recipe.created_at),
      updatedAt: new Date(recipe.updated_at),
      category: recipe.category_id,
    }
    downloadRecipePdf(recipeForPdf, {
      prepTime: t("recipe.prepTime", { time: recipe.prep_time }),
      cookTime: t("recipe.cookTime", { time: recipe.cook_time }),
      difficulty: t("recipe.difficulty"),
      ingredients: t("recipe.edit.form.ingredients"),
      instructions: t("recipe.edit.form.instructions"),
    })
  }
</script>

<template>
  <div class="w-full h-full pl-10 pr-10 overflow-auto text-center">
    <section class="flex flex-col gap-4 mb-10 text-center">
      <h1 class="title text-5xl font-bold flex flex-row gap-2 items-center justify-center">
        {{ localeData?.title }}
      </h1>
      <p
        v-if="localeData?.description"
        class="text-surface-400 text-lg max-w-2xl mx-auto"
      >
        {{ localeData.description }}
      </p>
      <p class="sub-title flex flex-row gap-3 text-sm justify-center">
        <span class="separator-right pr-3">
          {{ t("recipe.prepTime", { time: recipe.prep_time }) }}
        </span>
        <span class="separator-right pr-3">
          {{ t("recipe.cookTime", { time: recipe.cook_time }) }}
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
      <Button
        severity="secondary"
        outlined
        size="small"
        class="self-center!"
        @click="downloadPdf"
      >
        <i class="pi pi-file-pdf mr-2" />
        {{ t("recipe.downloadPdf") }}
      </Button>
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
        <h2 class="title text-3xl text-left">
          {{ t("recipe.edit.form.ingredients") }}
        </h2>
        <div
          v-if="ingredients.length === 0"
          class="text-surface-500 text-left"
        >
          {{ t("common.empty") }}
        </div>
        <div
          v-else
          class="flex flex-col gap-4"
        >
          <div
            v-for="ingredient in ingredients"
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
        <h2 class="title text-3xl text-left">
          {{ t("recipe.edit.form.instructions") }}
        </h2>
        <div
          v-if="steps.length === 0"
          class="text-surface-500 text-left"
        >
          {{ t("common.empty") }}
        </div>
        <div
          v-else
          class="flex flex-col gap-4"
        >
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex flex-row gap-2 items-center"
          >
            <Badge :value="index + 1" />
            <span class="text-md">{{ step.description }}</span>
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
    v-if="isAdmin"
    v-tooltip.top="t('recipe.edit.button')"
    class="absolute bottom-10 right-10"
  >
    <Button
      rounded
      size="large"
      :aria-label="t('recipe.edit.button')"
      @click="goToEdit"
    >
      <i class="pi pi-pencil" />
    </Button>
  </div>
</template>

<style scoped lang="scss">
  .separator-right {
    border-right: 2px solid white !important;
    border-right-color: white !important;
  }
</style>
