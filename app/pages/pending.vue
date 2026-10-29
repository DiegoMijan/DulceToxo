<script setup lang="ts">
  defineI18nRoute({
    paths: {
      gl: "/pendente",
      es: "/pendiente",
      en: "/pending",
    },
  })

  definePageMeta({
    middleware: "auth",
  })

  const { t } = useI18n()
  const toast = useToast()
  const localePath = useLocalePath()
  const { user, ensureApprovedSession, signOut } = useAuth()

  const checking = ref(false)

  const goHome = () => navigateTo(localePath("/"), { replace: true })

  // Si ya esta aprobado (o es admin) no pinta nada aqui
  const { isApproved } = await ensureApprovedSession()
  if (isApproved) await goHome()

  const handleCheck = async () => {
    checking.value = true
    try {
      const result = await ensureApprovedSession(true)
      if (result.isApproved) {
        toast.add({ severity: "success", summary: t("pending.approved"), life: 4000 })
        await goHome()
        return
      }
      toast.add({ severity: "info", summary: t("pending.stillPending"), life: 4000 })
    } finally {
      checking.value = false
    }
  }
</script>

<template>
  <div class="flex flex-1 items-center justify-center px-4 py-16">
    <div
      class="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800"
      data-testid="pending-approval"
    >
      <i class="pi pi-hourglass text-5xl! text-french-lilac-400 dark:text-french-lilac-500" />
      <h1 class="font-pacifico text-3xl leading-tight text-french-lilac-700 dark:text-french-lilac-300">
        {{ t("pending.title") }}
      </h1>
      <p class="text-stone-600 dark:text-stone-300">
        {{ t("pending.message", { name: user?.name ?? "" }) }}
      </p>
      <div class="mt-2 flex flex-wrap justify-center gap-3">
        <Button
          :label="t('pending.check')"
          icon="pi pi-refresh"
          :loading="checking"
          data-testid="pending-check"
          @click="handleCheck"
        />
        <Button
          :label="t('auth.profile.signOut')"
          severity="secondary"
          outlined
          @click="signOut"
        />
      </div>
    </div>
  </div>
</template>
