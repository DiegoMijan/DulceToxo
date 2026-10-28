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

export const SEARCH_E2E_PREFIX = "search-e2e-"
export const SEARCH_E2E_LEMON_TART_ID = `${SEARCH_E2E_PREFIX}lemon-tart`
export const SEARCH_E2E_SPONGE_ID = `${SEARCH_E2E_PREFIX}lemon-sponge`

const querySql = (dbPath: string, sql: string): unknown[][] => {
  const output = execFileSync(
    "python3",
    [
      "-c",
      "import sqlite3,sys,json; c=sqlite3.connect(sys.argv[1]); rows=c.execute(sys.argv[2]).fetchall(); print(json.dumps(rows))",
      dbPath,
      sql,
    ],
    { encoding: "utf8" },
  )
  return JSON.parse(output) as unknown[][]
}

export const getUserIdByEmail = (dbPath: string, email: string): string => {
  const rows = querySql(
    dbPath,
    `SELECT id FROM users WHERE email = '${email.replaceAll("'", "''")}'`,
  )
  const id = rows[0]?.[0]
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`User not found: ${email}`)
  }
  return id
}

export const deleteSearchFixtures = (dbPath: string) => {
  runSql(
    dbPath,
    `
    DELETE FROM recipe_favorites WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipe_ratings WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipe_ingredients WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipe_steps WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipe_images WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipe_locales WHERE recipe_id LIKE '${SEARCH_E2E_PREFIX}%';
    DELETE FROM recipes WHERE id LIKE '${SEARCH_E2E_PREFIX}%';
    `,
  )
}

export const seedSearchFixtures = (dbPath: string, adminEmail: string) => {
  deleteSearchFixtures(dbPath)
  const adminId = getUserIdByEmail(dbPath, adminEmail)
  const now = Date.now()

  runSql(
    dbPath,
    `
    INSERT INTO recipes (id, category_id, difficulty, prep_time, cook_time, author_id, created_at, updated_at)
    VALUES
      ('${SEARCH_E2E_LEMON_TART_ID}', 'cold-cakes', 3, 30, 0, '${adminId}', ${now}, ${now}),
      ('${SEARCH_E2E_SPONGE_ID}', 'sponge-cakes', 2, 20, 40, '${adminId}', ${now}, ${now});

    INSERT INTO recipe_locales (id, recipe_id, locale, slug, title, description)
    VALUES
      ('${SEARCH_E2E_LEMON_TART_ID}-es', '${SEARCH_E2E_LEMON_TART_ID}', 'es', 'tarta-de-limon-e2e', 'Tarta de limón', 'Tarta de limón de prueba'),
      ('${SEARCH_E2E_LEMON_TART_ID}-en', '${SEARCH_E2E_LEMON_TART_ID}', 'en', 'lemon-tart-e2e', 'Lemon tart', 'Test lemon tart'),
      ('${SEARCH_E2E_LEMON_TART_ID}-gl', '${SEARCH_E2E_LEMON_TART_ID}', 'gl', 'tarta-de-limon-e2e', 'Tarta de limón', 'Tarta de limón de proba'),
      ('${SEARCH_E2E_SPONGE_ID}-es', '${SEARCH_E2E_SPONGE_ID}', 'es', 'bizcocho-de-limon-e2e', 'Bizcocho esponjoso', 'Bizcocho con ralladura'),
      ('${SEARCH_E2E_SPONGE_ID}-en', '${SEARCH_E2E_SPONGE_ID}', 'en', 'lemon-sponge-e2e', 'Fluffy sponge cake', 'Sponge with lemon zest'),
      ('${SEARCH_E2E_SPONGE_ID}-gl', '${SEARCH_E2E_SPONGE_ID}', 'gl', 'bolo-de-limon-e2e', 'Bolo esponxoso', 'Bolo con ralladura');

    INSERT INTO recipe_ingredients (id, recipe_id, locale, "order", description, is_heading)
    VALUES
      ('${SEARCH_E2E_LEMON_TART_ID}-es-1', '${SEARCH_E2E_LEMON_TART_ID}', 'es', 1, 'Galletas trituradas', 0),
      ('${SEARCH_E2E_LEMON_TART_ID}-en-1', '${SEARCH_E2E_LEMON_TART_ID}', 'en', 1, 'Crushed biscuits', 0),
      ('${SEARCH_E2E_LEMON_TART_ID}-gl-1', '${SEARCH_E2E_LEMON_TART_ID}', 'gl', 1, 'Galletas tritadas', 0),
      ('${SEARCH_E2E_SPONGE_ID}-es-1', '${SEARCH_E2E_SPONGE_ID}', 'es', 1, 'Harina', 0),
      ('${SEARCH_E2E_SPONGE_ID}-es-2', '${SEARCH_E2E_SPONGE_ID}', 'es', 2, 'Ralladura de limón', 0),
      ('${SEARCH_E2E_SPONGE_ID}-en-1', '${SEARCH_E2E_SPONGE_ID}', 'en', 1, 'Flour', 0),
      ('${SEARCH_E2E_SPONGE_ID}-en-2', '${SEARCH_E2E_SPONGE_ID}', 'en', 2, 'Lemon zest', 0),
      ('${SEARCH_E2E_SPONGE_ID}-gl-1', '${SEARCH_E2E_SPONGE_ID}', 'gl', 1, 'Fariña', 0),
      ('${SEARCH_E2E_SPONGE_ID}-gl-2', '${SEARCH_E2E_SPONGE_ID}', 'gl', 2, 'Ralladura de limón', 0);

    INSERT INTO recipe_favorites (user_id, recipe_id, created_at)
    VALUES ('${adminId}', '${SEARCH_E2E_LEMON_TART_ID}', ${now});
    `,
  )
}
