<script setup lang="ts">
definePageMeta({
  middleware: "guest",
})

const { t } = useI18n()
const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: "",
  password: "",
})

const isLoading = ref(false)
const error = ref("")

const handleSubmit = async () => {
  error.value = ""

  if (!form.email) {
    error.value = t("auth.errors.emailRequired")
    return
  }

  if (!form.password) {
    error.value = t("auth.errors.passwordRequired")
    return
  }

  try {
    isLoading.value = true
    await signIn(form.email, form.password)

    const redirectTo = (route.query.redirect as string) || "/dashboard"
    await router.push(redirectTo)
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
          {{ $t('auth.login.title') }}
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
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.login.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.login.email')"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.login.password') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-french-lilac-500 focus:border-transparent"
              :placeholder="$t('auth.login.password')"
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
            {{ $t('auth.login.button') }}
          </button>
        </div>

        <div class="text-center space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t('auth.login.noAccount') }}
            <NuxtLink 
              to="/auth/register" 
              class="font-medium text-french-lilac-600 hover:text-french-lilac-500 dark:text-french-lilac-400"
            >
              {{ $t('auth.login.signUpLink') }}
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
