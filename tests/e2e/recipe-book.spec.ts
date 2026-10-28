import { expect, test, type Page } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  FRONTEND_ORIGIN,
  USER_EMAIL,
  deleteE2eUsers,
  getUserIdByEmail,
  prepareE2eUsers,
} from "./localDb"

const ARTIFACTS_DIR = "/opt/cursor/artifacts"

const dismissObstructions = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => undefined)
}

const setLocaleCookie = async (page: Page, locale: string) => {
  await page.context().addCookies([
    {
      name: "i18n_redirected",
      value: locale,
      url: FRONTEND_ORIGIN,
    },
  ])
}

const login = async (page: Page, email: string) => {
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.keyboard.press("Escape")
  await page.getByTestId("login-submit").click({ force: true })
  await expect(page.getByTestId("header-profile-menu")).toBeVisible()
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
    { stdio: "pipe" },
  )
}

const renderPdfPages = (pdfPath: string, prefix: string) => {
  execFileSync(
    "python3",
    [
      "-c",
      `
import sys
import pypdfium2 as pdfium
src, prefix = sys.argv[1], sys.argv[2]
doc = pdfium.PdfDocument(src)
for index in range(min(3, len(doc))):
    page = doc[index]
    bitmap = page.render(scale=2)
    pil = bitmap.to_pil()
    pil.save(f"{prefix}_page_{index + 1}.png")
print(len(doc))
`,
      pdfPath,
      prefix,
    ],
    { encoding: "utf8" },
  )
}

const seedFavorites = (dbPath: string) => {
  const adminId = getUserIdByEmail(dbPath, ADMIN_EMAIL)
  const userId = getUserIdByEmail(dbPath, USER_EMAIL)
  const now = Date.now()
  runSql(
    dbPath,
    `
    DELETE FROM recipe_favorites WHERE user_id IN ('${adminId}', '${userId}');
    INSERT INTO recipe_favorites (user_id, recipe_id, created_at) VALUES
      ('${adminId}', 'rb-e2e-cup-vainilla', ${now}),
      ('${adminId}', 'rb-e2e-cup-chocolate', ${now + 1}),
      ('${adminId}', 'rb-e2e-cup-limon', ${now + 2}),
      ('${adminId}', 'rb-e2e-coo-chips', ${now + 3}),
      ('${userId}', 'rb-e2e-cup-vainilla', ${now}),
      ('${userId}', 'rb-e2e-coo-avena', ${now + 1});
    `,
  )
}

let dbPath: string | undefined

test.beforeAll(async () => {
  mkdirSync(ARTIFACTS_DIR, { recursive: true })
  dbPath = await prepareE2eUsers()
  seedFavorites(dbPath)
})

test.afterAll(() => {
  if (dbPath) deleteE2eUsers(dbPath)
})

