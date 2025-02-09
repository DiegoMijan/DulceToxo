import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt','@pinia/nuxt','@formkit/auto-animate/nuxt','magic-regexp/nuxt','@nuxtjs/i18n','@nuxt/image','@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss() as any,
    ],
  },
})
