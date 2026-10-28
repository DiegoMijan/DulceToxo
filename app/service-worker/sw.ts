/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"
import { CacheFirst, NetworkFirst } from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"

declare let self: ServiceWorkerGlobalScope

// Los nombres empiezan por "dt-": al cerrar sesion se borran todas (useAuth.signOut)
const SHELL_CACHE = "dt-shell"
const SESSION_CACHE = "dt-session"
const API_CACHE = "dt-api"
const IMAGES_CACHE = "dt-images"

// Con red lenta se espera esto antes de tirar de cache
const NETWORK_TIMEOUT_SECONDS = 5
const DAY = 60 * 60 * 24

// JS, CSS, fuentes e iconos del build
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// La primera instalacion controla ya la pagina abierta, para que lo que se vea desde
// ese momento quede guardado. Las actualizaciones esperan a que el usuario acepte.
clientsClaim()
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})

// Navegacion: es una SPA, el HTML es el mismo para todas las rutas, asi que se guarda
// una sola copia y sin red se sirve para cualquier URL.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: SHELL_CACHE,
      networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
      plugins: [
        { cacheKeyWillBeUsed: async () => "/__dt-shell" },
        new CacheableResponsePlugin({ statuses: [200] }),
      ],
    }),
    { denylist: [/^\/api\//] },
  ),
)

const isSameOriginApiGet = (url: URL, request: Request) =>
  url.origin === self.location.origin
  && url.pathname.startsWith("/api/")
  && request.method === "GET"

// Sesion: sin red se usa la ultima conocida, para no mandar al login
registerRoute(
  ({ url, request }) => isSameOriginApiGet(url, request) && url.pathname === "/api/auth/get-session",
  new NetworkFirst({
    cacheName: SESSION_CACHE,
    networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
)

// Datos (categorias, listas, recetas, favoritos, busquedas): red primero, cache sin red.
// Solo GET y respuestas 200: un 401 o 404 nunca se guarda.
registerRoute(
  ({ url, request }) => isSameOriginApiGet(url, request) && !url.pathname.startsWith("/api/auth/"),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * DAY, purgeOnQuotaError: true }),
    ],
  }),
)

// Fotos de Cloudinary: una URL nunca cambia de contenido, cache primero.
// Estado 0: las <img> sin CORS dan respuestas opacas.
registerRoute(
  ({ url, request }) => url.hostname === "res.cloudinary.com" && request.destination === "image",
  new CacheFirst({
    cacheName: IMAGES_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * DAY, purgeOnQuotaError: true }),
    ],
  }),
)
