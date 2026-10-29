<script setup lang="ts">
  // Tabla de usuarios para el admin: aprobar o retirar el acceso al contenido.
  // Los cambios se acumulan y se guardan de una vez (PUT /admin/users/approval).
  interface AdminUser {
    id: string
    name: string
    first_name: string
    last_name: string
    email: string
    date_of_birth: string
    created_at: number
    type: number
    approved: boolean
    signup_country: string | null
    signup_region: string | null
  }

  const ADMIN_TYPE = 1

  const { t, locale } = useI18n()
  const toast = useToast()

  const users = ref<AdminUser[]>([])
  const loading = ref(true)
  const loadError = ref(false)
  const saving = ref(false)
  const search = ref("")
  // id -> valor nuevo de "aprobado" (solo los que difieren del guardado)
  const pending = ref<Record<string, boolean>>({})

  const pendingCount = computed(() => Object.keys(pending.value).length)
  const pendingUsersCount = computed(() => users.value.filter((u) => !u.approved && u.type !== ADMIN_TYPE).length)

  const loadUsers = async () => {
    loading.value = true
    loadError.value = false
    try {
      users.value = await $fetch<AdminUser[]>("/api/admin/users")
      pending.value = {}
    } catch (error) {
      loadError.value = true
      console.error("Failed to load users:", error)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadUsers)

  const isAdminRow = (user: AdminUser) => user.type === ADMIN_TYPE
  const approvedValue = (user: AdminUser) => (user.id in pending.value ? pending.value[user.id] : user.approved)
  const isChanged = (user: AdminUser) => user.id in pending.value

  const setApproved = (user: AdminUser, value: boolean) => {
    // Volver al valor guardado quita el cambio pendiente
    const next = Object.fromEntries(Object.entries(pending.value).filter(([id]) => id !== user.id))
    if (value !== user.approved) next[user.id] = value
    pending.value = next
  }

  const handleCancel = () => {
    pending.value = {}
  }

  const handleSave = async () => {
    const changes = Object.entries(pending.value).map(([id, approved]) => ({ id, approved }))
    if (changes.length === 0) return
    saving.value = true
    try {
      const result = await $fetch<{ updated: number }>("/api/admin/users/approval", {
        method: "PUT",
        body: { changes },
      })
      users.value = users.value.map((user) =>
        user.id in pending.value ? { ...user, approved: pending.value[user.id]! } : user,
      )
      pending.value = {}
      toast.add({
        severity: "success",
        summary: t("admin.users.saved", result.updated),
        life: 4000,
      })
    } catch (error) {
      toast.add({ severity: "error", summary: t("admin.users.saveError"), life: 6000 })
      console.error("Failed to save approvals:", error)
    } finally {
      saving.value = false
    }
  }

  // Busqueda en nombre, email y ubicacion, sin tildes
  const filteredUsers = computed(() => {
    const needle = foldSearchText(search.value.trim())
    if (!needle) return users.value
    return users.value.filter((user) =>
      foldSearchText(
        `${user.first_name} ${user.last_name} ${user.name} ${user.email} ${user.signup_country ?? ""} ${user.signup_region ?? ""}`,
      ).includes(needle),
    )
  })

  const dateFormatter = computed(
    () => new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }),
  )
  const formatDate = (value: number | string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.value.format(date)
  }
  const fullName = (user: AdminUser) => `${user.first_name} ${user.last_name}`.trim() || user.name
  const location = (user: AdminUser) =>
    user.signup_country ? [user.signup_country, user.signup_region].filter(Boolean).join(" · ") : "—"
</script>

<template>
  <section
    class="bg-white dark:bg-gray-800 shadow rounded-lg"
    data-testid="admin-users"
  >
    <div class="flex flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
      <div class="mr-auto">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {{ t("admin.users.title") }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t("admin.users.subtitle", { total: users.length, pending: pendingUsersCount }) }}
        </p>
      </div>
      <InputText
        v-model="search"
        :placeholder="t('admin.users.search')"
        size="small"
        class="w-full sm:w-64"
        data-testid="admin-users-search"
      />
    </div>

    <DataTable
      :value="filteredUsers"
      :loading
      data-key="id"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      scrollable
      size="small"
      striped-rows
      :row-class="(user: AdminUser) => (isChanged(user) ? 'admin-users-row--changed' : '')"
      data-testid="admin-users-table"
    >
      <template #empty>
        <div class="py-6 text-center text-gray-400 dark:text-gray-500">
          {{ loadError ? t("admin.users.loadError") : t("admin.users.empty") }}
        </div>
      </template>
      <Column
        :header="t('admin.users.approved')"
        header-class="w-24"
        body-class="text-center"
      >
        <template #body="{ data }">
          <Checkbox
            :model-value="isAdminRow(data) || approvedValue(data)"
            binary
            :disabled="isAdminRow(data) || saving"
            :input-id="`approve-${data.id}`"
            :aria-label="t('admin.users.approveAria', { name: fullName(data) })"
            :data-testid="`admin-users-approve-${data.email}`"
            @update:model-value="(value: boolean) => setApproved(data, value)"
          />
        </template>
      </Column>
      <Column :header="t('admin.users.name')">
        <template #body="{ data }">
          <span class="whitespace-nowrap font-medium">{{ fullName(data) }}</span>
          <span
            v-if="isAdminRow(data)"
            class="ml-2 rounded-full bg-french-lilac-100 px-2 py-0.5 text-xs text-french-lilac-700 dark:bg-french-lilac-900/60 dark:text-french-lilac-200"
          >
            {{ t("admin.users.admin") }}
          </span>
        </template>
      </Column>
      <Column
        field="email"
        :header="t('admin.users.email')"
      />
      <Column :header="t('admin.users.birthDate')">
        <template #body="{ data }">
          <span class="whitespace-nowrap">{{ formatDate(data.date_of_birth) }}</span>
        </template>
      </Column>
      <Column :header="t('admin.users.signupDate')">
        <template #body="{ data }">
          <span class="whitespace-nowrap">{{ formatDate(data.created_at) }}</span>
        </template>
      </Column>
      <Column :header="t('admin.users.location')">
        <template #body="{ data }">
          <span class="whitespace-nowrap">{{ location(data) }}</span>
        </template>
      </Column>
    </DataTable>

    <div class="flex flex-wrap items-center justify-end gap-3 border-t border-french-lilac-100 bg-french-lilac-50 px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40">
      <span
        v-if="pendingCount > 0"
        class="mr-auto text-sm text-french-lilac-700 dark:text-french-lilac-300"
        data-testid="admin-users-pending-count"
      >
        {{ t("admin.users.unsaved", pendingCount) }}
      </span>
      <Button
        type="button"
        severity="danger"
        outlined
        icon="pi pi-times"
        :label="t('recipe.edit.cancelChanges')"
        :disabled="pendingCount === 0 || saving"
        data-testid="admin-users-cancel"
        @click="handleCancel"
      />
      <Button
        type="button"
        icon="pi pi-save"
        :label="t('recipe.edit.save')"
        :loading="saving"
        :disabled="pendingCount === 0 || saving"
        data-testid="admin-users-save"
        @click="handleSave"
      />
    </div>
  </section>
</template>

<style scoped>
  :deep(.admin-users-row--changed) > td {
    background-color: color-mix(in srgb, var(--color-yellow-300) 22%, transparent) !important;
  }
</style>
