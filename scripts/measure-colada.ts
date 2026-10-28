/**
 * Repeatable Pinia Colada phase-1 measurement.
 *
 * Build and serve production, then run this script twice (before / after):
 *
 *   bun run build
 *   PORT=3000 node .output/server/index.mjs
 *   bun scripts/measure-colada.ts --phase before
 *   bun scripts/measure-colada.ts --phase after
 *
 * Conditions (fixed):
 * - Production server (not `bun run dev`)
 * - Playwright route delay of 150 ms on `/api/**` only
 * - Median of 3 full executions
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { chromium, type BrowserContext, type Page, type Request } from "@playwright/test"
import { BACKEND_URL, resolveLocalDbPath } from "../tests/e2e/localDb"

const PHASE = process.argv.includes("--phase")
  ? process.argv[process.argv.indexOf("--phase") + 1]
  : "before"

const BASE_URL = process.env.MEASURE_BASE_URL ?? "http://localhost:3000"
const API_DELAY_MS = 150
const RUNS = 3
const ARTIFACTS_DIR = "/opt/cursor/artifacts"
const FRONTEND_ORIGIN = BASE_URL

const MEASURE_EMAIL = "colada-a@recipes-colada.local"
const MEASURE_EMAIL_B = "colada-b@recipes-colada.local"
const MEASURE_ADMIN_EMAIL = "colada-admin@recipes-colada.local"
const MEASURE_PASSWORD = "ColadaMeasure1a"

const RECIPE = {
  bica: "aaaaaaaa-1111-4111-8111-111111111111",
  lemon: "aaaaaaaa-2222-4222-8222-222222222222",
  apple: "aaaaaaaa-3333-4333-8333-333333333333",
  cookie: "bbbbbbbb-1111-4111-8111-111111111111",
  oat: "bbbbbbbb-2222-4222-8222-222222222222",
} as const

type ApiCall = { method: string; path: string }

type ScenarioResult = {
  id: string
  label: string
  contentMs: number
  extraMs?: number
  apiCalls: ApiCall[]
}

const SCENARIOS = [
  "1_cold_recipe",
  "2_same_category_other_recipe",
  "3_back_to_seen_recipe",
  "4_category_switch_and_back",
  "5_vote_and_favorite",
  "6_favorites_filter_open",
  "7_locale_switch_on_recipe",
] as const

const runSql = (dbPath: string, sql: string) => {
  execFileSync(
    "python3",
    [
      "-c",
      "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.executescript(sys.argv[2]); c.commit()",
      dbPath,
      sql,
    ],
    { stdio: "pipe" },
  )
}

const querySql = <T>(dbPath: string, sql: string): T[] => {
  const raw = execFileSync(
    "python3",
    [
      "-c",
      "import sqlite3,json,sys; c=sqlite3.connect(sys.argv[1]); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute(sys.argv[2])]))",
      dbPath,
      sql,
    ],
    { encoding: "utf8" },
  )
  return JSON.parse(raw) as T[]
}

const signUpIfMissing = async (dbPath: string, email: string, name: string, admin = false) => {
  const existing = querySql<{ id: string }>(
    dbPath,
    `SELECT id FROM users WHERE email = '${email.replaceAll("'", "''")}'`,
  )
  if (existing.length === 0) {
    const response = await fetch(`${BACKEND_URL}/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: FRONTEND_ORIGIN,
      },
      body: JSON.stringify({
        email,
        password: MEASURE_PASSWORD,
        name,
        first_name: "Colada",
        last_name: name,
        date_of_birth: "1990-01-01",
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`sign-up failed for ${email}: ${response.status} ${body}`)
    }
  }
  if (admin) {
    runSql(dbPath, `UPDATE users SET type = 1 WHERE email = '${email.replaceAll("'", "''")}';`)
  }
}

const seedRecipes = (dbPath: string) => {
  const now = Date.now()
  runSql(
    dbPath,
    `
    INSERT OR IGNORE INTO recipes (id, category_id, difficulty, prep_time, cook_time, created_at, updated_at)
    VALUES
      ('${RECIPE.bica}', 'sponge-cakes', 2, 15, 40, ${now}, ${now}),
      ('${RECIPE.lemon}', 'sponge-cakes', 3, 20, 45, ${now}, ${now}),
      ('${RECIPE.apple}', 'sponge-cakes', 2, 25, 50, ${now}, ${now}),
      ('${RECIPE.cookie}', 'cookies', 1, 10, 12, ${now}, ${now}),
      ('${RECIPE.oat}', 'cookies', 2, 15, 14, ${now}, ${now});

    INSERT OR IGNORE INTO recipe_locales (id, recipe_id, locale, slug, title, description) VALUES
      ('${RECIPE.bica}-es', '${RECIPE.bica}', 'es', 'bica', 'Bica', 'Bica gallega'),
      ('${RECIPE.bica}-en', '${RECIPE.bica}', 'en', 'bica', 'Bica', 'Galician sponge'),
      ('${RECIPE.bica}-gl', '${RECIPE.bica}', 'gl', 'bica', 'Bica', 'Bica galega'),
      ('${RECIPE.lemon}-es', '${RECIPE.lemon}', 'es', 'bizcocho-de-limon', 'Bizcocho de limón', 'Bizcocho de limón'),
      ('${RECIPE.lemon}-en', '${RECIPE.lemon}', 'en', 'lemon-sponge', 'Lemon sponge', 'Lemon sponge'),
      ('${RECIPE.lemon}-gl', '${RECIPE.lemon}', 'gl', 'bizcocho-de-limon', 'Bizcocho de limón', 'Bizcocho de limón'),
      ('${RECIPE.apple}-es', '${RECIPE.apple}', 'es', 'bizcocho-de-manzana', 'Bizcocho de manzana', 'Bizcocho de manzana'),
      ('${RECIPE.apple}-en', '${RECIPE.apple}', 'en', 'apple-sponge', 'Apple sponge', 'Apple sponge'),
      ('${RECIPE.apple}-gl', '${RECIPE.apple}', 'gl', 'bizcocho-de-manzana', 'Bizcocho de manzana', 'Bizcocho de manzana'),
      ('${RECIPE.cookie}-es', '${RECIPE.cookie}', 'es', 'galleta-de-chocolate', 'Galleta de chocolate', 'Galleta de chocolate'),
      ('${RECIPE.cookie}-en', '${RECIPE.cookie}', 'en', 'chocolate-cookie', 'Chocolate cookie', 'Chocolate cookie'),
      ('${RECIPE.cookie}-gl', '${RECIPE.cookie}', 'gl', 'galleta-de-chocolate', 'Galleta de chocolate', 'Galleta de chocolate'),
      ('${RECIPE.oat}-es', '${RECIPE.oat}', 'es', 'galleta-de-avea', 'Galleta de avena', 'Galleta de avena'),
      ('${RECIPE.oat}-en', '${RECIPE.oat}', 'en', 'oat-cookie', 'Oat cookie', 'Oat cookie'),
      ('${RECIPE.oat}-gl', '${RECIPE.oat}', 'gl', 'galleta-de-avea', 'Galleta de avea', 'Galleta de avea');
    `,
  )
}

const userIdByEmail = (dbPath: string, email: string): string => {
  const rows = querySql<{ id: string }>(
    dbPath,
    `SELECT id FROM users WHERE email = '${email.replaceAll("'", "''")}'`,
  )
  const id = rows[0]?.id
  if (!id) throw new Error(`user not found: ${email}`)
  return id
}

const cupcakeId = (dbPath: string): string => {
  const rows = querySql<{ recipe_id: string }>(
    dbPath,
    "SELECT recipe_id FROM recipe_locales WHERE locale = 'es' AND slug = 'cupcake-de-prueba' LIMIT 1",
  )
  const id = rows[0]?.recipe_id
  if (!id) throw new Error("cupcake fixture missing")
  return id
}

const resetMeasureUserState = (dbPath: string) => {
  const userId = userIdByEmail(dbPath, MEASURE_EMAIL)
  const cupcake = cupcakeId(dbPath)
  const now = Date.now()
  runSql(
    dbPath,
    `
    DELETE FROM recipe_ratings WHERE user_id = '${userId}';
    DELETE FROM recipe_favorites WHERE user_id = '${userId}';
    INSERT INTO recipe_favorites (user_id, recipe_id, created_at)
    VALUES ('${userId}', '${cupcake}', ${now});
    `,
  )
}

const apiPath = (url: string): string => {
  const parsed = new URL(url)
  return parsed.pathname
}

const isApiRequest = (request: Request): boolean => {
  const url = request.url()
  return url.includes("/api/") && !url.includes("vite") && request.resourceType() !== "preflight"
}

const attachApiDelay = async (page: Page, bucket: ApiCall[]) => {
  await page.route("**/api/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS))
    await route.continue()
  })
  page.on("request", (request) => {
    if (!isApiRequest(request)) return
    bucket.push({ method: request.method(), path: apiPath(request.url()) })
  })
}

