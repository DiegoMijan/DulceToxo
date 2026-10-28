// Caches del service worker con datos del usuario (ver app/service-worker/sw.ts).
// dt-shell solo guarda el HTML de la app, sin datos, y se conserva para poder abrirla sin red.
const USER_DATA_CACHES = ["dt-session", "dt-api", "dt-images"]

export const clearOfflineData = async () => {
  if (typeof caches === "undefined") return
  try {
    await Promise.all(USER_DATA_CACHES.map((name) => caches.delete(name)))
  } catch (error) {
    console.error("No se pudo borrar la cache sin conexion:", error)
  }
}
