import type { Context, Next } from "hono"
import { auth } from "../lib/auth"

export interface AuthContext {
  user: {
    id: string
    email: string
    name: string
    type: number
    first_name?: string
    last_name?: string
    date_of_birth?: string
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
  }
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

/**
 * Middleware that requires an authenticated user session.
 * Sets c.var.auth with user and session data.
 */
export async function requireUser(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session?.user) {
    return c.json({ error: "Unauthorized", message: "Authentication required" }, 401)
  }

  c.set("auth", {
    user: session.user as AuthContext["user"],
    session: session.session,
  })

  await next()
}

/**
 * Middleware that requires an authenticated admin user (type === 1).
 * User types: 0 = regular user, 1 = admin.
 */
export async function requireAdmin(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session?.user) {
    return c.json({ error: "Unauthorized", message: "Authentication required" }, 401)
  }

  const user = session.user as AuthContext["user"]
  
  if (user.type !== 1) {
    return c.json({ error: "Forbidden", message: "Admin access required" }, 403)
  }

  c.set("auth", {
    user,
    session: session.session,
  })

  await next()
}
