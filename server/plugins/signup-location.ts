// Al registrarse, pasa al backend el pais y la region que Vercel calcula a partir de la IP
// (x-vercel-ip-country / x-vercel-ip-country-region). El backend recibe la peticion desde
// esta funcion, no desde el navegador, asi que no puede leerlos el mismo. Solo estadisticas.
// Va en el hook "request" (no en server/middleware) porque la regla de proxy de /api/**
// se ejecuta antes que los middlewares.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if (!event.path.startsWith("/api/auth/sign-up")) return

    const headers = event.node.req.headers
    // Lo que mande el navegador con estos nombres no vale: solo lo que diga Vercel
    delete headers["x-dt-signup-country"]
    delete headers["x-dt-signup-region"]

    const country = getRequestHeader(event, "x-vercel-ip-country")
    const region = getRequestHeader(event, "x-vercel-ip-country-region")
    if (country) headers["x-dt-signup-country"] = country
    if (region) headers["x-dt-signup-region"] = region
  })
})
