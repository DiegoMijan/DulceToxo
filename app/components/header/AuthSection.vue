<script setup lang="ts">
import { useAuth } from "~/composables/useAuth"

const { user, isLoggedIn, signOut } = useAuth()

const isDropdownOpen = ref(false)
const isSigningOut = ref(false)

const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    await signOut()
    isDropdownOpen.value = false
  } catch (error) {
    console.error("Sign out error:", error)
  } finally {
    isSigningOut.value = false
  }
}

const dropdownRef = ref<HTMLElement>()

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, closeDropdown)
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative"
  >
    <!-- Authenticated State -->
    <div
      v-if="isLoggedIn"
      class="relative"
    >
      <button
        class="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        :aria-label="$t('auth.profile.title')"
        @click="isDropdownOpen = !isDropdownOpen"
      >
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <NuxtIcon
            name="mdi:account"
            class="w-4 h-4"
          />
        </div>
        <span class="hidden md:block text-sm font-medium">
          {{ user?.name || user?.email?.split('@')[0] }}
        </span>
        <NuxtIcon 
          name="mdi:chevron-down" 
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': isDropdownOpen }"
        />
      </button>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
        >
          <div class="py-1">
            <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <p class="font-medium">{{ user?.name || 'Usuario' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
            </div>
            
            <NuxtLink
              to="/dashboard"
              class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="closeDropdown"
            >
              <NuxtIcon
                name="mdi:view-dashboard"
                class="inline w-4 h-4 mr-2"
              />
              Dashboard
            </NuxtLink>
            
            <button
              :disabled="isSigningOut"
              class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSignOut"
            >
              <NuxtIcon 
                :name="isSigningOut ? 'mdi:loading' : 'mdi:logout'" 
                class="inline w-4 h-4 mr-2"
                :class="{ 'animate-spin': isSigningOut }"
              />
              {{ $t('auth.profile.signOut') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Unauthenticated State -->
    <div
      v-else
      class="flex items-center space-x-2"
    >
      <NuxtLink
        to="/auth/login"
        class="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        {{ $t('auth.login.title') }}
      </NuxtLink>
      <NuxtLink
        to="/auth/register"
        class="px-3 py-2 text-sm font-medium bg-white text-french-lilac-700 hover:bg-white/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
      >
        {{ $t('auth.register.title') }}
      </NuxtLink>
    </div>
  </div>
</template>
