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
        class="pointer-events-auto rounded-full bg-black/50 text-white"
        :aria-label="t('upload.expandImage')"
      >
        <template #default="{ isFullscreen }">
          <i :class="isFullscreen ? 'pi pi-times' : 'pi pi-search-plus'" />
        </template>
      </GalleryFullScreen>
    </GalleryHeader>
  </Gallery>
</template>

<style scoped>
  :deep(.p-gallery-item[data-active]) {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translate(var(--px-position-x), var(--px-position-y))
      scale(var(--px-scale))
      rotate(var(--px-rotation))
      scaleX(var(--px-flip-x))
      scaleY(var(--px-flip-y));
  }

  :deep(.p-gallery-item > *) {
    width: 100% !important;
    height: 100% !important;
    max-height: none !important;
    object-fit: cover;
  }
</style>
