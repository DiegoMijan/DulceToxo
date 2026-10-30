<script setup lang="ts">
  import type { FileUploadUploaderEvent } from "primevue/fileupload"
  import { RECIPE_UPLOAD_ACCEPT, RECIPE_UPLOAD_MAX_BYTES } from "~/composables/useRecipeUploads"

  const emit = defineEmits<{
    change: []
  }>()

  const publicIds = defineModel<string[]>("publicIds", { required: true })

  const { persistedPublicIds = [], disabled = false } = defineProps<{
    persistedPublicIds?: string[]
    disabled?: boolean
  }>()

  const confirm = useConfirm()
  const { t } = useI18n()
  const { uploadImage, deleteUpload } = useRecipeUploads()
  const fileUploadRef = useTemplateRef<{ clear: () => void }>("fileUploadRef")
  const uploading = ref(false)
  const sessionPublicIds = ref<string[]>([])

  const carouselImages = computed(() =>
    publicIds.value.map((publicId, index) => ({
      key: publicId,
      publicId,
      alt: t("upload.imageAlt", { n: index + 1 }),
    })),
  )

  const isSessionUpload = (publicId: string) =>
    sessionPublicIds.value.includes(publicId) && !persistedPublicIds.includes(publicId)

  const markSessionPersisted = () => {
    sessionPublicIds.value = []
  }

  const discardSessionUploads = async () => {
    const ids = [...sessionPublicIds.value]
    sessionPublicIds.value = []
    await Promise.all(ids.map((id) => deleteUpload(id)))
  }

  const addUploadedImage = (publicId: string) => {
    if (publicIds.value.includes(publicId)) return
    publicIds.value = [...publicIds.value, publicId]
    sessionPublicIds.value = [...sessionPublicIds.value, publicId]
    emit("change")
  }

  const uploadSelectedFiles = async (files: File[]) => {
    for (const file of files) {
      const result = await uploadImage(file)
      if (result) addUploadedImage(result.public_id)
    }
  }

  const handleUploader = async (event: FileUploadUploaderEvent) => {
    if (disabled) return

    const files = Array.isArray(event.files) ? event.files : [event.files]
    uploading.value = true

    try {
      await uploadSelectedFiles(files)
    } finally {
      uploading.value = false
      fileUploadRef.value?.clear()
    }
  }

  const removeAt = async (index: number) => {
    const publicId = publicIds.value[index]
    if (!publicId) return

    publicIds.value = publicIds.value.filter((_, i) => i !== index)
    emit("change")

    if (!isSessionUpload(publicId)) return

    sessionPublicIds.value = sessionPublicIds.value.filter((id) => id !== publicId)
    await deleteUpload(publicId)
  }

  // La principal es la primera: se mueve al principio y el resto mantiene su orden
  const handleSetMain = (index: number) => {
    if (disabled || index <= 0) return
    const publicId = publicIds.value[index]
    if (!publicId) return
    publicIds.value = [publicId, ...publicIds.value.filter((_, i) => i !== index)]
    emit("change")
  }

  const handleRemove = (index: number, event: Event) => {
    if (disabled) return

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: t("upload.confirmDelete"),
      icon: "pi pi-info-circle",
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("common.delete"),
        severity: "danger",
      },
      accept: () => {
        void removeAt(index)
      },
    })
  }

  const handleRemoveAll = (event: Event) => {
    if (disabled) return

    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: t("upload.confirmDeleteAll"),
      icon: "pi pi-info-circle",
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("common.delete"),
        severity: "danger",
      },
      accept: () => {
        void removeAllImages()
      },
    })
  }

  const removeAllImages = async () => {
    const idsToDelete = publicIds.value.filter((id) => isSessionUpload(id))
    publicIds.value = []
    sessionPublicIds.value = []
    emit("change")
    await Promise.all(idsToDelete.map((id) => deleteUpload(id)))
  }

  onBeforeUnmount(() => {
    void discardSessionUploads()
  })

  defineExpose({
    discardSessionUploads,
    markSessionPersisted,
  })
</script>

<template>
  <div
    class="card flex flex-col"
    :class="{ 'gap-4': publicIds.length > 0 }"
  >
    <div class="flex flex-wrap gap-3">
      <FileUpload
        ref="fileUploadRef"
        mode="basic"
        custom-upload
        auto
        :multiple="true"
        severity="secondary"
        class="p-button-outlined [&_.p-button]:whitespace-nowrap"
        :max-file-size="RECIPE_UPLOAD_MAX_BYTES"
        :accept="RECIPE_UPLOAD_ACCEPT"
        :choose-label="t('upload.chooseImages')"
        :disabled="uploading || disabled"
        :invalid-file-type-message="t('upload.invalidType')"
        :invalid-file-size-message="t('upload.tooLarge')"
        @uploader="handleUploader"
      />
      <Button
        type="button"
        :disabled="publicIds.length === 0 || uploading || disabled"
        severity="danger"
        outlined
        class="whitespace-nowrap"
        @click="handleRemoveAll($event)"
      >
        <i class="pi pi-trash mr-2" />
        {{ t('upload.removeAllImages') }}
      </Button>
    </div>
    <p
      v-if="uploading"
      class="text-sm text-surface-500"
    >
      {{ t('upload.uploading') }}
    </p>
    <RecipeImageCarousel
      :images="carouselImages"
      show-remove
      show-main
      :disabled="disabled"
      @remove="handleRemove"
      @set-main="handleSetMain"
    />
  </div>
</template>
