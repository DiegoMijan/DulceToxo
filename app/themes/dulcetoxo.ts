import Aura from "@primeuix/themes/aura-compat"

// Tema de PrimeVue: Aura con el primario en fucsia (la paleta de la web).
export default {
  preset: {
    ...Aura,
    semantic: {
      ...Aura.semantic,
      primary: {
        // En v5 primary incluye color, contrastColor, hoverColor...: hay que conservarlos
        ...Aura.semantic.primary,
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
    darkModeSelector: ".dark",
  },
}
