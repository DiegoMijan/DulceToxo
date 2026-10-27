<script setup lang="ts">
  export interface RecipeCarouselImage {
    key: string
    publicId?: string
    src?: string
    alt: string
  }

  const { images, showRemove = false } = defineProps<{
    images: RecipeCarouselImage[]
    showRemove?: boolean
  }>()

  const emit = defineEmits<{
    remove: [index: number, event: Event]
  }>()

  const { t } = useI18n()

  const showNavigators = computed(() => images.length > 1)

  const handleRemove = (event: Event, index: number) => {
    event.preventDefault()
    event.stopPropagation()
    emit("remove", index, event)
  }
</script>

<template>
  <Carousel
    v-if="images.length > 0"
    :slides-per-page="1"
    :loop="showNavigators"
    class="w-full"
  >
    <CarouselContent class="h-80">
      <CarouselItem
        v-for="(image, index) in images"
        :key="image.key"
      >
        <div class="relative h-80 w-full">
          <Gallery class="h-80 w-full">
            <GalleryContent>
              <GalleryItem>
                <NuxtImg
                  v-if="image.publicId"
                  provider="cloudinary"
                  :src="image.publicId"
                  :alt="image.alt"
                  width="800"
                  height="320"
                  fit="cover"
                  class="max-h-80 w-full rounded object-cover shadow-md"
                />
                <NuxtImg
                  v-else-if="image.src"
                  :src="image.src"
                  :alt="image.alt"
                  width="800"
                  height="320"
                  fit="cover"
                  class="max-h-80 w-full rounded object-cover shadow-md"
                />
              </GalleryItem>
            </GalleryContent>
          </Gallery>
          <Button
            v-if="showRemove"
            v-tooltip.top="t('upload.removeImage')"
            rounded
            type="button"
            class="absolute! z-10 bottom-2 right-2"
            :aria-label="t('upload.removeImage')"
            @click="handleRemove($event, index)"
          >
            <i class="pi pi-trash" />
          </Button>
        </div>
      </CarouselItem>
    </CarouselContent>
    <div
      v-if="showNavigators"
      class="mt-4 flex justify-end gap-2"
    >
      <CarouselPrev
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-surface-200 bg-surface-0 text-surface-500 transition-opacity hover:opacity-75 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
        :aria-label="t('upload.previousImage')"
      >
        <i class="pi pi-chevron-left" />
      </CarouselPrev>
      <CarouselNext
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-surface-200 bg-surface-0 text-surface-500 transition-opacity hover:opacity-75 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
        :aria-label="t('upload.nextImage')"
      >
        <i class="pi pi-chevron-right" />
      </CarouselNext>
    </div>
  </Carousel>
</template>
