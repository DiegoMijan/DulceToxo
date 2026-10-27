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

  type RecipeSectionsVariant = "a" | "b" | "c"
  // A is the implemented proposal. Switch to "b" or "c" only to compare screenshots.
  const RECIPE_SECTIONS_VARIANT: RecipeSectionsVariant = "a"

  const ingredientHeadingClass =
    "font-caveat font-semibold text-[20px] leading-snug tracking-wide uppercase text-french-lilac-700 dark:text-french-lilac-300"

  const sectionStyles = {
    a: {
      columns: "flex flex-col gap-10 lg:flex-row lg:gap-12",
      column: "flex min-w-0 flex-1 flex-col",
      instructionsColumn: "flex min-w-0 flex-2 flex-col",
      title: "title text-[1.75rem] tracking-wide text-left md:text-3xl",
      accent: "bar" as const,
      ingredientsList: "flex flex-col gap-[10px]",
      ingredientRow: "flex flex-row items-start gap-2.5 text-left",
      bullet: "dot" as const,
      ingredientText: "content text-[15px] leading-relaxed",
      stepsList: "relative flex flex-col gap-5",
      stepRow: "relative z-10 flex flex-row items-start gap-3 text-left",
      stepMarker: "filled-circle" as const,
      stepText: "content pt-0.5 text-[15px] leading-relaxed",
    },
    b: {
      columns: "flex flex-col gap-10 lg:flex-row lg:gap-12",
      column: "flex min-w-0 flex-1 flex-col",
      instructionsColumn: "flex min-w-0 flex-2 flex-col",
      title:
        "font-[Pacifico] text-[1.85rem] leading-tight text-left text-french-lilac-700 dark:text-french-lilac-300",
      accent: "dashed" as const,
      ingredientsList: "flex flex-col gap-[10px]",
      ingredientRow: "flex flex-row items-start gap-2.5 text-left",
      bullet: "sparkle" as const,
      ingredientText: "sub-title text-[15px] leading-relaxed",
      stepsList: "flex flex-col gap-5",
      stepRow: "flex flex-row items-start gap-4 text-left",
      stepMarker: "playfair-index" as const,
      stepText: "sub-title pt-1 text-[15px] leading-relaxed",
    },
    c: {
      columns: "flex flex-col gap-12 lg:flex-row lg:gap-14",
      column: "flex min-w-0 flex-1 flex-col",
      instructionsColumn: "flex min-w-0 flex-2 flex-col",
      title:
        "font-[Merriweather] text-left text-lg font-light uppercase tracking-[0.28em] text-french-lilac-800 dark:text-french-lilac-200",
      accent: "flourish" as const,
      ingredientsList: "flex flex-col gap-[10px]",
      ingredientRow: "flex flex-row items-start gap-3 text-left",
      bullet: "dash" as const,
      ingredientText: "content text-[15px] leading-relaxed text-surface-700 dark:text-surface-200",
      stepsList: "flex flex-col gap-5",
      stepRow: "flex flex-row items-start gap-3 text-left",
      stepMarker: "outline-circle" as const,
      stepText: "content pt-0.5 text-[15px] leading-relaxed",
    },
  } as const

  const sectionStyle = sectionStyles[RECIPE_SECTIONS_VARIANT]

  const paddedStepNumber = (index: number): string => String(index + 1).padStart(2, "0")

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
      category: recipe.category_id,
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
      <RecipeImageCarousel
        class="mt-4"
        :images="images"
      />
    </section>
    <section :class="sectionStyle.columns">
      <div :class="sectionStyle.column">
        <RecipeSectionTitle
          :title="t('recipe.edit.form.ingredients')"
          :title-class="sectionStyle.title"
          :accent="sectionStyle.accent"
        />
        <p
          v-if="ingredients.length === 0"
          class="content text-left text-surface-500"
        >
          {{ t("common.empty") }}
        </p>
        <ul
          v-else
          :class="sectionStyle.ingredientsList"
        >
          <li
            v-for="(ingredient, index) in ingredients"
            :key="ingredient.id"
            :class="[
              sectionStyle.ingredientRow,
              { 'mt-3': ingredient.is_heading && index > 0 },
            ]"
          >
            <span
              v-if="!ingredient.is_heading && sectionStyle.bullet === 'dot'"
              class="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-french-lilac-500"
              aria-hidden="true"
            />
            <NuxtIcon
              v-else-if="!ingredient.is_heading && sectionStyle.bullet === 'sparkle'"
              name="emojione-v1:sparkles"
              class="mt-0.5 shrink-0 text-sm"
            />
            <span
              v-else-if="!ingredient.is_heading && sectionStyle.bullet === 'dash'"
              class="mt-[0.7rem] h-px w-3 shrink-0 bg-french-lilac-400"
              aria-hidden="true"
            />
            <span
              :class="ingredient.is_heading ? ingredientHeadingClass : sectionStyle.ingredientText"
            >
              {{ ingredient.description }}
            </span>
          </li>
        </ul>
      </div>
      <div :class="sectionStyle.instructionsColumn">
        <RecipeSectionTitle
          :title="t('recipe.edit.form.instructions')"
          :title-class="sectionStyle.title"
          :accent="sectionStyle.accent"
        />
        <p
          v-if="steps.length === 0"
          class="content text-left text-surface-500"
        >
          {{ t("common.empty") }}
        </p>
        <ol
          v-else
          :class="['list-none', sectionStyle.stepsList]"
        >
          <li
            v-for="(step, index) in steps"
            :key="step.id"
            :class="sectionStyle.stepRow"
          >
            <span
              v-if="sectionStyle.stepMarker === 'filled-circle'"
              class="title flex size-7 shrink-0 items-center justify-center rounded-full bg-french-lilac-700 text-sm text-white dark:bg-french-lilac-400 dark:text-gray-950"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <span
              v-else-if="sectionStyle.stepMarker === 'playfair-index'"
              class="title w-10 shrink-0 text-2xl leading-none text-french-lilac-500 dark:text-french-lilac-400"
              aria-hidden="true"
            >
              {{ paddedStepNumber(index) }}
            </span>
            <span
              v-else
              class="title flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-french-lilac-500 text-sm text-french-lilac-700 dark:border-french-lilac-400 dark:text-french-lilac-300"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <span :class="sectionStyle.stepText">{{ step.description }}</span>
          </li>
        </ol>
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