test.describe("recipe book pdf", () => {
  test("admin can open the modal, pick recipes, download with batch, and cancel", async ({
    page,
  }) => {
    test.setTimeout(180_000)
    const batchUrls: string[] = []
    const recipeGets: string[] = []
    page.on("request", (request) => {
      const url = request.url()
      if (request.method() === "POST" && url.includes("/recipes/batch")) {
        batchUrls.push(url)
      }
      if (request.method() === "GET" && /\/recipes\/[^/?]+$/.test(new URL(url).pathname)) {
        recipeGets.push(url)
      }
    })

    await setLocaleCookie(page, "gl")
    await page.goto("/cupcakes")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)
    await expect(page.getByTestId("recipe-book-download-button")).toBeVisible()
    await page.getByTestId("recipe-book-download-button").click()
    await expect(page.getByTestId("recipe-book-dialog")).toBeVisible()
    await expect(page.getByText("Descargar recetario · Cupcakes")).toBeVisible()
    await expect(page.getByTestId("recipe-book-mode-all")).toBeVisible()
    await expect(page.getByTestId("recipe-book-mode-pick")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_todas_gl_oscuro_desktop.png`,
    })

    await page.getByTestId("recipe-book-mode-pick").click()
    await expect(page.getByTestId("recipe-book-recipe-list")).toBeVisible()
    await page.getByTestId("recipe-book-select-none").click()
    await page.getByTestId("recipe-book-recipe-list").locator("label").nth(0).click()
    await page.getByTestId("recipe-book-recipe-list").locator("label").nth(1).click()
    await page.getByTestId("recipe-book-recipe-list").locator("label").nth(2).click()
    await expect(page.getByTestId("recipe-book-confirm")).toContainText("3")
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_elegir_3_gl_oscuro_desktop.png`,
    })

    await page.getByTestId("recipe-book-search").fill("vainilla")
    await expect(page.getByTestId("recipe-book-recipe-list").locator("label")).toHaveCount(1)

    await page.getByTestId("recipe-book-mode-all").click()
    await page.route("**/recipes/batch", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 })
    const started = Date.now()
    await page.getByTestId("recipe-book-confirm").click()
    await expect(page.getByTestId("recipe-book-progress")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_progreso_gl_oscuro_desktop.png`,
    })
    const download = await downloadPromise
    const elapsedMs = Date.now() - started
    const pdfPath = `${ARTIFACTS_DIR}/Dulce_Toxo_Cupcakes.pdf`
    await download.saveAs(pdfPath)
    const sizeBytes = Number(
      execFileSync("python3", ["-c", "import os,sys; print(os.path.getsize(sys.argv[1]))", pdfPath], {
        encoding: "utf8",
      }).trim(),
    )
    writeFileSync(
      `${ARTIFACTS_DIR}/recetario_medicion.txt`,
      `elapsed_ms=${elapsedMs}\nsize_bytes=${sizeBytes}\nsize_mb=${(sizeBytes / (1024 * 1024)).toFixed(2)}\nbatch_posts=${batchUrls.length}\nsingle_gets_after_open=${recipeGets.length}\n`,
    )
    renderPdfPages(pdfPath, `${ARTIFACTS_DIR}/recetario_pdf`)
    execFileSync(
      "python3",
      [
        "-c",
        `
import pypdfium2 as pdfium, sys
src=sys.argv[1]
doc=pdfium.PdfDocument(src)
names=['portada','indice','receta']
for index, name in enumerate(names):
    if index >= len(doc):
        break
    pil = doc[index].render(scale=2).to_pil()
    pil.save(f"/opt/cursor/artifacts/recetario_pdf_{name}.png")
`,
        pdfPath,
      ],
      { stdio: "pipe" },
    )
    expect(batchUrls.length).toBeGreaterThan(0)
    expect(elapsedMs).toBeGreaterThan(0)
    expect(sizeBytes).toBeGreaterThan(10_000)

    await page.unroute("**/recipes/batch")
    await page.getByTestId("recipe-book-download-button").click()
    await expect(page.getByTestId("recipe-book-dialog")).toBeVisible()
    await page.route("**/recipes/batch", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      await route.continue()
    })
    const cancelledDownloads: string[] = []
    page.on("download", (item) => cancelledDownloads.push(item.suggestedFilename()))
    await page.getByTestId("recipe-book-confirm").click()
    await expect(page.getByTestId("recipe-book-progress")).toBeVisible()
    await page.getByTestId("recipe-book-cancel").click()
    await expect(page.getByTestId("recipe-book-progress")).toHaveCount(0)
    await page.waitForTimeout(500)
    expect(cancelledDownloads).toHaveLength(0)
    await page.getByTestId("recipe-book-close").click()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => window.matchMedia("(max-width: 640px)").matches)
    await page.getByTestId("recipe-book-download-button").click()
    const mobileDialog = page.getByTestId("recipe-book-dialog")
    await expect(mobileDialog).toBeVisible()
    const mobileBox = await mobileDialog.boundingBox()
    expect(mobileBox).toBeTruthy()
    expect(mobileBox!.x).toBeLessThan(2)
    expect(mobileBox!.y).toBeLessThan(2)
    expect(mobileBox!.width).toBeGreaterThan(380)
    expect(mobileBox!.height).toBeGreaterThan(800)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_movil_fullscreen_gl.png`,
    })
    await page.keyboard.press("Escape")

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator(".theme-toggle").click()
    await page.getByTestId("recipe-book-download-button").click()
    await expect(page.getByTestId("recipe-book-dialog")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_todas_gl_claro_desktop.png`,
    })
  })

  test("normal user can download from favorites with and without category filter", async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await setLocaleCookie(page, "es")
    await page.goto("/es/auth/login")
    await dismissObstructions(page)
    await login(page, USER_EMAIL)
    await page.goto("/es/favoritos/todas")
    await expect(page.getByTestId("recipe-book-download-button")).toBeVisible()
    await page.getByTestId("recipe-book-download-button").click()
    await expect(page.getByText("Descargar recetario · Favoritos")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_favoritos_es_oscuro.png`,
    })
    await page.keyboard.press("Escape")

    await page.goto("/en/favorites/cupcakes")
    await expect(page.getByTestId("recipe-book-download-button")).toBeVisible()
    await page.getByTestId("recipe-book-download-button").click()
    await expect(page.getByText("Download recipe book · Favorites")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recetario_modal_favoritos_filtro_en.png`,
    })
  })
})
