<script setup lang="ts">
  const { t } = useI18n()
  const online = useOnline()
</script>

<template>
  <div
    v-if="!online"
    role="status"
    class="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-center text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
    data-testid="pwa-offline-notice"
  >
    <i
      class="pi pi-wifi text-xs"
      aria-hidden="true"
    />
    <span>{{ t("pwa.offline") }}</span>
  </div>
</template>
