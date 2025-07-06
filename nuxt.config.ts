import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "@formkit/auto-animate/nuxt",
    "magic-regexp/nuxt",
    "@nuxtjs/i18n",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxtjs/color-mode",
    "@nuxt/eslint",
    "@primevue/nuxt-module",
    "@tresjs/nuxt",
  ],
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: "Dulce Toxo 🧁",
    },
  },
  css: ["~/assets/css/main.css", "primeicons/primeicons.css"],
  colorMode: {
    preference: "dark",
    fallback: "dark",
    storage: "localStorage",
    storageKey: "nuxt-color-mode",
  },
  compatibilityDate: "2024-11-01",
  vite: {
    plugins: [tailwindcss()],
  },
  eslint: {
    config: {
      stylistic: false,
    },
  },
  /*
  1."Playfair Display" - Para títulos y encabezados
  2."Lato" - Para el cuerpo del texto y párrafos
  3."Pacifico" - Para acentos y elementos decorativos
  4."Merriweather" - Para subtítulos o texto destacado
  5."Roboto" - Como fuente de respaldo y para elementos de interfaz
  */
  fonts: {
    families: [
      {
        name: "Playfair Display",
        provider: "google",
        weights: [400, 500, 600, 700],
        styles: ["normal", "italic"],
      },
      {
        name: "Lato",
        provider: "google",
        weights: [300, 400, 700],
        styles: ["normal", "italic"],
      },
      {
        name: "Pacifico",
        provider: "google",
      },
      {
        name: "Merriweather",
        provider: "google",
        weights: [300, 400, 700],
        styles: ["normal", "italic"],
      },
      {
        name: "Roboto",
        provider: "google",
        weights: [300, 400, 500, 700],
        styles: ["normal", "italic"],
      },
    ],
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
    compilation: {
      strictMessage: false,
    },
    lazy: true,
    locales: [
      {
        code: "gl",
        language: "gl-ES",
        name: "Galego",
        file: "gl.json",
      },
      {
        code: "es",
        language: "es-ES",
        name: "Español",
        file: "es.json",
      },
      {
        code: "en",
        language: "en-GB",
        name: "English",
        file: "en.json",
      },
    ],
    defaultLocale: "gl",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root", // recommended
      fallbackLocale: "gl",
    },
  },
  icon: {
    componentName: "NuxtIcon",
  },
  primevue: {
    components: {
      exclude: ["Form", "FormField"],
    },
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".dark-mode",
        },
      },
    },
  },
});
