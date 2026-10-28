import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"

const E2E_EMAIL_SUFFIX = "@recipes-auth-e2e.local"

export const USER_EMAIL = `user${E2E_EMAIL_SUFFIX}`
export const ADMIN_EMAIL = `admin${E2E_EMAIL_SUFFIX}`
export const E2E_PASSWORD = "RecipesAuth1a"
const backendPort = process.env.BACKEND_PORT ?? "4000"
const frontendPort = process.env.FRONTEND_PORT ?? "3000"
export const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:${backendPort}`
export const FRONTEND_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${frontendPort}`

const tursoUrlFromPart = (part: string): string | null => {
  if (!part.startsWith("TURSO_URL=")) return null
  const url = part.slice("TURSO_URL=".length)
  return url.length > 0 ? url : null
}

const tursoUrlsFromEnviron = (env: string, urls: Set<string>) => {
  for (const part of env.split("\0")) {
    const url = tursoUrlFromPart(part)
    if (url) urls.add(url)
  }
}

const collectTursoUrls = (): string[] => {
  const urls = new Set<string>()
  if (process.env.TURSO_URL) urls.add(process.env.TURSO_URL)

  for (const pid of readdirSync("/proc")) {
    if (!/^\d+$/.test(pid)) continue
    try {
      tursoUrlsFromEnviron(readFileSync(`/proc/${pid}/environ`, "utf8"), urls)
    } catch {
      // Process disappeared or environ is unreadable.
    }
  }

  return [...urls]
}

export const resolveLocalDbPath = (): string => {
  const urls = collectTursoUrls()
  if (urls.length === 0) {
    throw new Error("TURSO_URL not found; refusing to create test data")
  }

  for (const url of urls) {
    if (!url.startsWith("file:") || !url.includes("local.db")) {
      throw new Error(`Refusing to create test data: TURSO_URL is ${url}`)
    }
  }

  const dbUrl = urls[0]
  if (!dbUrl) {
    throw new Error("TURSO_URL not found; refusing to create test data")
  }

  return dbUrl.replace(/^file:/, "")
}

const runSql = (dbPath: string, sql: string) => {
  execFileSync(
    "python3",
    [
      "-c",
      "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.executescript(sys.argv[2]); c.commit()",
      dbPath,
      sql,
    ],
    {
      stdio: "pipe",
    },
  )
}

export const deleteE2eUsers = (dbPath: string) => {
  runSql(
    dbPath,
    `
    DELETE FROM recipe_favorites WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%${E2E_EMAIL_SUFFIX}');
    DELETE FROM recipe_ratings WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%${E2E_EMAIL_SUFFIX}');
    DELETE FROM users WHERE email LIKE '%${E2E_EMAIL_SUFFIX}';
    `,
  )
}

export const promoteAdmin = (dbPath: string, email: string) => {
  runSql(dbPath, `UPDATE users SET type = 1 WHERE email = '${email.replaceAll("'", "''")}';`)
}

export const signUp = async (email: string, name: string) => {
  const response = await fetch(`${BACKEND_URL}/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: FRONTEND_ORIGIN,
    },
    body: JSON.stringify({
      email,
      password: E2E_PASSWORD,
      name,
      first_name: "E2E",
      last_name: name,
      date_of_birth: "1990-01-01",
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`sign-up failed for ${email}: ${response.status} ${body}`)
  }
}

export const prepareE2eUsers = async () => {
  const dbPath = resolveLocalDbPath()
  deleteE2eUsers(dbPath)
  await signUp(USER_EMAIL, "User")
  await signUp(ADMIN_EMAIL, "Admin")
  promoteAdmin(dbPath, ADMIN_EMAIL)
  return dbPath
}
