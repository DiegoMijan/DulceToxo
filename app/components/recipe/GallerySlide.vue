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

  // Cloudinary `effect` maps to `e_` (https://image.nuxt.com/providers/cloudinary).
  // `effect: "blur:2000"` becomes `e_blur:2000` (blur strength 1-2000).
  const backdropModifiers = { effect: "blur:2000" }
</script>

<template>
  <Gallery class="relative h-80 w-full overflow-hidden rounded">
    <div
      v-if="image.publicId || image.src"
      class="gallery-slide-backdrop pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <NuxtImg
        v-if="image.publicId"
        provider="cloudinary"
        :src="image.publicId"
        alt=""
        width="400"
        :modifiers="backdropModifiers"
        class="absolute inset-0 h-full w-full scale-110 object-cover"
      />
      <NuxtImg
        v-else-if="image.src"
        :src="image.src"
        alt=""
        width="400"
        class="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
      />
      <div class="absolute inset-0 bg-black/40" />
    </div>
    <GalleryContent class="h-80 w-full">
      <GalleryItem>
        <NuxtImg
          v-if="image.publicId"
          provider="cloudinary"
          :src="image.publicId"
          :alt="image.alt"
          width="1600"
          fit="coverLimit"
          class="max-h-80 h-80 w-full rounded object-contain"
        />
        <NuxtImg
          v-else-if="image.src"
          :src="image.src"
          :alt="image.alt"
          width="800"
          height="320"
          fit="contain"
          class="max-h-80 h-80 w-full rounded object-contain"
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
  /* Gallery fija width/height inline al montar: si el contenedor crece despues (por ejemplo al llegar desde
     la lista) la imagen se queda pequena y pegada a la izquierda. Siempre ocupa todo el hueco. */
  :deep(.p-gallery-item[data-active]) {
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
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
    object-fit: contain;
  }

  /* En pantalla completa, la foto entera y centrada */
  .p-gallery[data-fullscreen] :deep(.p-gallery-item > *) {
    object-fit: contain;
    border-radius: 0;
  }

  /* Backdrop stays outside .p-gallery-item so Gallery zoom does not transform it. */
  .p-gallery[data-fullscreen] .gallery-slide-backdrop {
    display: none;
  }
</style>
