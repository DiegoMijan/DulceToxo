<script setup lang="ts">
import brownie from "@/../public/img/brownie.webp"
import darBrownie from "@/../public/img/dark_brownie.webp"

const cardKeys: Record<string, string> = {
  cupcakes: "cupcakes",
  cookies: "cookies",
  cheesecakes: "cheesecakes",
  spongeCakes: "spongeCakes",
  brownies: "brownies",
  coldCakes: "coldCakes",
} as const

const { t } = useI18n()
const categoriesStore = useCategories()
const { categoriesByLocale } = storeToRefs(categoriesStore)

await categoriesStore.getCategories()

const isModalOpen = ref(false)

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const resolveCategoryUrlName = (cardKey: string, title: string): string => {
  const byName = categoriesStore.getCategoryUrlNameByLocalizedName(title)
  if (byName) return byName

  return (
    categoriesByLocale.value.find((category) => category.id === toKebabCase(cardKey))?.url_name ??
    ""
  )
}

const cards = ref([
  {
    key: "cupcakes",
    darkIcon: "twemoji:cupcake",
    icon: "fluent-emoji:cupcake",
  },
  {
    key: cardKeys.cookies,
    darkIcon: "unjs:cookie-es",
    icon: "twemoji:cookie",
  },
  {
    key: cardKeys.cheesecakes,
    icon: "noto:shortcake",
    darkIcon: "emojione:shortcake",
  },
  {
    key: cardKeys.spongeCakes,
    icon: "logos:cakephp-icon",
    darkIcon: "streamline-emojis:birthday-cake-3",
  },
  {
    key: cardKeys.brownies,
    icon: brownie,
    darkIcon: darBrownie,
    isImage: true,
  },
  {
    key: cardKeys.coldCakes,
    icon: "emojione-v1:shortcake",
    darkIcon: "streamline-emojis:shortcake-1",
  },
])

const translateCards = computed(() =>
  cards.value.map((card) => {
    const title = t(`landing.${card.key}.title`)
    return {
      ...card,
      title,
      description: t(`landing.${card.key}.description`),
      urlName: resolveCategoryUrlName(card.key, title),
    }
  }),
)
</script>

<template>
  <main class="flex justify-center py-8">
    <div class="max-w-[100ch] flex flex-col gap-7">
      <LazyLandingProfile @toggle-modal="isModalOpen = $event as boolean" />
      <div class="grid md:grid-cols-2 gap-10 sm:grid-cols-1 lg:px-0 px-4">
        <LandingCard
          v-for="{ description, icon, title, darkIcon, isImage, key, urlName } in translateCards"
          :key
          :description
          :icon
          :dark-icon
          :title
          :url-name="urlName"
          :is-modal-open="isModalOpen"
        >
          <template #icon="{ calculatedIcon }">
            <NuxtIcon
              v-if="!isImage"
              :name="calculatedIcon"
            />
            <img
              v-else
              :src="calculatedIcon"
              :alt="key"
              height="24"
              width="24"
            >
          </template>
        </LandingCard>
      </div>
    </div>
  </main>
</template>
