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
const formRef = useTemplateRef<InstanceType<typeof Form>>("formRef")
const { reactiveForm: form } = useForm<{
  name: string
  email: string
  password: string
  confirmPassword: string
}>({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
})

const isLoading = ref(false)
const error = ref("")
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

const resolver = ref(
  valibotResolver(
    v.object({
      name: v.pipe(v.string(), v.minLength(1, t("auth.register.error.nameRequired"))),
      email: v.pipe(
        v.string(),
        v.minLength(1, t("auth.register.error.emailRequired")),
        v.email(t("auth.register.error.invalidEmail")),
      ),
      password: v.pipe(
        v.string(),
        v.minLength(1, t("auth.register.error.passwordRequired")),
        v.regex(passwordRegex, t("auth.register.error.passwordRequirements")),
      ),
      confirmPassword: v.pipe(
        v.string(),
        v.minLength(1, t("auth.register.error.confirmPasswordRequired")),
        v.regex(passwordRegex, t("auth.register.error.passwordRequirements")),
        v.check((check) => validatePassword(check), t("auth.register.error.passwordsDontMatch")),
      ),
    }),
  ),
)

const validatePassword = (check: string) => {
  const passwordValue = formRef.value as unknown as { states: { password: { value: string } } }
  return passwordValue.states && passwordValue.states.password.value === check
}

const onSubmit = async (event: FormSubmitEvent) => {
  console.log(event)
  const { valid, values } = event as FormSubmitEvent<{
    name: string
    email: string
    password: string
    confirmPassword: string
  }>
  if (!valid) return
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
      
      <Form v-slot="$form" @submit="onSubmit" :resolver="resolver" :initial-values="form" class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" ref="formRef">
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {{ error }}
        </div>
        <div class="space-y-4">
          <FormField fieldName="name" :form="$form">
            <template #field>
              <InputText name="name" type="text" :placeholder="$t('auth.register.name')" />
            </template>
          </FormField>
          <FormField fieldName="email" :form="$form">
            <template #field>
              <InputText name="email" type="text" :placeholder="$t('auth.register.email')" />
            </template>
          </FormField>
          <FormField fieldName="password" :form="$form">
            <template #field>
              <FormPassword name="password" type="password" :placeholder="$t('auth.register.password')" :form="$form" />
            </template>
          </FormField>
          <FormField fieldName="confirmPassword" :form="$form">
            <template #field>
              <FormPassword name="confirmPassword" type="password" :placeholder="$t('auth.register.confirmPassword')" :form="$form" />
            </template>
          </FormField>
        </div>

        <Button type="submit" :disabled="isLoading" class="w-full">
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
