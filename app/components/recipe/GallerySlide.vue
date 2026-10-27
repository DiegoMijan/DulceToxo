<script setup lang="ts">
  export interface RecipeCarouselImage {
    key: string
    publicId?: string
    src?: string
    alt: string
  }

  const { image } = defineProps<{
    image: RecipeCarouselImage
  }>()

  const { t } = useI18n()
</script>

<template>
  <Gallery class="relative h-80 w-full overflow-hidden rounded">
    <GalleryContent class="h-80 w-full">
      <GalleryItem>
        <NuxtImg
          v-if="image.publicId"
          provider="cloudinary"
          :src="image.publicId"
          :alt="image.alt"
          width="800"
          height="320"
          fit="cover"
          class="max-h-80 h-80 w-full rounded object-cover"
        />
        <NuxtImg
          v-else-if="image.src"
          :src="image.src"
          :alt="image.alt"
          width="800"
          height="320"
          fit="cover"
          class="max-h-80 h-80 w-full rounded object-cover"
        />
      </GalleryItem>
    </GalleryContent>
    <GalleryHeader class="pointer-events-none absolute! inset-x-0 top-0 z-10 flex justify-end bg-transparent! p-2!">
      <GalleryFullScreen
        v-slot="{ isFullscreen }"
        class="pointer-events-auto"
        :aria-label="isFullscreen ? t('upload.collapseImage') : t('upload.expandImage')"
      >
        <i :class="isFullscreen ? 'pi pi-times' : 'pi pi-search-plus'" />
      </GalleryFullScreen>
    </GalleryHeader>
  </Gallery>
</template>
