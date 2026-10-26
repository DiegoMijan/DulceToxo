import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "./lib/auth"
import categoriesRoutes from "./routes/categories"
import recipesRoutes from "./routes/recipes"
import uploadsRoutes from "./routes/uploads"

const app = new Hono()

// Middleware
app.use("*", logger())
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
)

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw)
})

// API routes
app.route("/categories", categoriesRoutes)
app.route("/recipes", recipesRoutes)
app.route("/uploads", uploadsRoutes)

// Health check
app.get("/health", (c) => c.json({ status: "ok" }))

// 404 handler
app.notFound((c) => c.json({ error: "Not Found", message: "Route not found" }, 404))

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err)
  return c.json({ error: "Internal Server Error", message: err.message }, 500)
})

const port = Number(process.env.PORT) || 4000
console.log(`Server starting on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}
