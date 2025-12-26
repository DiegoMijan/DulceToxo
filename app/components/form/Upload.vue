<script setup lang="ts">
  import type { FileUploadSelectEvent } from "primevue/fileupload"

  const emit = defineEmits<{
    change: []
  }>()

  const listSrcs = defineModel<string[]>("listSrcs", { required: true })

  const confirm = useConfirm()
  const { t } = useI18n()
  const carouselKey = ref(0)

  const onFileSelect = (event: FileUploadSelectEvent) => {
    const files = event.files as File[]

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!listSrcs.value.includes(e.target?.result as string)) {
          listSrcs.value.push(e.target?.result as string)
        }
      }
      reader.readAsDataURL(file)
      reader.onloadend = () => {
        emit("change")
      }
    })
  }

  const removeImage = async (index: number) => {
    listSrcs.value = listSrcs.value.filter((_, i) => i !== index)
    emit("change")
    carouselKey.value++
    if (listSrcs.value.length === 1) {
      carouselKey.value++
    }
  }

  const confirmDelete = (event: Event, index: number, fullRemove = false) => {
    confirm.require({
      target: event.currentTarget as HTMLElement,
      message: fullRemove ? t("upload.confirmDeleteAll") : t("upload.confirmDelete"),
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
        if (fullRemove) {
          listSrcs.value = []
          carouselKey.value++
          return
        }
        removeImage(index)
      },
    })
  }
</script>
<template>
  <div
    class="card flex flex-col "
    :class="{ 'gap-4': listSrcs.length > 0 }"
  >
    <div class="flex gap-4">
      <FileUpload
        mode="basic"
        custom-upload
        auto
        :multiple="true"
        severity="secondary"
        class="p-button-outlined"
        :max-file-size="5242880"
        :accept="'.jpg, .jpeg, .png, .gif, .bmp, .webp'"
        :choose-label="t('upload.chooseImages')"
        @select="onFileSelect"
      />
      <Button
        :disabled="listSrcs.length === 0"
        icon="pi pi-trash"
        severity="danger"
        :label="t('upload.removeAllImages')"
        outlined
        @click="confirmDelete($event, 0, true)"
      />
    </div>
    <Carousel
      :key="carouselKey"
      :value="listSrcs"
      :num-visible="1"
      :num-scroll="1"
      orientation="horizontal"
      class="px-4"
      circular
      :show-navigators="listSrcs.length > 1"
    >
      <template #item="{ data, index }">
        <Image
          :src="data"
          :alt="`Image ${listSrcs.indexOf(data) + 1}`"
          class="rounded w-full"
          preview
        >
          <template #image>
            <div class="relative h-full w-full">
              <Button
                v-tooltip.top="t('upload.removeImage')"
                icon="pi pi-trash"
                rounded
                class="absolute! z-9999 bottom-2 right-2"
                @click="confirmDelete($event, index)"
              />
              <NuxtImg
                :src="data"
                :alt="`Image ${listSrcs.indexOf(data) + 1}`"
                class="rounded w-full shadow-md"
                style="height: 300px !important; object-fit: cover;"
              />
            </div>
          </template>
        </Image>
      </template>
      <template #empty>
        {{  }}
      </template>
    </Carousel>
  </div>
</template>