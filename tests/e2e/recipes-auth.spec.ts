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

const LOCALES = [
  {
    code: "gl",
    landingPath: "/",
    loginPath: "/auth/login",
    registerPath: "/auth/register",
    recipePath: "/cupcakes/cupcake-de-proba",
    recipeTitle: "Cupcake de proba",
    loginTitle: "Iniciar Sesión",
    registerTitle: "Rexistrarse",
    categoryName: "Cupcakes",
  },
  {
    code: "es",
    landingPath: "/es",
    loginPath: "/es/auth/login",
    registerPath: "/es/auth/register",
    recipePath: "/es/cupcakes/cupcake-de-prueba",
    recipeTitle: "Cupcake de prueba",
    loginTitle: "Iniciar Sesión",
    registerTitle: "Registrarse",
    categoryName: "Cupcakes",
  },
  {
    code: "en",
    landingPath: "/en",
    loginPath: "/en/auth/login",
    registerPath: "/en/auth/register",
    recipePath: "/en/cupcakes/test-cupcake",
    recipeTitle: "Test cupcake",
    loginTitle: "Sign In",
    registerTitle: "Sign Up",
    categoryName: "Cupcakes",
  },
] as const

let dbPath: string | undefined

test.beforeAll(async () => {
  dbPath = await prepareE2eUsers()
})

test.afterAll(() => {
  if (dbPath) deleteE2eUsers(dbPath)
})

const setLocaleCookie = async (page: Page, locale: string) => {
  await page.context().addCookies([
    {
      name: "i18n_redirected",
      value: locale,
      url: FRONTEND_ORIGIN,
    },
  ])
}

const dismissObstructions = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => undefined)
}

const login = async (page: Page, email: string) => {
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.getByTestId("login-submit").click()
}

const expectLoginRedirect = async (page: Page, locale: (typeof LOCALES)[number]) => {
  await expect(page).toHaveURL(new RegExp(`${locale.loginPath.replaceAll("/", "\\/")}\\?`))
  const url = new URL(page.url())
  expect(url.searchParams.get("redirect")).toBe(locale.recipePath)
  await expect(page.getByRole("heading", { name: locale.loginTitle })).toBeVisible()
}

const expectRecipeVisible = async (page: Page, locale: (typeof LOCALES)[number]) => {
  await expect(page).toHaveURL(new RegExp(`${locale.recipePath.replaceAll("/", "\\/")}$`))
  await expect(page.getByTestId("recipe-title")).toHaveText(locale.recipeTitle)
  await expect(page.getByTestId("recipe-sidebar-list")).toBeVisible()
  await expect(page.getByText(locale.recipeTitle).first()).toBeVisible()
}

for (const locale of LOCALES) {
  test.describe(`recipes auth (${locale.code})`, () => {
    test.beforeEach(async ({ page }) => {
      await setLocaleCookie(page, locale.code)
    })

    test("public landing, login and register stay reachable", async ({ page }) => {
      await page.goto(locale.landingPath)
      await dismissObstructions(page)
      await expect(page.getByTestId("landing-category-card").first()).toBeVisible()
      await expect(page.getByRole("link", { name: locale.categoryName }).first()).toBeVisible()

      await page.goto(locale.loginPath)
      await expect(page.getByRole("heading", { name: locale.loginTitle })).toBeVisible()

      await page.goto(locale.registerPath)
      await expect(page.getByRole("heading", { name: locale.registerTitle })).toBeVisible()
    })

    test("anonymous recipe URL goes to login and returns after login", async ({ page }) => {
      await page.goto(locale.recipePath)
      await dismissObstructions(page)
      await expectLoginRedirect(page, locale)
      if (locale.code === "gl") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/anon_recipe_redirect_${locale.code}.png`,
          fullPage: true,
        })
      }

      await login(page, USER_EMAIL)
      await expectRecipeVisible(page, locale)
      if (locale.code === "gl") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/user_sees_recipe_${locale.code}.png`,
          fullPage: true,
        })
      }
    })

    test("anonymous landing shows categories and middleware sends them to login", async ({
      page,
    }) => {
      await page.goto(locale.landingPath)
      await dismissObstructions(page)
      await expect(page.getByTestId("landing-category-card").first()).toBeVisible()
      if (locale.code === "gl") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/anon_landing_categories_${locale.code}.png`,
          fullPage: true,
        })
      }

      await page.getByRole("link", { name: locale.categoryName }).first().click()
      await expect(page).toHaveURL(new RegExp(`${locale.loginPath.replaceAll("/", "\\/")}`))
      await expect(page.getByRole("heading", { name: locale.loginTitle })).toBeVisible()
    })

    test("logout from a recipe goes to landing and back asks for login", async ({ page }) => {
      await page.goto(locale.recipePath)
      await dismissObstructions(page)
      await login(page, USER_EMAIL)
      await expectRecipeVisible(page, locale)

      await page.getByTestId("header-profile-menu").click()
      await page.getByTestId("header-sign-out").click()

      await expect(page.getByTestId("landing-category-card").first()).toBeVisible()
      await expect(page.getByTestId("recipe-sidebar-list")).toHaveCount(0)
      await expect(page.getByTestId("recipe-title")).toHaveCount(0)
      if (locale.code === "gl") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/logout_landing_${locale.code}.png`,
          fullPage: true,
        })
      }

      await page.goBack()
      await expect(page).toHaveURL(new RegExp(`${locale.loginPath.replaceAll("/", "\\/")}`))
      await expect(page.getByRole("heading", { name: locale.loginTitle })).toBeVisible()
      if (locale.code === "gl") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/back_after_logout_login_${locale.code}.png`,
          fullPage: true,
        })
      }
    })

    test("normal user sees recipes", async ({ page }) => {
      await page.goto(locale.recipePath)
      await dismissObstructions(page)
      await login(page, USER_EMAIL)
      await expectRecipeVisible(page, locale)
    })

    test("admin sees recipes", async ({ page }) => {
      await page.goto(locale.recipePath)
      await dismissObstructions(page)
      await login(page, ADMIN_EMAIL)
      await expectRecipeVisible(page, locale)
      if (locale.code === "en") {
        await page.screenshot({
          path: `${ARTIFACTS_DIR}/admin_sees_recipe_${locale.code}.png`,
          fullPage: true,
        })
      }
    })
  })
}
