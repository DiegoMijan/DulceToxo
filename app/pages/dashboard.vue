<script setup lang="ts">
definePageMeta({
  middleware: "auth",
})

const { user, signOut } = useAuth()
const isSigningOut = ref(false)

const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    await signOut()
  } catch (error) {
    console.error("Sign out error:", error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ user?.name || user?.email }}
            </span>
            <button
              @click="handleSignOut"
              :disabled="isSigningOut"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isSigningOut" class="mr-2">
                <NuxtIcon name="mdi:loading" class="animate-spin h-4 w-4" />
              </span>
              {{ $t('auth.profile.signOut') }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              ¡Bienvenido a tu Dashboard!
            </h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                Has iniciado sesión correctamente. Aquí puedes gestionar tu cuenta y acceder a contenido exclusivo.
              </p>
            </div>
            
            <div class="mt-6">
              <div class="bg-french-lilac-50 dark:bg-french-lilac-900/20 border border-french-lilac-200 dark:border-french-lilac-800 rounded-lg p-4">
                <h4 class="text-sm font-medium text-french-lilac-800 dark:text-french-lilac-200 mb-2">
                  Información de tu cuenta:
                </h4>
                <dl class="space-y-1 text-sm">
                  <div class="flex">
                    <dt class="font-medium text-french-lilac-700 dark:text-french-lilac-300 w-20">Nombre:</dt>
                    <dd class="text-french-lilac-900 dark:text-french-lilac-100">{{ user?.name || 'No especificado' }}</dd>
                  </div>
                  <div class="flex">
                    <dt class="font-medium text-french-lilac-700 dark:text-french-lilac-300 w-20">Email:</dt>
                    <dd class="text-french-lilac-900 dark:text-french-lilac-100">{{ user?.email }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div class="mt-6">
              <NuxtLink
                to="/"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-french-lilac-700 bg-french-lilac-100 hover:bg-french-lilac-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-french-lilac-500 transition-colors"
              >
                <NuxtIcon name="mdi:arrow-left" class="mr-2 h-4 w-4" />
                Volver al inicio
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
