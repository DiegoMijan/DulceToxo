import tailwindcss from "@tailwindcss/vite"
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  imports: {
    autoImport: true,
    dirs: ["../shared/schemas/**"],
    scan: true,
    presets: [
      {
        from: "valibot",
        imports: [{ name: "*", as: "v" }],
      },
      {
        from: "@antfu/utils",
        imports: [
          "*",
          { name: "Nullable", type: true },
          { name: "Arrayable", type: true },
          { name: "Awaitable", type: true },
        ],
      },
    ],
  },
  nitro: {
    routeRules: {
      "/api/**": { proxy: `${process.env.BACKEND_URL}/**` },
    },
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
    "pinia-plugin-persistedstate/nuxt",
  ],
  piniaPluginPersistedstate: {
    storage: "localStorage",
  },
  image: {
    inject: true,
    cloudinary: {
      baseURL: "https://res.cloudinary.com/dulcetoxo/image/upload/",
    },
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
  6."Caveat" - Títulos de sección de ingredientes
  */
  fonts: {
    // @nuxt/fonts v1: mantener el comportamiento de v0.x
    // (no romper el build si un proveedor falla y resolver solo peso 400 por defecto)
    throwOnError: false,
    defaults: {
      weights: [400],
    },
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
        weights: [400],
        styles: ["normal"],
      },
      {
        name: "Caveat",
        provider: "google",
        weights: [600],
        styles: ["normal"],
      },
      {
        name: "Quicksand",
        provider: "google",
        weights: [600],
        styles: ["normal"],
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
    // Iconos dentro del bundle: sin peticiones a api.iconify.design en cada visita.
    // Las colecciones salen de los paquetes @iconify-json/* (devDependencies).
    clientBundle: {
      scan: {
        globInclude: ["app/**/*.{vue,ts}"],
      },
      sizeLimitKb: 512,
    },
  },
  runtimeConfig: {
    public: {
      // Clave de la Community License de PrimeUI (PrimeVue 5).
      // Se define en .env como NUXT_PUBLIC_PRIMEUI_LICENSE
      PRIMEUI_LICENSE: "",
    },
  },
  primevue: {
    // El tema va en su propio archivo: si se pone aqui, Nuxt lo serializa en la configuracion
    // publica (~150 KB en el HTML de cada visita).
    importTheme: { from: "@/themes/dulcetoxo.ts" },
    // Solo los componentes que se usan: el modulo mete en el HTML los estilos de todos los
    // componentes registrados (~490 KB con todos). Listbox se incluye aunque no se use como
    // componente porque la lista de recetas (recipe/List.vue) reutiliza sus clases p-listbox-*.
    // Al usar un componente nuevo de PrimeVue hay que anadirlo aqui.
    components: {
      include: [
        "Button", "Card", "Carousel", "CarouselContent", "CarouselItem", "CarouselNext", "CarouselPrev",
        "Checkbox", "Column", "ConfirmDialog", "ConfirmPopup", "DataTable", "DatePicker", "Dialog",
        "Divider", "Drawer", "FileUpload", "Form", "FormField", "Gallery", "GalleryContent",
        "GalleryFullScreen", "GalleryHeader", "GalleryItem", "InputNumber", "InputText", "Listbox",
        "Menu", "Message", "Password", "ProgressSpinner", "Rating", "Select", "Skeleton", "Step",
        "StepList", "StepPanel", "StepPanels", "Stepper", "Textarea", "Toast",
      ],
    },
    options: {
      ripple: true,
    },
  },
})
