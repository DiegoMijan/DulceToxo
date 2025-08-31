<script setup lang="ts">
import { valibotResolver } from "@primevue/forms/resolvers/valibot"
import * as v from "valibot"
import { FormField, LoginCupCake, Password } from "#components"

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

const passwordField = useTemplateRef<InstanceType<typeof Password>>("passwordField")
const cupcakeRef = useTemplateRef<InstanceType<typeof LoginCupCake>>("cupcakeRef")
const error = ref("")

const isLoading = ref(false)
const resolver = ref(
  valibotResolver(
    v.object({
      email: v.pipe(
        v.string(),
        v.minLength(1, t("auth.register.error.emailRequired")),
        v.email(t("auth.register.error.invalidEmail")),
      ),
      password: v.pipe(
        v.string(),
        v.minLength(1, t("auth.register.error.passwordRequired")),
        v.regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
          t("auth.register.error.passwordRequirements"),
        ),
      ),
    }),
  ),
)

const unmasked = computed({
  get() {
    return (passwordField.value as unknown as { unmasked: boolean })?.unmasked ?? true
  },
  set(newValue) {
    ;(passwordField.value as unknown as { unmasked: boolean }).unmasked = newValue
  },
})

watch(unmasked, () => {
  cupcakeRef.value?.toggleEyes()
})

onMounted(() => {
  unmasked.value = true
})

const onSubmit = async ({ valid }: { valid: boolean }) => {
  console.log(form.value)
  if (!valid) return
  try {
    isLoading.value = true
    await signIn(form.value.email, form.value.password)

    const redirectTo = (route.query.redirect as string) || "/dashboard"
    await router.push(redirectTo)
  } catch (err: any) {
    error.value = err.message || t("auth.errors.invalidCredentials")
  } finally {
    isLoading.value = false
  }
}

const visibility = (isOk: boolean) => {
  return !isOk ? "invisible" : ""
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
      
      <Form v-slot="$form" @submit="onSubmit" :resolver="resolver" :initial-values="form" class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <FormField fieldName="email" :form="$form">
          <template #field>
            <InputText name="email" type="text" :placeholder="$t('auth.login.email')" />
          </template>
        </FormField>
        <FormField fieldName="password" :form="$form">
          <template #field>
            <Password ref="passwordField"  name="password" type="password" :placeholder="$t('auth.login.password')" toggleMask  :pt="{
              pcInputText: {
                root: 'w-full'
              }
            }">
            <template #footer>
              <Divider />
              <ul class="pl-2 my-0 leading-normal text-sm">
                <li class="flex items-center gap-1"><NuxtIcon name="cuida:check-outline" class="text-xl text-green-500"  :class="visibility(/[a-z]/.test($form.password.value))" />{{ $t('auth.login.passwordRequirements.lowercase') }}</li>
                <li class="flex items-center gap-1"><NuxtIcon name="cuida:check-outline" class="text-xl text-green-500" :class="visibility(/[A-Z]/.test($form.password.value))" />{{ $t('auth.login.passwordRequirements.uppercase') }}</li>
                <li class="flex items-center gap-1"><NuxtIcon name="cuida:check-outline" class="text-xl text-green-500" :class="visibility(/\d/.test($form.password.value))" />{{ $t('auth.login.passwordRequirements.numeric') }}</li>
                <li class="flex items-center gap-1"><NuxtIcon name="cuida:check-outline" class="text-xl text-green-500" :class="visibility($form.password.value.length >= 8)" />{{ $t('auth.login.passwordRequirements.minimumCharacters') }}</li>
              </ul>
            </template>
            </Password>
          </template>
        </FormField>
        <Button type="submit" :disabled="isLoading" class="w-full">
          {{ $t('auth.login.button') }}
        </Button>
      </Form>
    </div>
  </div>
</template>
