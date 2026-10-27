<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <div
    role="status"
    :aria-busy="true"
    :aria-label="t('recipe.edit.loadingForm')"
    class="flex flex-col gap-8 p-6 md:p-8"
  >
    <span class="sr-only">{{ t('recipe.edit.loadingForm') }}</span>

    <section class="flex flex-col gap-3">
      <Skeleton
        width="8rem"
        height="1.25rem"
      />
      <Skeleton
        width="100%"
        height="8rem"
        border-radius="1rem"
      />
    </section>

    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <Skeleton
          v-for="step in 3"
          :key="step"
          shape="circle"
          size="3rem"
        />
      </div>
      <div class="flex flex-wrap gap-4">
        <Skeleton
          width="100%"
          height="2.5rem"
          class="grow basis-64"
        />
        <Skeleton
          width="100%"
          height="2.5rem"
          class="grow basis-64"
        />
      </div>
      <Skeleton
        width="100%"
        height="6rem"
      />
      <Skeleton
        width="100%"
        height="8rem"
      />
      <Skeleton
        width="100%"
        height="8rem"
      />
    </section>

    <div class="flex flex-wrap gap-4 w-full">
      <Skeleton
        width="100%"
        height="2.5rem"
        class="basis-1/3 grow"
      />
      <Skeleton
        width="100%"
        height="2.5rem"
        class="basis-32 grow"
      />
      <Skeleton
        width="100%"
        height="2.5rem"
        class="basis-32 grow"
      />
    </div>
  </div>
</template>
