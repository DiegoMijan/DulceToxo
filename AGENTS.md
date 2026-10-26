# Dulce Toxo (front)

Web de recetas de reposteria en gallego, castellano e ingles. Backend en el repo `dulce-toxo-backend`.

## Stack
- Nuxt 4 en modo SPA (`ssr: false`), codigo en `app/`, tipos y schemas compartidos en `shared/`
- PrimeVue 5 (tema aura-compat, primario fucsia; licencia Community en NUXT_PUBLIC_PRIMEUI_LICENSE) + @primevue/forms con resolver de valibot
- Tailwind 4, SCSS, Pinia (+ persistedstate), VueUse, @nuxtjs/i18n (locale por defecto `gl`)
- better-auth (cliente) en `app/composables/useAuth.ts`
- Gestor de paquetes: bun. Formato con Biome, lint con ESLint

## Comandos
- `bun run dev`: puerto 3000. Necesita el backend en `BACKEND_URL` (normalmente http://localhost:4000)
- `bun run lint`, `bun run format`

## Contrato con el backend
- Todas las llamadas van a `/api/**`; el proxy de `nuxt.config.ts` las reenvia al backend quitando `/api`.
- El backend es el dueño del contrato. Los tipos de la API se generan desde `${BACKEND_URL}/_openapi.json`; no escribir a mano tipos de respuestas.
- Si hace falta un endpoint o un cambio de respuesta, pedirlo al backend; no inventar respuestas mock nuevas.

## Reglas
- No tocar el repo del backend.
- Todo texto visible va por i18n con claves en `i18n/locales/{gl,es,en}.json` (las tres a la vez).
- Seguir las reglas de `.cursor/rules` (componentes, CSS, HTML, i18n, commits).
- Trabajar en ramas y abrir PR. No hacer push a main.
- No leer ni modificar `.env`.