const dismissObstructions = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => undefined)
}

const loginViaApi = async (context: BrowserContext) => {
  const response = await context.request.post(`${BASE_URL}/api/auth/sign-in/email`, {
    headers: {
      origin: BASE_URL,
      "content-type": "application/json",
    },
    data: {
      email: MEASURE_EMAIL,
      password: MEASURE_PASSWORD,
    },
  })
  if (!response.ok()) {
    throw new Error(`API login failed: ${response.status()} ${await response.text()}`)
  }
}

const waitTitle = async (page: Page, title: string) => {
  await page.getByTestId("recipe-title").waitFor({ state: "visible", timeout: 20_000 })
  await page.getByTestId("recipe-title").filter({ hasText: title }).waitFor({ timeout: 20_000 })
}

const selectCategory = async (page: Page, name: string) => {
  const select = page.locator(".p-select").last()
  await select.click()
  await page.getByRole("option", { name, exact: true }).click()
}

const contentFavorite = (page: Page) =>
  page.locator(".recipe-favorite-button:not(.recipe-favorite-button--compact)")

const measure = async <T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> => {
  const start = performance.now()
  const result = await fn()
  return { ms: Math.round(performance.now() - start), result }
}

const formatCalls = (calls: ApiCall[]): string =>
  calls.length === 0 ? "(ninguna)" : calls.map((call) => `${call.method} ${call.path}`).join(", ")

