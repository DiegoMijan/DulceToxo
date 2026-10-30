<script setup lang="ts">
  import type { RecipeCarouselImage } from "./GallerySlide.vue"

  const { images, showRemove = false, showMain = false, disabled = false } = defineProps<{
    images: RecipeCarouselImage[]
    showRemove?: boolean
    // Edicion: estrella para elegir la foto principal (la primera del orden)
    showMain?: boolean
    disabled?: boolean
  }>()

  const emit = defineEmits<{
    remove: [index: number, event: Event]
    setMain: [index: number]
  }>()

  const { t } = useI18n()

  const showNavigators = computed(() => images.length > 1)
  const singleImage = computed(() => (images.length === 1 ? images[0] : undefined))

  const handleRemove = (event: Event, index: number) => {
    if (disabled) return
    emit("remove", index, event)
  }

  const currentSlide = ref<number | null>(null)

  const handleSetMain = async (index: number) => {
    if (disabled || index === 0) return
    emit("setMain", index)
    // Vuelve a la foto marcada, que ahora es la primera. La navegacion con flechas no siempre
    // actualiza el v-model, asi que se fuerza el cambio null -> 0 para que el carrusel se mueva.
    currentSlide.value = null
    await nextTick()
    currentSlide.value = 0
  }

  const handleRemovePointerDown = (event: PointerEvent) => {
    event.stopPropagation()
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
      @pointerdown="handleRemovePointerDown"
      @click="handleRemove($event, 0)"
    >
      <i class="pi pi-trash" />
    </Button>
  </div>
  <Carousel
    v-else-if="images.length > 0"
    v-model:page="currentSlide"
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
          <span
            v-if="showMain && index === 0"
            class="absolute z-10 top-2 left-2 rounded-full bg-french-lilac-600 px-3 py-1 text-xs font-semibold text-white shadow"
            data-testid="upload-main-badge"
          >
            {{ t('upload.mainImage') }}
          </span>
          <Button
            v-if="showMain"
            v-tooltip.top="index === 0 ? t('upload.mainImage') : t('upload.setMainImage')"
            rounded
            type="button"
            :severity="index === 0 ? undefined : 'secondary'"
            class="absolute! z-10 bottom-2 left-2"
            :aria-label="index === 0 ? t('upload.mainImage') : t('upload.setMainImage')"
            :aria-pressed="index === 0"
            :disabled="disabled"
            data-testid="upload-set-main"
            @pointerdown="handleRemovePointerDown"
            @click="handleSetMain(index)"
          >
            <i :class="index === 0 ? 'pi pi-star-fill' : 'pi pi-star'" />
          </Button>
          <Button
            v-if="showRemove"
            v-tooltip.top="t('upload.removeImage')"
            rounded
            type="button"
            class="absolute! z-10 bottom-2 right-2"
            :aria-label="t('upload.removeImage')"
            :disabled="disabled"
            @pointerdown="handleRemovePointerDown"
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
