<script setup lang="ts">
  const { t } = useI18n()
  const { $pwa } = useNuxtApp()

  const visible = computed(() => Boolean($pwa?.needRefresh))
  const updating = ref(false)

  const handleUpdate = async () => {
    updating.value = true
    // Activa el service worker nuevo y recarga la pagina
    await $pwa?.updateServiceWorker(true)
  }

  const handleDismiss = () => {
    $pwa?.cancelPrompt()
  }
</script>

<template>
  <Transition
    enter-from-class="translate-y-4 opacity-0"
    enter-active-class="transition duration-200"
    leave-to-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150"
  >
    <div
      v-if="visible"
      role="status"
      class="fixed bottom-4 left-4 right-4 z-30 flex items-center gap-3 rounded-xl border border-french-lilac-200 bg-white p-3 pl-4 text-sm text-stone-700 shadow-lg sm:right-auto sm:max-w-sm dark:border-french-lilac-800 dark:bg-french-lilac-950 dark:text-stone-200"
      data-testid="pwa-update-notice"
    >
      <NuxtIcon
        name="line-md:cookie"
        class="shrink-0 text-xl text-french-lilac-500"
        aria-hidden="true"
      />
      <span class="flex-1">{{ t("pwa.updateAvailable") }}</span>
      <Button
        :label="t('pwa.reload')"
        size="small"
        :loading="updating"
        @click="handleUpdate"
      />
      <button
        type="button"
        class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-french-lilac-900"
        :aria-label="t('pwa.dismiss')"
        @click="handleDismiss"
      >
        <i
          class="pi pi-times text-xs"
          aria-hidden="true"
        />
      </button>
    </div>
  </Transition>
</template>