const medianIndex = (values: number[]): number => {
  const ranked = values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value)
  return ranked[Math.floor(ranked.length / 2)]?.index ?? 0
}

const runOnce = async (dbPath: string): Promise<ScenarioResult[]> => {
  resetMeasureUserState(dbPath)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-ES",
  })
  await context.addCookies([
    { name: "i18n_redirected", value: "es", url: FRONTEND_ORIGIN },
  ])
  await loginViaApi(context)

  const page = await context.newPage()
  const results: ScenarioResult[] = []
  const activeBucket: ApiCall[] = []
  await attachApiDelay(page, activeBucket)

  const runScenario = async (id: string, label: string, action: () => Promise<void>) => {
    activeBucket.length = 0
    const { ms } = await measure(async () => action())
    await page.waitForTimeout(500)
    results.push({ id, label, contentMs: ms, apiCalls: [...activeBucket] })
  }

  await runScenario("1_cold_recipe", "Entrar en frío en /es/bizcochos/bica", async () => {
    await page.goto(`${BASE_URL}/es/bizcochos/bica`, { waitUntil: "domcontentloaded" })
    await dismissObstructions(page)
    await waitTitle(page, "Bica")
    await page.getByTestId("recipe-sidebar-list").waitFor()
  })

  await runScenario(
    "2_same_category_other_recipe",
    "Cambiar a otra receta de la misma categoría",
    async () => {
      await page.locator('[data-recipe-slug="bizcocho-de-limon"]').click()
      await waitTitle(page, "Bizcocho de limón")
    },
  )

  await runScenario("3_back_to_seen_recipe", "Volver a una receta ya vista", async () => {
    await page.locator('[data-recipe-slug="bica"]').click()
    await waitTitle(page, "Bica")
  })

  await runScenario(
    "4_category_switch_and_back",
    "Cambiar de categoría con el selector y volver a la anterior",
    async () => {
      await selectCategory(page, "Galletas")
      await page.locator('[data-recipe-slug="galleta-de-avea"], [data-recipe-slug="galleta-de-chocolate"]').first().waitFor({ timeout: 20_000 })
      await selectCategory(page, "Bizcochos")
      await page.locator('[data-recipe-slug="bica"]').waitFor({ timeout: 20_000 })
    },
  )

  await page.locator('[data-recipe-slug="bica"]').click()
  await waitTitle(page, "Bica")

  await runScenario("5_vote_and_favorite", "Votar y marcar favorito", async () => {
    const voteStar = page.locator(".p-rating:not([data-disabled]) .p-rating-option").nth(3)
    await voteStar.click()
    await page.getByLabel("Quitar valoración").waitFor({ timeout: 20_000 })
    await contentFavorite(page).click()
    await page.locator('.recipe-favorite-button:not(.recipe-favorite-button--compact)[aria-pressed="true"]').waitFor({
      timeout: 20_000,
    })
  })

  await runScenario(
    "6_favorites_filter_open",
    "Entrar en favoritos, filtrar por categoría y abrir una receta",
    async () => {
      await page.getByTestId("header-profile-menu").click()
      await page.getByTestId("header-favorites-link").click()
      await page.getByTestId("favorites-sidebar-list").waitFor({ timeout: 20_000 })
      await selectCategory(page, "Cupcakes")
      await page.getByTestId("recipe-title").waitFor({ timeout: 20_000 })
      const title = (await page.getByTestId("recipe-title").textContent()) ?? ""
      if (!title.toLowerCase().includes("cupcake")) {
        await page.locator('[data-recipe-slug="cupcake-de-prueba"]').click()
        await waitTitle(page, "Cupcake de prueba")
      }
    },
  )

  await page.goto(`${BASE_URL}/es/bizcochos/bica`, { waitUntil: "domcontentloaded" })
  await waitTitle(page, "Bica")

  await runScenario("7_locale_switch_on_recipe", "Cambiar de idioma estando en una receta", async () => {
    await page.getByLabel("Cambiar idioma").dispatchEvent("mouseover")
    await page.getByText("Galego", { exact: true }).click()
    await page.getByText("Tempo de preparación: 15 min").waitFor({ timeout: 20_000 })
    await waitTitle(page, "Bica")
  })

  await browser.close()
  return results
}

