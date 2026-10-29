<script setup lang="ts">
  // Captcha de Cloudflare Turnstile. Sin clave de sitio (local, tests) no se pinta nada y el
  // backend tampoco lo exige.
  interface TurnstileApi {
    render: (element: HTMLElement, options: Record<string, unknown>) => string
    reset: (widgetId?: string) => void
    remove: (widgetId?: string) => void
  }

  const token = defineModel<string>({ default: "" })

  const config = useRuntimeConfig()
  const siteKey = computed(() => String(config.public.turnstileSiteKey || ""))
  const colorMode = useColorMode()
  const { locale } = useI18n()
  const container = useTemplateRef<HTMLElement>("container")
  let widgetId: string | undefined

  const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  const loadScript = () =>
    new Promise<TurnstileApi>((resolve, reject) => {
      const win = window as unknown as { turnstile?: TurnstileApi }
      if (win.turnstile) return resolve(win.turnstile)
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
      if (!script) {
        script = document.createElement("script")
        script.src = SCRIPT_SRC
        script.async = true
        document.head.appendChild(script)
      }
      script.addEventListener("load", () => (win.turnstile ? resolve(win.turnstile) : reject(new Error("turnstile"))))
      script.addEventListener("error", () => reject(new Error("turnstile")))
    })

  onMounted(async () => {
    if (!siteKey.value || !container.value) return
    try {
      const turnstile = await loadScript()
      widgetId = turnstile.render(container.value, {
        sitekey: siteKey.value,
        theme: colorMode.value === "dark" ? "dark" : "light",
        language: locale.value,
        callback: (value: string) => (token.value = value),
        "expired-callback": () => (token.value = ""),
        "error-callback": () => (token.value = ""),
      })
    } catch (error) {
      console.error("No se pudo cargar Turnstile:", error)
    }
  })

  onBeforeUnmount(() => {
    const win = window as unknown as { turnstile?: TurnstileApi }
    if (widgetId) win.turnstile?.remove(widgetId)
  })

  // Cada token sirve una sola vez: tras un intento fallido hay que pedir otro
  const reset = () => {
    token.value = ""
    const win = window as unknown as { turnstile?: TurnstileApi }
    if (widgetId) win.turnstile?.reset(widgetId)
  }

  defineExpose({ reset, enabled: siteKey })
</script>

<template>
  <div
    v-if="siteKey"
    ref="container"
    class="flex justify-center"
    data-testid="auth-turnstile"
  />
</template>
