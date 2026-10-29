// El backend recibe las peticiones desde esta funcion (proxy de /api), asi que no ve la IP del
// usuario. Para su limite de intentos se la pasamos en x-dt-client-ip, tomada de lo que pone
// Vercel (x-real-ip / x-forwarded-for, que el navegador no puede falsear en Vercel).
// Va en el hook "request" porque la regla de proxy de /api/** se ejecuta antes que los middlewares.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if (!event.path.startsWith("/api/auth/")) return

    const headers = event.node.req.headers
    delete headers["x-dt-client-ip"]

    const forwarded = getRequestHeader(event, "x-forwarded-for")?.split(",")[0]?.trim()
    const ip = getRequestHeader(event, "x-real-ip") || forwarded
    if (ip) headers["x-dt-client-ip"] = ip
  })
})