const summarize = (runs: ScenarioResult[][]) => {
  return SCENARIOS.map((id) => {
    const samples = runs.map((run) => run.find((item) => item.id === id)).filter(Boolean) as ScenarioResult[]
    const times = samples.map((sample) => sample.contentMs)
    const medianRun = samples[medianIndex(times)]
    const counts = samples.map((sample) => sample.apiCalls.length)
    return {
      id,
      label: medianRun?.label ?? id,
      times,
      medianMs: medianRun?.contentMs ?? 0,
      requestCounts: counts,
      medianRequests: medianRun?.apiCalls.length ?? 0,
      medianCallList: medianRun?.apiCalls ?? [],
    }
  })
}

const renderTable = (rows: ReturnType<typeof summarize>): string => {
  const header =
    "| Escenario | Tiempos (ms) | Mediana ms | Nº peticiones (3 runs) | Mediana nº | Peticiones de la mediana |"
  const sep = "| --- | --- | ---: | --- | ---: | --- |"
  const body = rows.map((row) => {
    const times = row.times.join(" / ")
    const counts = row.requestCounts.join(" / ")
    return `| ${row.label} | ${times} | ${row.medianMs} | ${counts} | ${row.medianRequests} | ${formatCalls(row.medianCallList)} |`
  })
  return [header, sep, ...body].join("\n")
}

const main = async () => {
  if (PHASE !== "before" && PHASE !== "after") {
    throw new Error(`--phase must be before|after, got ${PHASE}`)
  }

  const ready = await fetch(BASE_URL).then((response) => response.ok).catch(() => false)
  if (!ready) {
    throw new Error(`Production server is not reachable at ${BASE_URL}`)
  }

  const dbPath = resolveLocalDbPath()
  console.log(`Using local db: ${dbPath}`)
  await signUpIfMissing(dbPath, MEASURE_EMAIL, "MeasureA")
  await signUpIfMissing(dbPath, MEASURE_EMAIL_B, "MeasureB")
  await signUpIfMissing(dbPath, MEASURE_ADMIN_EMAIL, "MeasureAdmin", true)
  seedRecipes(dbPath)

  const runs: ScenarioResult[][] = []
  for (let index = 0; index < RUNS; index += 1) {
    console.log(`\n=== run ${index + 1}/${RUNS} (${PHASE}) ===`)
    const result = await runOnce(dbPath)
    runs.push(result)
    for (const scenario of result) {
      console.log(
        `${scenario.id}: ${scenario.contentMs}ms, ${scenario.apiCalls.length} reqs -> ${formatCalls(scenario.apiCalls)}`,
      )
    }
  }

  const summary = summarize(runs)
  const table = renderTable(summary)
  const payload = {
    phase: PHASE,
    baseUrl: BASE_URL,
    apiDelayMs: API_DELAY_MS,
    runs: RUNS,
    measuredAt: new Date().toISOString(),
    summary,
    table,
    raw: runs,
  }

  mkdirSync(ARTIFACTS_DIR, { recursive: true })
  const jsonPath = `${ARTIFACTS_DIR}/measure-colada-${PHASE}.json`
  const mdPath = `${ARTIFACTS_DIR}/measure-colada-${PHASE}.md`
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`)
  writeFileSync(mdPath, `# Medición Pinia Colada (${PHASE})\n\n${table}\n`)
  console.log(`\n${table}\n`)
  console.log(`Wrote ${jsonPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
