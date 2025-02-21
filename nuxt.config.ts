import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dulce Toxo',
    }
  },
  icon: {
    componentName: 'NuxtIcon'
  },
  compatibilityDate: '2024-11-01',
  ssr:false,
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt','@pinia/nuxt','@formkit/auto-animate/nuxt','magic-regexp/nuxt','@nuxtjs/i18n','@nuxt/image','@nuxt/icon','@nuxt/fonts','@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    storage: 'localStorage',
    storageKey: 'nuxt-color-mode'
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
        name: 'Playfair Display',
        provider: 'google',
        weights: [400, 500, 600, 700],
        styles: ['normal', 'italic']
      },
      {
        name: 'Lato',
        provider: 'google',
        weights: [300, 400, 700],
        styles: ['normal', 'italic']
      },
      {
        name: 'Pacifico',
        provider: 'google'
      },
      {
        name: 'Merriweather',
        provider: 'google',
        weights: [300, 400, 700],
        styles: ['normal', 'italic']
      },
      {
        name: 'Roboto',
        provider: 'google',
        weights: [300, 400, 500, 700],
        styles: ['normal', 'italic']
      }
    ]
  }
})
