<script setup lang="ts">
  import type { FileUploadSelectEvent } from "primevue/fileupload"

  const confirm = useConfirm()
  const { t } = useI18n()

  const listSrcs = ref<string[]>([])
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
    })
  }

  const removeImage = async (index: number) => {
    listSrcs.value = listSrcs.value.filter((_, i) => i !== index)
    if (listSrcs.value.length === 1) {
      carouselKey.value++
    }
  }

  const confirm2 = (event: Event, index: number) => {
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
        removeImage(index)
      },
    })
  }
</script>
<template>
  <ConfirmPopup />
  <div
    class="card flex flex-col "
    :class="{ 'gap-4': listSrcs.length > 0 }"
  >
    <FileUpload
      mode="basic"
      custom-upload
      auto
      :multiple="true"
      severity="secondary"
      class="p-button-outlined"
      :max-file-size="5242880"
      :accept="'.jpg, .jpeg, .png, .gif, .bmp, .webp'"
      :choose-label="'Escoller imaxes'"
      @select="onFileSelect"
    />
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
                v-tooltip.top="$t('upload.removeImage')"
                icon="pi pi-trash"
                rounded
                class="absolute! z-9999 bottom-2 right-2"
                @click="confirm2($event, index)"
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