<script setup lang="ts">
  import type Form from "@primevue/forms/form"
  import type { FormSubmitEvent } from "@primevue/forms/form"
  import { valibotResolver } from "@primevue/forms/resolvers/valibot"
  import { FormField, FormPassword } from "#components"

  definePageMeta({
    middleware: "guest",
  })

  const { t } = useI18n()
  const { signUp } = useAuth()
  const router = useRouter()
  const localePath = useLocalePath()
  const formRef = useTemplateRef<InstanceType<typeof Form>>("formRef")
  const { reactiveForm: form } = useForm<{
    firstName: string
    lastName: string
    dateOfBirth: string
    email: string
    password: string
    confirmPassword: string
  }>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const isLoading = ref(false)
  const error = ref("")

  const resolver = ref(valibotResolver(createRegisterPasswordSchema(t, validatePassword)))

  function validatePassword(check: string) {
    const passwordValue = formRef.value as unknown as { states: { password: { value: string } } }
    return passwordValue.states && passwordValue.states.password.value === check
  }

  const onSubmit = async (event: FormSubmitEvent) => {
    const { valid, values } = event as FormSubmitEvent<{
      firstName: string
      lastName: string
      dateOfBirth: Date
      email: string
      password: string
      confirmPassword: string
    }>
    if (!valid) return

    try {
      isLoading.value = true
      error.value = ""
      // toISOString() convierte a UTC y desplaza la fecha un día cuando la zona
      // horaria local va por delante de UTC (p.ej. España); usamos los componentes
      // locales del Date tal cual los eligió el calendario.
      const birthDate = values.dateOfBirth
      const dateOfBirth = `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`
      await signUp(values.email, values.password, values.firstName, values.lastName, dateOfBirth)
      await router.push(localePath("/dashboard"))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t("auth.errors.invalidCredentials")
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <div class="flex items-center justify-center bg-gradient-to-br from-french-lilac-50 to-french-lilac-100 dark:from-gray-900 dark:to-gray-800 px-4 flex-1">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          {{ $t('auth.register.title') }}
        </h2>
      </div>

      <Form
        v-slot="$form"
        ref="formRef"
        :resolver="resolver"
        :initial-values="form"
        class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        @submit="onSubmit"
      >
        <div
          v-if="error"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
        >
          {{ error }}
        </div>
        <div class="space-y-4">
          <div class="flex gap-4">
            <FormField
              fieldName="firstName"
              :form="$form"
              class="w-1/2"
            >
              <template #field>
                <InputText
                  name="firstName"
                  type="text"
                  :placeholder="$t('auth.register.firstName')"
                />
              </template>
            </FormField>
            <FormField
              fieldName="lastName"
              :form="$form"
              class="w-1/2"
            >
              <template #field>
                <InputText
                  name="lastName"
                  type="text"
                  :placeholder="$t('auth.register.lastName')"
                />
              </template>
            </FormField>
          </div>
          <FormField
            fieldName="dateOfBirth"
            :form="$form"
          >
            <template #field>
              <Calendar
                name="dateOfBirth"
                date-format="dd/mm/yy"
                show-icon
                icon-display="input"
                :placeholder="$t('auth.register.dateOfBirth')"
                class="w-full"
              />
            </template>
          </FormField>
          <FormField
            fieldName="email"
            :form="$form"
          >
            <template #field>
              <InputText
                name="email"
                type="text"
                :placeholder="$t('auth.register.email')"
              />
            </template>
          </FormField>
          <FormField
            fieldName="password"
            :form="$form"
          >
            <template #field>
              <FormPassword
                name="password"
                type="password"
                :placeholder="$t('auth.register.password')"
                :form="$form"
              />
            </template>
          </FormField>
          <FormField
            fieldName="confirmPassword"
            :form="$form"
          >
            <template #field>
              <FormPassword
                name="confirmPassword"
                type="password"
                :placeholder="$t('auth.register.confirmPassword')"
                :form="$form"
              />
            </template>
          </FormField>
        </div>

        <Button
          type="submit"
          :disabled="isLoading"
          class="w-full"
        >
          {{ $t('auth.register.button') }}
        </Button>

        <div class="text-center space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t('auth.register.hasAccount') }}
            <NuxtLink
              to="/auth/login"
              class="font-medium text-french-lilac-600 hover:text-french-lilac-500 dark:text-french-lilac-400"
            >
              {{ $t('auth.register.signInLink') }}
            </NuxtLink>
          </p>
        </div>
      </Form>
    </div>
  </div>
</template>
