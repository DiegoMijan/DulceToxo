<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms/form"
import { valibotResolver } from "@primevue/forms/resolvers/valibot"
import { FormField, FormPassword, LoginCupCake } from "#components"

definePageMeta({
  middleware: "guest",
})

const { t } = useI18n()
const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()
const { reactiveForm: form } = useForm<{ email: string; password: string }>({
  email: "",
  password: "",
})

const formPasswordRef = useTemplateRef<InstanceType<typeof FormPassword>>("formPasswordRef")
const cupcakeRef = useTemplateRef<InstanceType<typeof LoginCupCake>>("cupcakeRef")
const error = ref("")

const isLoading = ref(false)
const resolver = ref(valibotResolver(createLoginPasswordSchema(t)))

const unmasked = computed({
  get() {
    return (
      (formPasswordRef.value?.passwordField as unknown as { unmasked: boolean })?.unmasked ?? true
    )
  },
  set(newValue) {
    if (!formPasswordRef.value) return
    ;(formPasswordRef.value.passwordField as unknown as { unmasked: boolean }).unmasked = newValue
  },
})

watch(unmasked, () => {
  cupcakeRef.value?.toggleEyes()
})

onMounted(() => {
  unmasked.value = true
})

const onSubmit = async (event: FormSubmitEvent) => {
  const { valid, values } = event as FormSubmitEvent<{ email: string; password: string }>
  if (!valid) return
  try {
    isLoading.value = true
    await signIn(values.email, values.password)

    const redirectTo = (route.query.redirect as string) || "/dashboard"
    await router.push(redirectTo)
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = t("auth.errors.invalidCredentials")
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center bg-gradient-to-br from-french-lilac-50 to-french-lilac-100 dark:from-gray-900 dark:to-gray-800 px-4 flex-1">
    <div class="max-w-md w-full space-y-8">
      <LoginCupCake ref="cupcakeRef"  />
      
      <div class="text-center">
        <h2 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('auth.login.title') }}
        </h2>
      </div>
      
      <Form
        v-slot="$form"
        :resolver="resolver"
        :initial-values="form"
        class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        @submit="onSubmit"
      >
        <FormField
          field-name="email"
          :form="$form"
        >
          <template #field>
            <InputText
              name="email"
              type="text"
              :placeholder="$t('auth.login.email')"
            />
          </template>
        </FormField>
        <FormField
          field-name="password"
          :form="$form"
        >
          <template #field>
            <FormPassword
              ref="formPasswordRef"
              name="password"
              type="password"
              :placeholder="$t('auth.login.password')"
              :form="$form"
            />
          </template>
        </FormField>
        <Button
          type="submit"
          :disabled="isLoading"
          class="w-full"
        >
          {{ $t('auth.login.button') }}
        </Button>
      </Form>
    </div>
  </div>
</template>
