<script setup lang="ts">
  import type { RecipeDetail } from "~/stores/recipes"
  import type { LocaleKey } from "~/../../shared/types/Recipe.d.ts"

  const { recipe } = defineProps<{
    recipe: RecipeDetail
  }>()

  const { t, locale } = useI18n()

  const currentLocale = computed(() => locale.value as LocaleKey)

  const localeData = computed(() => recipe.locales[currentLocale.value])
  const ingredients = computed(() => recipe.ingredients[currentLocale.value] || [])
  const steps = computed(() => recipe.steps[currentLocale.value] || [])

  const difficultyDrawerVisible = ref(false)
  const { isLoggedIn } = useAuth()

  const images = computed(() => {
    const title = localeData.value?.title || t("upload.imageFallback")
    if (recipe.images.length === 0) {
      return [
        {
          key: "placeholder",
          src: "/img/ejemplo_receta.jpg",
          alt: title,
        },
      ]
    }
    return recipe.images.map((img) => ({
      key: img.id,
      publicId: img.public_id,
      alt: title,
    }))
  })

  const { downloadRecipePdf } = useRecipePdf()
  const categoriesStore = useCategories()
  const { categoriesByLocale } = storeToRefs(categoriesStore)

  const categoryName = computed(
    () =>
      categoriesByLocale.value.find((category) => category.id === recipe.category_id)?.name ?? "",
  )

  const downloadPdf = async () => {
    const recipeForPdf = {
      id: recipe.id,
      title: localeData.value?.title || "",
      description: localeData.value?.description || "",
      ingredients: ingredients.value.map((ing) => ({
        id: ing.id,
        description: ing.description,
        order: ing.order,
        is_heading: ing.is_heading ?? false,
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
      category: categoryName.value || recipe.category_id,
    }
    await downloadRecipePdf(
      recipeForPdf,
      {
        prepTime: t("recipe.prepTime", { time: recipe.prep_time }),
        cookTime: t("recipe.cookTime", { time: recipe.cook_time }),
        difficulty: t("recipe.difficulty"),
        ingredients: t("recipe.edit.form.ingredients"),
        instructions: t("recipe.edit.form.instructions"),
      },
      recipe.images,
    )
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
      <div class="sub-title flex flex-row flex-wrap gap-3 text-sm justify-center items-center">
        <span class="separator-right pr-3">
          {{ t("recipe.prepTime", { time: recipe.prep_time }) }}
        </span>
        <span class="separator-right pr-3">
          {{ t("recipe.cookTime", { time: recipe.cook_time }) }}
        </span>
        <span
          v-tooltip.top="$t('recipe.difficultyTooltip')"
          class="separator-right pr-3 flex flex-row gap-2 justify-center cursor-pointer"
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
        <RecipeRatingSummary
          :rating-avg="recipe.rating_avg"
          :rating-count="recipe.rating_count"
          :prompt-login="!isLoggedIn"
        />
      </div>
      <RecipeRatingVote
        v-if="isLoggedIn"
        :recipe-id="recipe.id"
        :my-rating="recipe.my_rating"
      />
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
      <RecipeImageCarousel
        class="mt-4"
        :images="images"
      />
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
            v-for="(ingredient, index) in ingredients"
            :key="ingredient.id"
            :class="[
              'flex flex-row gap-2 items-start text-left',
              { 'mt-4': ingredient.is_heading && index > 0 },
            ]"
          >
            <NuxtIcon
              v-if="!ingredient.is_heading"
              name="emojione-v1:sparkles"
              class="text-xl shrink-0"
            />
            <span
              :class="[
                'text-md',
                ingredient.is_heading
                  ? 'font-caveat font-semibold text-[1.5rem] leading-snug tracking-wide uppercase text-french-lilac-700 dark:text-french-lilac-300'
                  : '',
              ]"
            >
              {{ ingredient.description }}
            </span>
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
            class="flex flex-row gap-3 items-start text-left"
          >
            <Badge
              :value="index + 1"
              class="shrink-0 mt-0.5"
            />
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
  <RecipeAdminActions
    :recipe-id="recipe.id"
    :category-id="recipe.category_id"
    :recipe-title="localeData?.title || ''"
  />
</template>

<style scoped lang="scss">
  .separator-right {
    border-right: 2px solid white !important;
    border-right-color: white !important;
  }
</style>
