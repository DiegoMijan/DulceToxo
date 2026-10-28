import { expect, test, type Page } from "@playwright/test"
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  FRONTEND_ORIGIN,
  RECENT_E2E_GONE,
  RECENT_E2E_RECIPES,
  USER_EMAIL,
  deleteE2eUsers,
  deleteRecentFixtures,
  deleteRecipeById,
  getUserIdByEmail,
  prepareE2eUsers,
  seedRecentFixtures,
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

const recentOptions = (page: Page) =>
  page.locator('[data-testid="command-palette-option"][data-kind="recent"]')

const recipePath = (
  recipe: (typeof RECENT_E2E_RECIPES)[number] | typeof RECENT_E2E_GONE,
  locale: "gl" | "es" | "en" = "gl",
) => {
  const prefix = locale === "gl" ? "" : `/${locale}`
  return `${prefix}/${recipe.categoryPath[locale]}/${recipe.slug[locale]}`
}

const openRecipe = async (
  page: Page,
  recipe: (typeof RECENT_E2E_RECIPES)[number] | typeof RECENT_E2E_GONE,
  locale: "gl" | "es" | "en" = "gl",
) => {
  await page.goto(recipePath(recipe, locale))
  await expect(page.getByTestId("recipe-title")).toHaveText(recipe.title[locale])
}

const expectRecentTitles = async (page: Page, titles: string[]) => {
  await expect(page.getByTestId("command-palette-group-recent")).toBeVisible()
  await expect(recentOptions(page)).toHaveCount(titles.length)
  for (const [index, title] of titles.entries()) {
    await expect(recentOptions(page).nth(index)).toContainText(title)
  }
}

const blockRecentStorage = async (page: Page) => {
  await page.addInitScript(() => {
    const proto = Storage.prototype
    const originalGet = proto.getItem
    const originalSet = proto.setItem
    const originalRemove = proto.removeItem
    const blocked = (key: string) => key.startsWith("dt-recent:")

    proto.getItem = function getItem(key) {
      if (blocked(String(key))) throw new DOMException("Access denied", "SecurityError")
      return originalGet.call(this, key)
    }
    proto.setItem = function setItem(key, value) {
      if (blocked(String(key))) throw new DOMException("Access denied", "SecurityError")
      return originalSet.call(this, key, value)
    }
    proto.removeItem = function removeItem(key) {
      if (blocked(String(key))) throw new DOMException("Access denied", "SecurityError")
      return originalRemove.call(this, key)
    }
  })
}

let dbPath: string | undefined

test.beforeAll(async () => {
  dbPath = await prepareE2eUsers()
  seedRecentFixtures(dbPath, ADMIN_EMAIL)
})

test.afterAll(() => {
  if (!dbPath) return
  deleteRecentFixtures(dbPath)
  deleteE2eUsers(dbPath)
})

test.use({
  video: { mode: "on", size: { width: 1280, height: 720 } },
})

