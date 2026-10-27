<script setup lang="ts">
  import type { RecipeCarouselImage } from "./GallerySlide.vue"

  const { images, showRemove = false, disabled = false } = defineProps<{
    images: RecipeCarouselImage[]
    showRemove?: boolean
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    remove: [index: number, event: Event]
  }>()

  const { t } = useI18n()

  const showNavigators = computed(() => images.length > 1)
  const singleImage = computed(() => (images.length === 1 ? images[0] : undefined))

  const handleRemove = (event: Event, index: number) => {
    if (disabled) return

    event.preventDefault()
    event.stopPropagation()
    emit("remove", index, event)
  }
</script>

<template>
  <div
    v-if="singleImage"
    class="relative h-80 w-full overflow-hidden rounded shadow-md"
  >
    <RecipeGallerySlide :image="singleImage" />
    <Button
      v-if="showRemove"
      v-tooltip.top="t('upload.removeImage')"
      rounded
      type="button"
      class="absolute! z-10 bottom-2 right-2"
      :aria-label="t('upload.removeImage')"
      :disabled="disabled"
      @click="handleRemove($event, 0)"
    >
      <i class="pi pi-trash" />
    </Button>
  </div>
  <Carousel
    v-else-if="images.length > 0"
    :slides-per-page="1"
    :loop="showNavigators"
    class="w-full"
  >
    <CarouselContent class="h-80">
      <CarouselItem
        v-for="(image, index) in images"
        :key="image.key"
      >
        <div class="relative h-80 w-full overflow-hidden rounded shadow-md">
          <RecipeGallerySlide :image="image" />
          <Button
            v-if="showRemove"
            v-tooltip.top="t('upload.removeImage')"
            rounded
            type="button"
            class="absolute! z-10 bottom-2 right-2"
            :aria-label="t('upload.removeImage')"
            :disabled="disabled"
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
