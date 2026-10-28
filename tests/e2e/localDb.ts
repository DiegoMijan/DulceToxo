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

export const TRANSLATE_FILLED_RECIPE_ID = "e2e-translate-filled"
export const TRANSLATE_BLANK_RECIPE_ID = "e2e-translate-blank"

export const deleteE2eTranslateRecipes = (dbPath: string) => {
  runSql(
    dbPath,
    `
    DELETE FROM recipe_favorites WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipe_ratings WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipe_images WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipe_ingredients WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipe_steps WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipe_locales WHERE recipe_id LIKE 'e2e-translate-%';
    DELETE FROM recipes WHERE id LIKE 'e2e-translate-%';
    `,
  )
}

export const createE2eTranslateRecipes = (dbPath: string) => {
  deleteE2eTranslateRecipes(dbPath)
  runSql(
    dbPath,
    `
    INSERT INTO recipes (id, category_id, difficulty, prep_time, cook_time, author_id, created_at, updated_at)
    SELECT '${TRANSLATE_FILLED_RECIPE_ID}', 'cupcakes', 2, 10, 20, id, 1790000000000, 1790000000000
    FROM users WHERE email = '${ADMIN_EMAIL}';

    INSERT INTO recipes (id, category_id, difficulty, prep_time, cook_time, author_id, created_at, updated_at)
    SELECT '${TRANSLATE_BLANK_RECIPE_ID}', 'cupcakes', 2, 10, 20, id, 1790000000001, 1790000000001
    FROM users WHERE email = '${ADMIN_EMAIL}';

    INSERT INTO recipe_locales (id, recipe_id, locale, slug, title, description) VALUES
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 'e2e-translate-bolo', 'Bolo de limón', 'Un bolo de proba'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 'e2e-translate-bizcocho', 'Bizcocho de limón', 'Un bizcocho de prueba'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 'e2e-translate-sponge', 'Lemon sponge', 'A test sponge cake'),
      ('${TRANSLATE_BLANK_RECIPE_ID}-gl', '${TRANSLATE_BLANK_RECIPE_ID}', 'gl', 'e2e-translate-tarta', 'Tarta de queixo', 'Unha tarta de proba'),
      ('${TRANSLATE_BLANK_RECIPE_ID}-es', '${TRANSLATE_BLANK_RECIPE_ID}', 'es', 'e2e-translate-tarta-es', '', ''),
      ('${TRANSLATE_BLANK_RECIPE_ID}-en', '${TRANSLATE_BLANK_RECIPE_ID}', 'en', 'e2e-translate-tarta-en', '', '');

    INSERT INTO recipe_ingredients (id, recipe_id, locale, "order", description, is_heading) VALUES
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl-ing-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 1, 'Para o recheo', 1),
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl-ing-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 2, '200 g de queixo', 0),
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl-ing-3', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 3, '', 0),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es-ing-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 1, 'Para el relleno', 1),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es-ing-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 2, '200 g de queso', 0),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es-ing-3', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 3, 'texto previo', 0),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en-ing-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 1, 'For the filling', 1),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en-ing-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 2, '200 g of cheese', 0),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en-ing-3', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 3, 'previous text', 0),
      ('${TRANSLATE_BLANK_RECIPE_ID}-gl-ing-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'gl', 1, 'Para a base', 1),
      ('${TRANSLATE_BLANK_RECIPE_ID}-gl-ing-2', '${TRANSLATE_BLANK_RECIPE_ID}', 'gl', 2, '100 g de galletas', 0),
      ('${TRANSLATE_BLANK_RECIPE_ID}-es-ing-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'es', 1, '', 1),
      ('${TRANSLATE_BLANK_RECIPE_ID}-es-ing-2', '${TRANSLATE_BLANK_RECIPE_ID}', 'es', 2, '', 0),
      ('${TRANSLATE_BLANK_RECIPE_ID}-en-ing-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'en', 1, '', 1),
      ('${TRANSLATE_BLANK_RECIPE_ID}-en-ing-2', '${TRANSLATE_BLANK_RECIPE_ID}', 'en', 2, '', 0);

    INSERT INTO recipe_steps (id, recipe_id, locale, "order", description) VALUES
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl-step-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 1, 'Mesturar os ingredientes'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-gl-step-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'gl', 2, ''),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es-step-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 1, 'Mezclar los ingredientes'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-es-step-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'es', 2, 'paso previo'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en-step-1', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 1, 'Mix the ingredients'),
      ('${TRANSLATE_FILLED_RECIPE_ID}-en-step-2', '${TRANSLATE_FILLED_RECIPE_ID}', 'en', 2, 'previous step'),
      ('${TRANSLATE_BLANK_RECIPE_ID}-gl-step-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'gl', 1, 'Triturar as galletas'),
      ('${TRANSLATE_BLANK_RECIPE_ID}-es-step-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'es', 1, ''),
      ('${TRANSLATE_BLANK_RECIPE_ID}-en-step-1', '${TRANSLATE_BLANK_RECIPE_ID}', 'en', 1, '');
    `,
  )
}

export const prepareE2eUsers = async () => {
  const dbPath = resolveLocalDbPath()
  deleteE2eUsers(dbPath)
  await signUp(USER_EMAIL, "User")
  await signUp(ADMIN_EMAIL, "Admin")
  promoteAdmin(dbPath, ADMIN_EMAIL)
  return dbPath
}
