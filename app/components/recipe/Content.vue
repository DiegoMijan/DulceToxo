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
  const { addRecipeView } = useRecentRecipes()
  const { categoriesByLocale } = storeToRefs(categoriesStore)

  watch(
    () => recipe.id,
    () => {
      addRecipeView(recipe)
    },
    { immediate: true },
  )

  const categoryName = computed(
    () =>
      categoriesByLocale.value.find((category) => category.id === recipe.category_id)?.name ?? "",
  )

  const paddedStepNumber = (index: number): string => String(index + 1).padStart(2, "0")

  const handleDownloadPdf = async () => {
    await downloadRecipePdf(
      recipeDetailToPdfRecipe(
        recipe,
        currentLocale.value,
        categoryName.value || recipe.category_id,
      ),
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
      <h1
        class="title text-5xl font-bold flex flex-row gap-2 items-center justify-center"
        data-testid="recipe-title"
      >
        {{ localeData?.title }}
      </h1>
      <RecipeHeaderBar
        :recipe="recipe"
        :is-logged-in="isLoggedIn"
        @download-pdf="handleDownloadPdf"
      />
      <div data-testid="recipe-gallery">
        <RecipeImageCarousel :images="images" />
      </div>
      <p
        v-if="localeData?.description"
        class="text-surface-400 text-lg max-w-2xl mx-auto"
      >
        {{ localeData.description }}
      </p>
    </section>
    <section class="flex flex-col gap-10 lg:flex-row lg:gap-12">
      <div class="flex min-w-0 flex-1 flex-col">
        <RecipeSectionTitle :title="t('recipe.edit.form.ingredients')" />
        <p
          v-if="ingredients.length === 0"
          class="content text-left text-surface-500"
        >
          {{ t("common.empty") }}
        </p>
        <ul
          v-else
          class="flex flex-col gap-[10px]"
        >
          <li
            v-for="(ingredient, index) in ingredients"
            :key="ingredient.id"
            :class="[
              'flex flex-row items-start gap-2.5 text-left',
              { 'mt-3': ingredient.is_heading && index > 0 },
            ]"
          >
            <NuxtIcon
              v-if="!ingredient.is_heading"
              name="emojione-v1:sparkles"
              class="mt-0.5 shrink-0 text-sm"
            />
            <span
              :class="
                ingredient.is_heading
                  ? 'font-caveat font-semibold text-[20px] leading-snug tracking-wide uppercase text-french-lilac-700 dark:text-french-lilac-300'
                  : 'sub-title text-[15px] leading-relaxed'
              "
            >
              {{ ingredient.description }}
            </span>
          </li>
        </ul>
      </div>
      <div class="flex min-w-0 flex-2 flex-col">
        <RecipeSectionTitle :title="t('recipe.edit.form.instructions')" />
        <p
          v-if="steps.length === 0"
          class="content text-left text-surface-500"
        >
          {{ t("common.empty") }}
        </p>
        <ol
          v-else
          class="flex list-none flex-col gap-5"
        >
          <li
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex flex-row items-start gap-4 text-left"
          >
            <span
              class="title w-10 shrink-0 text-2xl leading-none text-french-lilac-500 dark:text-french-lilac-400"
              aria-hidden="true"
            >
              {{ paddedStepNumber(index) }}
            </span>
            <span class="sub-title pt-1 text-[15px] leading-relaxed">{{ step.description }}</span>
          </li>
        </ol>
      </div>
    </section>
    <section
      v-if="isLoggedIn"
      class="mt-12 flex flex-col items-center border-t border-stone-200 pt-8 dark:border-stone-700"
    >
      <RecipeRatingVote
        :recipe-id="recipe.id"
        :my-rating="recipe.my_rating"
      />
    </section>
  </div>
  <RecipeAdminActions
    :recipe-id="recipe.id"
    :category-id="recipe.category_id"
    :recipe-title="localeData?.title || ''"
  />
</template>
