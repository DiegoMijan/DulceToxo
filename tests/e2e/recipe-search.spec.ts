import { expect, test, type Page } from "@playwright/test"
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  FRONTEND_ORIGIN,
  USER_EMAIL,
  deleteE2eUsers,
  deleteSearchFixtures,
  prepareE2eUsers,
  seedSearchFixtures,
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

const openPalette = async (page: Page) => {
  await page.getByTestId("header-search-button").click()
  await expect(page.getByTestId("command-palette")).toBeVisible()
  await expect(page.getByTestId("command-palette-input")).toBeFocused()
}

const typeQuery = async (page: Page, query: string) => {
  await page.getByTestId("command-palette-input").fill(query)
  await expect(page.getByTestId("command-palette-option").first()).toBeVisible({ timeout: 8_000 })
}

let dbPath: string | undefined

test.beforeAll(async () => {
  dbPath = await prepareE2eUsers()
  seedSearchFixtures(dbPath, ADMIN_EMAIL)
})

test.afterAll(() => {
  if (!dbPath) return
  deleteSearchFixtures(dbPath)
  deleteE2eUsers(dbPath)
})

test.use({
  video: { mode: "on", size: { width: 1280, height: 720 } },
})

test.describe("recipe command palette", () => {
  test("search icon is hidden for guests and shown after login", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await page.goto("/")
    await dismissObstructions(page)
    await expect(page.getByTestId("header-search-button")).toHaveCount(0)

    await page.goto("/auth/login")
    await login(page, USER_EMAIL)
    await expect(page.getByTestId("header-search-button")).toBeVisible()
  })

  test("admin can search with accents, ingredients, keyboard and empty state", async ({ page }) => {
    test.setTimeout(120_000)
    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)

    await page.goto("/")
    await openPalette(page)
    await expect(page.getByText("Categorías", { exact: true })).toBeVisible()
    await expect(page.getByText("Favoritos", { exact: true })).toBeVisible()
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: "Cupcakes" }),
    ).toBeVisible()
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: "Tarta de limón" }),
    ).toBeVisible()

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_idle_gl_dark_desktop.png`,
      fullPage: true,
    })

    await typeQuery(page, "limon")
    const titleHit = page
      .getByTestId("command-palette-option")
      .filter({ hasText: "Tarta de limón" })
    const ingredientHit = page
      .getByTestId("command-palette-option")
      .filter({ hasText: "Bolo esponxoso" })
    await expect(titleHit).toBeVisible()
    await expect(ingredientHit).toBeVisible()
    await expect(page.getByText("Receitas", { exact: true })).toBeVisible()
    await expect(page.getByText("Por ingrediente", { exact: true })).toBeVisible()
    await expect(page.getByText("Ralladura de limón")).toBeVisible()
    await expect(page.locator("mark", { hasText: "limón" })).toBeVisible()

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_limon_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.getByTestId("command-palette-input").fill("limón")
    await expect(titleHit).toBeVisible()
    await expect(ingredientHit).toBeVisible()

    await page.getByTestId("command-palette-input").fill("tarta limon")
    await expect(titleHit).toBeVisible()
    await expect(ingredientHit).toHaveCount(0)

    await page.getByTestId("command-palette-input").fill("zzzz-no-match")
    await expect(page.getByTestId("command-palette-empty")).toContainText("zzzz-no-match")

    await page.getByTestId("command-palette-input").fill("limon")
    await expect(titleHit).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("command-palette")).toHaveCount(0)
    await expect(page).toHaveURL(/\/bolos\/bolo-de-limon-e2e\/?$/)
    await expect(page.getByTestId("recipe-title")).toHaveText("Bolo esponxoso")

    await page.keyboard.press("Control+k")
    await expect(page.getByTestId("command-palette")).toBeVisible()
    await expect(page.getByTestId("command-palette-input")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("command-palette")).toHaveCount(0)

    await page.getByLabel("Cambiar tema da páxina").click()
    await page.waitForTimeout(800)
    await openPalette(page)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_idle_gl_light_desktop.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")

    await setLocaleCookie(page, "es")
    await page.goto("/es")
    await openPalette(page)
    await typeQuery(page, "limon")
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: "Tarta de limón" }),
    ).toBeVisible()
    await expect(page.getByText("Recetas", { exact: true })).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_limon_es_light_desktop.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")

    await setLocaleCookie(page, "en")
    await page.goto("/en")
    await openPalette(page)
    await typeQuery(page, "lemon")
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: "Lemon tart" }),
    ).toBeVisible()
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: "Fluffy sponge cake" }),
    ).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_lemon_en_light_desktop.png`,
      fullPage: true,
    })
  })

  test("palette is fullscreen on mobile", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)
    await page.setViewportSize({ width: 390, height: 844 })
    await openPalette(page)
    await expect(page.getByTestId("command-palette")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/search_idle_gl_dark_mobile.png`,
      fullPage: true,
    })
  })
})
