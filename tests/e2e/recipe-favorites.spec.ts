import { expect, test, type Page } from "@playwright/test"
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  FRONTEND_ORIGIN,
  USER_EMAIL,
  deleteE2eUsers,
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

const contentFavorite = (page: Page) =>
  page.locator(".recipe-favorite-button:not(.recipe-favorite-button--compact)")

const listFavorites = (page: Page, listTestId: string) =>
  page.getByTestId(listTestId).locator(".recipe-favorite-button--compact")

const expectPressed = async (locator: ReturnType<Page["locator"]>, pressed: boolean) => {
  await expect(locator).toHaveAttribute("aria-pressed", pressed ? "true" : "false")
}

let dbPath: string | undefined

test.beforeAll(async () => {
  dbPath = await prepareE2eUsers()
})

test.afterAll(() => {
  if (dbPath) deleteE2eUsers(dbPath)
})

test.use({
  video: { mode: "on", size: { width: 1280, height: 720 } },
})

test.describe("recipe favorites", () => {
  test("admin can favorite, browse, filter, unfavorite and switch locale", async ({ page }) => {
    test.setTimeout(90_000)
    await setLocaleCookie(page, "gl")
    await page.goto("/cupcakes/cupcake-de-proba")
    await dismissObstructions(page)
    await login(page, ADMIN_EMAIL)
    await expect(page.getByTestId("recipe-title")).toHaveText("Cupcake de proba")

    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Panel", exact: true })).toBeVisible()

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_dashboard_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.getByTestId("dashboard-favorites-link").click()
    await expect(page).toHaveURL(/\/favoritos\/todas\/?$/)
    await expect(page.getByTestId("favorites-empty")).toBeVisible()
    await expect(page.getByText("Aínda non tes favoritos")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_empty_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.goto("/cupcakes/cupcake-de-proba")
    await dismissObstructions(page)
    await expect(page.getByTestId("recipe-title")).toHaveText("Cupcake de proba")
    await expect(contentFavorite(page)).toBeVisible()
    await expectPressed(contentFavorite(page), false)

    await contentFavorite(page).click()
    await expectPressed(contentFavorite(page), true)
    await expectPressed(listFavorites(page, "recipe-sidebar-list").first(), true)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_recipe_heart_filled_gl_dark_desktop.png`,
      fullPage: true,
    })

    const recipeUrl = page.url()
    await listFavorites(page, "recipe-sidebar-list").first().click()
    await expect(page).toHaveURL(recipeUrl)
    await expectPressed(contentFavorite(page), false)

    await listFavorites(page, "recipe-sidebar-list").first().click()
    await expectPressed(contentFavorite(page), true)

    await page.goto("/cookies/galleta-de-chocolate")
    await expect(page.getByTestId("recipe-title")).toHaveText("Galleta de chocolate")
    await contentFavorite(page).click()
    await expectPressed(contentFavorite(page), true)

    await page.goto("/brownies/brownie-clasico")
    await expect(page.getByTestId("recipe-title")).toHaveText("Brownie clasico")
    await contentFavorite(page).click()
    await expectPressed(contentFavorite(page), true)

    await page.getByTestId("header-profile-menu").click()
    await expect(page.getByTestId("header-profile-dropdown")).toBeVisible()
    await expect(page.getByTestId("header-favorites-link")).toBeVisible()
    await page.getByTestId("header-profile-dropdown").screenshot({
      path: `${ARTIFACTS_DIR}/favorites_header_dropdown_gl_dark.png`,
    })
    await page.getByTestId("header-favorites-link").click()
    await expect(page).toHaveURL(/\/favoritos\/todas/)
    await expect(page.getByTestId("favorites-sidebar-list")).toBeVisible()
    await expect(page.getByTestId("favorites-sidebar-list").locator("li")).toHaveCount(3)
    await expect(page.getByText("Todas")).toBeVisible()
    await expect(page.getByTestId("recipe-title")).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_all_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.goto("/favoritos/cookies/galleta-de-chocolate")
    await expect(page.getByTestId("recipe-title")).toHaveText("Galleta de chocolate")
    await expect(page.getByTestId("favorites-sidebar-list").locator("li")).toHaveCount(1)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_cookies_gl_dark_desktop.png`,
      fullPage: true,
    })

    await page.goto("/favoritos/todas/cupcake-de-proba")
    await expect(page.getByTestId("recipe-title")).toHaveText("Cupcake de proba")
    const beforeUnfavorite = page.url()
    await page
      .getByTestId("favorites-sidebar-list")
      .locator(".recipe-list-row:has([aria-current='page']) .recipe-favorite-button--compact")
      .click()
    await expect(page).not.toHaveURL(beforeUnfavorite)
    await expect(page.getByTestId("favorites-sidebar-list").locator("li")).toHaveCount(2)
    await expect(page.getByTestId("recipe-title")).not.toHaveText("Cupcake de proba")

    await page.goto("/es/favoritos/todas/galleta-de-chocolate")
    await expect(page.getByTestId("recipe-title")).toHaveText("Galleta de chocolate")
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_all_es_dark_desktop.png`,
      fullPage: true,
    })

    await page.goto("/en/favorites/all/chocolate-cookie")
    await expect(page.getByTestId("recipe-title")).toHaveText("Chocolate cookie")
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_all_en_dark_desktop.png`,
      fullPage: true,
    })

    await page.goBack()
    await expect(page).toHaveURL(/\/es\/favoritos\/todas\/galleta-de-chocolate$/)
    await page.goForward()
    await expect(page).toHaveURL(/\/en\/favorites\/all\/chocolate-cookie$/)

    await page.getByLabel("Change page theme").click()
    await page.waitForTimeout(800)
    await page
      .locator("vite-error-overlay")
      .waitFor({ state: "detached", timeout: 1000 })
      .catch(() => undefined)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_all_en_light_desktop.png`,
      fullPage: true,
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    await page
      .locator("vite-error-overlay")
      .waitFor({ state: "detached", timeout: 1000 })
      .catch(() => undefined)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_page_all_en_light_mobile.png`,
      fullPage: true,
    })
  })

  test("two users keep distinct favorites", async ({ page, browser }) => {
    await setLocaleCookie(page, "gl")
    await page.goto("/cookies/galleta-de-avea")
    await dismissObstructions(page)
    await expect(page.getByTestId("login-submit")).toBeVisible()
    await login(page, USER_EMAIL)
    await expect(page.getByTestId("header-profile-menu")).toBeVisible()
    await expect(page.getByTestId("recipe-title")).toHaveText("Galleta de avea")
    await contentFavorite(page).click()
    await expectPressed(contentFavorite(page), true)

    await page.getByTestId("header-profile-menu").click()
    await page.getByTestId("header-favorites-link").click()
    await expect(page.getByTestId("favorites-sidebar-list").locator("li")).toHaveCount(1)
    await expect(page.getByTestId("recipe-title")).toHaveText("Galleta de avea")
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/favorites_second_user_gl_dark_desktop.png`,
      fullPage: true,
    })

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await adminPage
      .context()
      .addCookies([{ name: "i18n_redirected", value: "gl", url: FRONTEND_ORIGIN }])
    await adminPage.goto("/cookies/galleta-de-chocolate")
    await dismissObstructions(adminPage)
    await login(adminPage, ADMIN_EMAIL)
    await expect(adminPage.getByTestId("recipe-title")).toHaveText("Galleta de chocolate")
    const adminHeart = contentFavorite(adminPage)
    if ((await adminHeart.getAttribute("aria-pressed")) !== "true") {
      await adminHeart.click()
    }
    await expectPressed(adminHeart, true)

    await adminPage.goto("/favoritos/todas")
    await expect(adminPage.getByTestId("favorites-sidebar-list")).toBeVisible()
    await expect(adminPage.getByTestId("favorites-sidebar-list").getByText("Galleta de chocolate")).toBeVisible()
    await expect(adminPage.getByTestId("favorites-sidebar-list").getByText("Galleta de avea")).toHaveCount(0)
    await adminContext.close()
  })
})
