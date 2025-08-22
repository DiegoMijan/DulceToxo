// Mock user type for frontend-only implementation
interface MockUser {
  id: string
  name: string
  email: string
  createdAt: Date
}

// Mock storage key
const AUTH_STORAGE_KEY = "dulce-toxo-auth"

export const useAuth = () => {
  // Local state for mock authentication
  const currentUser = ref<MockUser | null>(
    localStorage.getItem(AUTH_STORAGE_KEY)
      ? JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) as string)
      : null,
  )
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const user = computed(() => currentUser.value)
  const isLoggedIn = computed(() => !!currentUser.value)

  // Load user from localStorage on initialization
  const loadUserFromStorage = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        try {
          currentUser.value = JSON.parse(stored)
        } catch (err) {
          console.error("Error loading user from storage:", err)
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    }
  }

  // Save user to localStorage
  const saveUserToStorage = (user: MockUser) => {
    if (import.meta.client) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    }
  }

  // Remove user from localStorage
  const removeUserFromStorage = () => {
    if (import.meta.client) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  // Mock sign in function
  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation (in real app, this would be server-side)
      if (password.length < 6) {
        throw new Error("Invalid credentials")
      }

      // Create mock user
      const mockUser: MockUser = {
        id: crypto.randomUUID(),
        name: email.split("@").at(0) || "",
        email,
        createdAt: new Date(),
      }

      currentUser.value = mockUser
      saveUserToStorage(mockUser)

      return { user: mockUser }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Mock sign up function
  const signUp = async (email: string, password: string, name?: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      // Create mock user
      const mockUser: MockUser = {
        id: crypto.randomUUID(),
        name: name || email.split("@").at(0) || "",
        email,
        createdAt: new Date(),
      }

      currentUser.value = mockUser
      saveUserToStorage(mockUser)

      return { user: mockUser }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Mock sign out function
  const signOut = async () => {
    isLoading.value = true

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      currentUser.value = null
      removeUserFromStorage()

      await navigateTo("/")
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Mock password update function
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long")
      }

      // In a real app, this would update the password on the server
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Initialize user on composable creation
  onMounted(() => {
    loadUserFromStorage()
  })

  return {
    // State
    user: readonly(user),
    isLoggedIn: readonly(isLoggedIn),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    signIn,
    signUp,
    signOut,
    updatePassword,
  }
}
