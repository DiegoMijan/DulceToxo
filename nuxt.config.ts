import Aura from "@primeuix/themes/aura"
import tailwindcss from "@tailwindcss/vite"
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  imports: {
    presets: [
      {
        from: "valibot",
        imports: [{ name: "*", as: "v" }],
      },
    ],
  },
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
  image: {
    inject: true,
  },
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
    compilation: {
      strictMessage: false,
    },
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
    options: {
      ripple: true,
      theme: {
        preset: {
          ...Aura,
          semantic: {
            ...Aura.semantic,
            primary: {
              50: "{fuchsia.50}",
              100: "{fuchsia.100}",
              200: "{fuchsia.200}",
              300: "{fuchsia.300}",
              400: "{fuchsia.400}",
              500: "{fuchsia.500}",
              600: "{fuchsia.600}",
              700: "{fuchsia.700}",
              800: "{fuchsia.800}",
              900: "{fuchsia.900}",
              950: "{fuchsia.950}",
            },
          },
        },
        options: {
          darkModeSelector: ".dark-mode",
        },
      },
    },
  },
})