test.describe("recently viewed recipes", () => {
  test("records order, skips duplicates, caps at 6 and clears the list", async ({ page }) => {
    test.setTimeout(120_000)
    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)

    await page.goto("/")
    await openPalette(page)
    await expect(page.getByTestId("command-palette-group-recent")).toHaveCount(0)
    await page.keyboard.press("Escape")

    const [first, second, third] = RECENT_E2E_RECIPES
    await openRecipe(page, first)
    await page
      .getByTestId("recipe-sidebar-list")
      .locator('[data-recipe-slug="recente-dous"]')
      .click()
    await expect(page.getByTestId("recipe-title")).toHaveText(second.title.gl)
    await openPalette(page)
    await page.getByTestId("command-palette-input").fill("recente tres")
    await expect(
      page.getByTestId("command-palette-option").filter({ hasText: third.title.gl }),
    ).toBeVisible({ timeout: 8_000 })
    await page.getByTestId("command-palette-option").filter({ hasText: third.title.gl }).click()
    await expect(page.getByTestId("recipe-title")).toHaveText(third.title.gl)

    await openPalette(page)
    await expectRecentTitles(page, [third.title.gl, second.title.gl, first.title.gl])
    await expect(recentOptions(page).nth(0)).toContainText(third.categoryName.gl)
    await page.keyboard.press("Escape")

    await openRecipe(page, first)
    await openPalette(page)
    await expectRecentTitles(page, [first.title.gl, third.title.gl, second.title.gl])
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(page.getByTestId("command-palette")).toHaveCount(0)
    await expect(page.getByTestId("recipe-title")).toHaveText(third.title.gl)

    for (const recipe of RECENT_E2E_RECIPES.slice(3)) {
      await openRecipe(page, recipe)
    }

    await openPalette(page)
    await expectRecentTitles(page, [
      RECENT_E2E_RECIPES[6].title.gl,
      RECENT_E2E_RECIPES[5].title.gl,
      RECENT_E2E_RECIPES[4].title.gl,
      RECENT_E2E_RECIPES[3].title.gl,
      third.title.gl,
      first.title.gl,
    ])
    await expect(recentOptions(page).filter({ hasText: second.title.gl })).toHaveCount(0)

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.getByTestId("command-palette-clear-recent").click()
    await expect(page.getByTestId("command-palette-group-recent")).toHaveCount(0)
    await expect(page.getByTestId("command-palette-input")).toBeFocused()
    await expect(page.getByText("Categorías", { exact: true })).toBeVisible()
  })

  test("shows localized titles and works on mobile light and dark", async ({ page }) => {
    test.setTimeout(90_000)
    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)

    await openRecipe(page, RECENT_E2E_RECIPES[3])
    await openRecipe(page, RECENT_E2E_RECIPES[4])

    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[4].title.gl, RECENT_E2E_RECIPES[3].title.gl])
    await expect(recentOptions(page).nth(0)).toContainText(RECENT_E2E_RECIPES[4].categoryName.gl)
    await page.keyboard.press("Escape")

    await page.getByLabel("Cambiar tema da páxina").click()
    await page.waitForTimeout(800)
    await openPalette(page)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_gl_light_desktop.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")
    await page.getByLabel("Cambiar tema da páxina").click()
    await page.waitForTimeout(800)

    await setLocaleCookie(page, "es")
    await page.goto("/es")
    await openPalette(page)
    await expect(page.getByText("Vistas recientemente", { exact: true })).toBeVisible()
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[4].title.es, RECENT_E2E_RECIPES[3].title.es])
    await expect(recentOptions(page).nth(0)).toContainText(RECENT_E2E_RECIPES[4].categoryName.es)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_es_dark_desktop.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")

    await setLocaleCookie(page, "en")
    await page.goto("/en")
    await page.getByLabel("Change page theme").click()
    await page.waitForTimeout(800)
    await openPalette(page)
    await expect(page.getByText("Recently viewed", { exact: true })).toBeVisible()
    await expect(page.getByText("Clear", { exact: true })).toBeVisible()
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[4].title.en, RECENT_E2E_RECIPES[3].title.en])
    await expect(recentOptions(page).nth(0)).toContainText(RECENT_E2E_RECIPES[4].categoryName.en)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_en_light_desktop.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")

    await page.setViewportSize({ width: 390, height: 844 })
    await openPalette(page)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_en_light_mobile.png`,
      fullPage: true,
    })
    await page.keyboard.press("Escape")

    await page.getByLabel("Change page theme").click()
    await page.waitForTimeout(800)
    await setLocaleCookie(page, "gl")
    await page.goto("/")
    await page.setViewportSize({ width: 390, height: 844 })
    await openPalette(page)
    await expect(page.getByText("Vistas recentemente", { exact: true })).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/recent_idle_gl_dark_mobile.png`,
      fullPage: true,
    })
  })

  test("keeps recents isolated per user in the same browser", async ({ page }) => {
    test.setTimeout(90_000)
    if (!dbPath) throw new Error("dbPath missing")
    const adminId = getUserIdByEmail(dbPath, ADMIN_EMAIL)
    const userId = getUserIdByEmail(dbPath, USER_EMAIL)

    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)
    await openRecipe(page, RECENT_E2E_RECIPES[0])
    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[0].title.gl])
    await page.keyboard.press("Escape")

    const adminStored = await page.evaluate(
      (id) => localStorage.getItem(`dt-recent:${id}`),
      adminId,
    )
    expect(adminStored).toContain(RECENT_E2E_RECIPES[0].id)

    await page.getByTestId("header-profile-menu").click()
    await page.getByTestId("header-sign-out").click()
    await expect(page.getByTestId("header-search-button")).toHaveCount(0)

    await page.goto("/auth/login")
    await login(page, USER_EMAIL)
    await openPalette(page)
    await expect(page.getByTestId("command-palette-group-recent")).toHaveCount(0)
    await page.keyboard.press("Escape")

    await openRecipe(page, RECENT_E2E_RECIPES[1])
    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[1].title.gl])
    await expect(
      recentOptions(page).filter({ hasText: RECENT_E2E_RECIPES[0].title.gl }),
    ).toHaveCount(0)
    await page.keyboard.press("Escape")

    const userStored = await page.evaluate((id) => localStorage.getItem(`dt-recent:${id}`), userId)
    expect(userStored).toContain(RECENT_E2E_RECIPES[1].id)
    expect(userStored).not.toContain(RECENT_E2E_RECIPES[0].id)

    await page.getByTestId("header-profile-menu").click()
    await page.getByTestId("header-sign-out").click()
    await page.goto("/auth/login")
    await login(page, ADMIN_EMAIL)
    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[0].title.gl])
    await expect(
      recentOptions(page).filter({ hasText: RECENT_E2E_RECIPES[1].title.gl }),
    ).toHaveCount(0)
  })

  test("removes a recent recipe that returns 404", async ({ page }) => {
    test.setTimeout(90_000)
    if (!dbPath) throw new Error("dbPath missing")

    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)
    await openRecipe(page, RECENT_E2E_GONE)
    await openRecipe(page, RECENT_E2E_RECIPES[0])

    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[0].title.gl, RECENT_E2E_GONE.title.gl])
    await page.keyboard.press("Escape")

    deleteRecipeById(dbPath, RECENT_E2E_GONE.id)

    await openPalette(page)
    await recentOptions(page).filter({ hasText: RECENT_E2E_GONE.title.gl }).click()
    await expect(page.getByRole("heading", { name: "Receita non atopada" })).toBeVisible()

    await openPalette(page)
    await expectRecentTitles(page, [RECENT_E2E_RECIPES[0].title.gl])
    await expect(recentOptions(page).filter({ hasText: RECENT_E2E_GONE.title.gl })).toHaveCount(0)
  })

  test("blocked localStorage does not show recents or errors", async ({ page }) => {
    await blockRecentStorage(page)
    await setLocaleCookie(page, "gl")
    await page.goto("/auth/login")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)

    await openRecipe(page, RECENT_E2E_RECIPES[0])
    await expect(page.getByTestId("recipe-title")).toHaveText(RECENT_E2E_RECIPES[0].title.gl)

    await openPalette(page)
    await expect(page.getByTestId("command-palette")).toBeVisible()
    await expect(page.getByTestId("command-palette-group-recent")).toHaveCount(0)
    await expect(page.getByText("Categorías", { exact: true })).toBeVisible()
    await expect(page.locator(".p-toast-message-error")).toHaveCount(0)
  })
})
