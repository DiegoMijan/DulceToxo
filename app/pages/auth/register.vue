<script setup lang="ts">
import type { MiddlewareKey } from "#build/types/middleware"
import { useAuth } from "~/composables/useAuth"

definePageMeta({
  middleware: "guest" as MiddlewareKey,
})

const { t } = useI18n()
const { signUp } = useAuth()
const router = useRouter()

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
})

const isLoading = ref(false)
const error = ref("")

const validateForm = () => {
  if (!form.name.trim()) {
    return t("auth.errors.nameRequired")
  }

  if (!form.email) {
    return t("auth.errors.emailRequired")
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    return t("auth.errors.invalidEmail")
  }

  if (!form.password) {
    return t("auth.errors.passwordRequired")
  }

  if (form.password.length < 8) {
    return t("auth.errors.weakPassword")
  }

  if (form.password !== form.confirmPassword) {
    return t("auth.errors.passwordsDontMatch")
  }

  return null
}

const handleSubmit = async () => {
  error.value = ""

  const validationError = validateForm()
  if (validationError) {
    error.value = validationError
    return
  }

  try {
    isLoading.value = true
    await signUp(form.email, form.password, form.name)
    await router.push("/dashboard")
  } catch (err: any) {
    error.value = err.message || t("auth.errors.invalidCredentials")
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
      
      <form 
        class="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        @submit.prevent="handleSubmit"
      >
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.register.name') }}
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.register.name')"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.register.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.register.email')"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.register.password') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.register.password')"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.register.confirmPassword') }}
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.register.confirmPassword')"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-french-lilac-600 hover:bg-french-lilac-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-french-lilac-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading" class="mr-2">
              <NuxtIcon name="mdi:loading" class="animate-spin h-4 w-4" />
            </span>
            {{ $t('auth.register.button') }}
          </button>
        </div>

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
      </form>
    </div>
  </div>
</template>
