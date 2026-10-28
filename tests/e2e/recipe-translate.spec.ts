import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  ADMIN_EMAIL,
  E2E_PASSWORD,
  FRONTEND_ORIGIN,
  TRANSLATE_BLANK_RECIPE_ID,
  TRANSLATE_FILLED_RECIPE_ID,
  createE2eTranslateRecipes,
  deleteE2eTranslateRecipes,
  deleteE2eUsers,
  prepareE2eUsers,
} from "./localDb"

const ARTIFACTS_DIR = "/opt/cursor/artifacts"

const BUTTON_LABEL = {
  gl: "Traducir a castelán e inglés",
  es: "Traducir a castellano e inglés",
  en: "Translate to Spanish and English",
} as const

const OVERWRITE_MESSAGE = {
  gl: "Sobrescribiranse as traducións actuais",
  es: "Se sobrescribirán las traducciones actuales",
  en: "Current translations will be overwritten",
} as const

const ERRORS = {
  gl: {
    notConfigured: "A tradución automática non está configurada",
    quotaExceeded: "Esgotouse a cota de tradución deste mes",
    failed: "Non se puido traducir, téntao de novo",
  },
  es: {
    notConfigured: "La traducción automática no está configurada",
    quotaExceeded: "Se ha agotado la cuota de traducción de este mes",
    failed: "No se pudo traducir, inténtalo de nuevo",
  },
  en: {
    notConfigured: "Automatic translation is not configured",
    quotaExceeded: "This month's translation quota has been used up",
    failed: "Could not translate, please try again",
  },
} as const

const SUCCESS = {
  gl: "Tradución completada. Revisa as lapelas de castelán e inglés antes de gardar",
  es: "Traducción completada. Revisa las pestañas de castellano e inglés antes de guardar",
  en: "Translation completed. Review the Spanish and English tabs before saving",
} as const

const UNTRANSLATED = {
  gl: {
    one: "1 texto quedou sen traducir",
    many: (n: number) => `${n} textos quedaron sen traducir`,
  },
  es: {
    one: "1 texto quedó sin traducir",
    many: (n: number) => `${n} textos quedaron sin traducir`,
  },
  en: {
    one: "1 text was left untranslated",
    many: (n: number) => `${n} texts were left untranslated`,
  },
} as const

const PENDING_REVIEW = {
  gl: "Tradución pendente de revisar",
  es: "Traducción pendiente de revisar",
  en: "Translation pending review",
} as const

let dbPath: string | undefined

test.beforeAll(async () => {
  dbPath = await prepareE2eUsers()
  createE2eTranslateRecipes(dbPath)
})

test.afterAll(() => {
  if (!dbPath) return
  deleteE2eTranslateRecipes(dbPath)
  deleteE2eUsers(dbPath)
})

test.beforeEach(async ({ page }) => {
  await page.route("**/api/translate", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Translation service is not configured" }),
    })
  })
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

const loginAsAdmin = async (page: Page) => {
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.keyboard.press("Escape")
  await page.getByTestId("login-submit").click({ force: true })
  await expect(page.getByTestId("header-profile-menu")).toBeVisible()
}

const openEditor = async (page: Page, path: string) => {
  await page.goto(path)
  await dismissObstructions(page)
  await loginAsAdmin(page)
  await expect(page.getByTestId("recipe-translate-button")).toBeVisible()
}

const mockTranslateMap = async (
  page: Page,
  map: (texts: string[]) => { es: string[]; en: string[] },
) => {
  const requests: unknown[] = []
  await page.route("**/api/translate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback()
      return
    }
    const body = route.request().postDataJSON()
    requests.push(body)
    const texts = Array.isArray(body?.texts) ? (body.texts as string[]) : []
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ translations: map(texts) }),
    })
  })
  return requests
}

const echoTranslations = (texts: string[]) => ({
  es: texts.map((text) => (text === "" ? "" : `ES:${text}`)),
  en: texts.map((text) => (text === "" ? "" : `EN:${text}`)),
})

const mockEchoTranslate = async (page: Page) => mockTranslateMap(page, echoTranslations)

const pendingReviewMark = (page: Page, locale: "es" | "en") =>
  page.getByTestId(`translate-pending-review-${locale}`)

const mockTranslateStatus = async (page: Page, status: number) => {
  await page.route("**/api/translate", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ message: "mocked error" }),
    })
  })
}

const blockRecipeWrites = async (page: Page) => {
  const writes: string[] = []
  await page.route("**/api/recipes**", async (route) => {
    const method = route.request().method()
    if (method === "POST" || method === "PUT") {
      writes.push(`${method} ${route.request().url()}`)
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "unexpected recipe write" }),
      })
      return
    }
    await route.fallback()
  })
  return writes
}

const openLocaleTab = async (page: Page, locale: "gl" | "es" | "en") => {
  await page.locator(`img[alt="${locale}"]`).click()
}

const expectLocaleFields = async (
  page: Page,
  locale: "es" | "en",
  expected: { title: string; slug: string; description: string },
) => {
  await openLocaleTab(page, locale)
  await expect(page.locator(`input[name="locales.${locale}.title"]`)).toHaveValue(expected.title)
  await expect(page.locator(`input[name="locales.${locale}.slug"]`)).toHaveValue(expected.slug)
  await expect(page.locator(`textarea[name="locales.${locale}.description"]`)).toHaveValue(
    expected.description,
  )
}

const tableRows = (page: Page, section: "ingredients" | "instructions") => {
  const index = section === "ingredients" ? 0 : 1
  return page.getByRole("tabpanel").locator(".p-datatable").nth(index).locator("tbody tr")
}

const acceptTranslateConfirm = async (page: Page, label: string) => {
  const popup = page.locator(".p-confirmpopup")
  await expect(popup).toBeVisible()
  await popup.getByRole("button", { name: label, exact: true }).click()
}

const fillCell = async (row: Locator, columnIndex: number, text: string) => {
  const cell = row.locator("td").nth(columnIndex)
  await cell.click()
  const input = cell.locator("input")
  await input.fill(text)
  await input.press("Enter")
}

test.use({
  video: { mode: "on", size: { width: 1280, height: 720 } },
})

test.describe("recipe auto translate", () => {
  test("new recipe translates in one request, keeps headings and empty rows, and stays dirty", async ({
    page,
  }) => {
    await setLocaleCookie(page, "gl")
    const writes = await blockRecipeWrites(page)
    const requests = await mockEchoTranslate(page)
    await openEditor(page, "/edit")

    await page.locator('input[name="locales.gl.title"]').fill("Bolo de laranxa")
    await page.locator('input[name="locales.gl.title"]').blur()
    await page.locator('textarea[name="locales.gl.description"]').fill("Un bolo cítrico")

    await page.getByTestId("recipe-add-ingredient").click()
    const firstIngredient = tableRows(page, "ingredients").nth(0)
    await firstIngredient.locator("input[type='checkbox']").check()
    await fillCell(firstIngredient, 3, "Para o recheo")

    await page.getByTestId("recipe-add-ingredient").click()
    await fillCell(tableRows(page, "ingredients").nth(1), 3, "3 ovos")

    await page.getByTestId("recipe-add-ingredient").click()

    await page.getByTestId("recipe-add-instruction").click()
    await fillCell(tableRows(page, "instructions").nth(0), 2, "Mesturar todo")

    await page.getByTestId("recipe-add-instruction").click()

    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(OVERWRITE_MESSAGE.gl)).toBeVisible()
    await acceptTranslateConfirm(page, "Traducir")

    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await expect(page.locator(".p-toast-message-success")).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toBeVisible()
    await expect(pendingReviewMark(page, "en")).toBeVisible()
    await expect(page.getByTestId("recipe-edit-save")).toBeEnabled()
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      source: "gl",
      targets: ["es", "en"],
    })
    const texts = (requests[0] as { texts: string[] }).texts
    expect(texts[0]).toBe("Bolo de laranxa")
    expect(texts[1]).toBe("Un bolo cítrico")
    expect(texts).toContain("Para o recheo")
    expect(texts).toContain("3 ovos")
    expect(texts).toContain("Mesturar todo")
    expect(texts).toContain("")

    await expectLocaleFields(page, "es", {
      title: "ES:Bolo de laranxa",
      slug: "es-bolo-de-laranxa",
      description: "ES:Un bolo cítrico",
    })
    await expect(
      tableRows(page, "ingredients").nth(0).locator("input[type='checkbox']"),
    ).toBeChecked()
    await expect(tableRows(page, "ingredients").nth(0)).toContainText("ES:Para o recheo")
    await expect(tableRows(page, "ingredients").nth(1)).toContainText("ES:3 ovos")
    await expect(tableRows(page, "ingredients").nth(2)).not.toContainText("ES:")
    await expect(tableRows(page, "instructions").nth(0)).toContainText("ES:Mesturar todo")

    await expectLocaleFields(page, "en", {
      title: "EN:Bolo de laranxa",
      slug: "en-bolo-de-laranxa",
      description: "EN:Un bolo cítrico",
    })
    await expect(
      tableRows(page, "ingredients").nth(0).locator("input[type='checkbox']"),
    ).toBeChecked()
    await expect(
      tableRows(page, "ingredients").nth(1).locator("input[type='checkbox']"),
    ).not.toBeChecked()

    await openLocaleTab(page, "es")
    await expect(page.getByTestId("recipe-translate-button")).toBeHidden()
    await openLocaleTab(page, "gl")
    await expect(page.getByTestId("recipe-translate-button")).toBeVisible()

    expect(writes).toEqual([])
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_new_recipe_gl_dark.png`,
      fullPage: true,
    })
  })

  test("existing recipe asks for confirmation, overwrites es/en and keeps heading flags", async ({
    page,
  }) => {
    await setLocaleCookie(page, "gl")
    const requests = await mockEchoTranslate(page)
    await openEditor(page, `/edit/${TRANSLATE_FILLED_RECIPE_ID}`)

    await expect(page.locator('input[name="locales.es.title"]')).toHaveValue("Bizcocho de limón")

    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(OVERWRITE_MESSAGE.gl)).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_confirm_popup_gl_dark.png`,
    })
    await acceptTranslateConfirm(page, "Traducir")

    expect(requests).toHaveLength(1)
    expect((requests[0] as { texts: string[] }).texts).toEqual([
      "Bolo de limón",
      "Un bolo de proba",
      "Para o recheo",
      "200 g de queixo",
      "",
      "Mesturar os ingredientes",
      "",
    ])

    await expectLocaleFields(page, "es", {
      title: "ES:Bolo de limón",
      slug: "es-bolo-de-limon",
      description: "ES:Un bolo de proba",
    })
    await expect(
      tableRows(page, "ingredients").nth(0).locator("input[type='checkbox']"),
    ).toBeChecked()
    await expect(
      tableRows(page, "ingredients").nth(1).locator("input[type='checkbox']"),
    ).not.toBeChecked()
    await expect(tableRows(page, "ingredients").nth(0)).toContainText("ES:Para o recheo")
    await expect(tableRows(page, "ingredients").nth(2)).not.toContainText("ES:")
    await expect(tableRows(page, "instructions").nth(1)).not.toContainText("ES:")
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_result_es_dark.png`,
      fullPage: true,
    })

    await expectLocaleFields(page, "en", {
      title: "EN:Bolo de limón",
      slug: "en-bolo-de-limon",
      description: "EN:Un bolo de proba",
    })
    await expect(page.getByTestId("recipe-edit-save")).toBeEnabled()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_result_en_dark.png`,
      fullPage: true,
    })
  })

  test("existing recipe with empty es/en translates without confirmation", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    const requests = await mockEchoTranslate(page)
    await openEditor(page, `/edit/${TRANSLATE_BLANK_RECIPE_ID}`)

    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(OVERWRITE_MESSAGE.gl)).toHaveCount(0)
    expect(requests).toHaveLength(1)

    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await expect(page.locator(".p-toast-message-success")).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toBeVisible()
    await expect(pendingReviewMark(page, "en")).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toHaveAttribute("aria-label", PENDING_REVIEW.gl)

    await expectLocaleFields(page, "es", {
      title: "ES:Tarta de queixo",
      slug: "es-tarta-de-queixo",
      description: "ES:Unha tarta de proba",
    })
    await expect(
      tableRows(page, "ingredients").nth(0).locator("input[type='checkbox']"),
    ).toBeChecked()
    await expect(tableRows(page, "ingredients").nth(0)).toContainText("ES:Para a base")
    await expect(pendingReviewMark(page, "es")).toHaveCount(0)
    await expect(pendingReviewMark(page, "en")).toBeVisible()
  })

  test("503, 429 and 502 show toasts and leave the form untouched", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await mockTranslateStatus(page, 503)
    await openEditor(page, `/edit/${TRANSLATE_FILLED_RECIPE_ID}`)

    const originalTitle = await page.locator('input[name="locales.es.title"]').inputValue()
    await page.getByTestId("recipe-translate-button").click()
    await acceptTranslateConfirm(page, "Traducir")
    await expect(page.getByText(ERRORS.gl.notConfigured)).toBeVisible()
    await expect(page.locator('input[name="locales.es.title"]')).toHaveValue(originalTitle)

    await mockTranslateStatus(page, 429)
    await page.getByTestId("recipe-translate-button").click()
    await acceptTranslateConfirm(page, "Traducir")
    await expect(page.getByText(ERRORS.gl.quotaExceeded)).toBeVisible()
    await expect(page.locator('input[name="locales.es.title"]')).toHaveValue(originalTitle)

    await mockTranslateStatus(page, 502)
    await page.getByTestId("recipe-translate-button").click()
    await acceptTranslateConfirm(page, "Traducir")
    await expect(page.getByText(ERRORS.gl.failed)).toBeVisible()
    await expect(page.locator('input[name="locales.es.title"]')).toHaveValue(originalTitle)
    await expect(page.getByTestId("recipe-edit-save")).toBeDisabled()
  })

  test("button and errors follow the interface language", async ({ page }) => {
    await setLocaleCookie(page, "es")
    await mockTranslateStatus(page, 503)
    await openEditor(page, `/es/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await expect(page.getByTestId("recipe-translate-button")).toHaveText(BUTTON_LABEL.es)
    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(ERRORS.es.notConfigured)).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_button_es_dark.png`,
      fullPage: true,
    })

    await setLocaleCookie(page, "en")
    await mockTranslateStatus(page, 429)
    await page.goto(`/en/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await dismissObstructions(page)
    await expect(page.getByTestId("recipe-translate-button")).toHaveText(BUTTON_LABEL.en)
    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(ERRORS.en.quotaExceeded)).toBeVisible()
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_button_en_dark.png`,
      fullPage: true,
    })
  })

  test("shows the translate button in light and dark themes", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await page.addInitScript(() => {
      localStorage.setItem("nuxt-color-mode", "light")
    })
    await openEditor(page, `/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await expect(page.getByTestId("recipe-translate-button")).toHaveText(BUTTON_LABEL.gl)
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_button_gl_light.png`,
      fullPage: true,
    })
  })

  test("marks Spanish and English tabs until each one is opened", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await mockEchoTranslate(page)
    await openEditor(page, `/edit/${TRANSLATE_BLANK_RECIPE_ID}`)

    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await expect(page.locator(".p-toast-message-success")).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toBeVisible()
    await expect(pendingReviewMark(page, "en")).toBeVisible()
    await page.locator(".p-toast-message-success").screenshot({
      path: `${ARTIFACTS_DIR}/translate_success_toast_closeup_gl_dark.png`,
    })
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_success_and_marks_gl_dark.png`,
      fullPage: true,
    })

    await openLocaleTab(page, "es")
    await expect(pendingReviewMark(page, "es")).toHaveCount(0)
    await expect(pendingReviewMark(page, "en")).toBeVisible()

    await openLocaleTab(page, "en")
    await expect(pendingReviewMark(page, "es")).toHaveCount(0)
    await expect(pendingReviewMark(page, "en")).toHaveCount(0)
  })

  test("warns when translated texts come back empty and ignores empty Galician rows", async ({
    page,
  }) => {
    await setLocaleCookie(page, "gl")
    await mockTranslateMap(page, (texts) => ({
      es: texts.map((text, index) => {
        if (text === "") return ""
        if (index === 1) return ""
        return `ES:${text}`
      }),
      en: texts.map((text, index) => {
        if (text === "") return ""
        if (index === 2 || index === 5) return ""
        return `EN:${text}`
      }),
    }))
    await openEditor(page, `/edit/${TRANSLATE_FILLED_RECIPE_ID}`)

    await page.getByTestId("recipe-translate-button").click()
    await acceptTranslateConfirm(page, "Traducir")

    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await expect(page.getByText(UNTRANSLATED.gl.many(3))).toBeVisible()
    await expect(page.locator(".p-toast-message-warn")).toBeVisible()
    await expect(page.locator(".p-toast-message-success")).toHaveCount(0)
    await expect(page.locator(".p-confirmpopup")).toHaveCount(0)
    await expect(pendingReviewMark(page, "es")).toBeVisible()
    await expect(pendingReviewMark(page, "en")).toBeVisible()
    await page.locator(".p-toast-message-warn").screenshot({
      path: `${ARTIFACTS_DIR}/translate_warn_toast_closeup_gl_dark.png`,
    })
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_warn_and_marks_gl_dark.png`,
      fullPage: true,
    })

    await expectLocaleFields(page, "es", {
      title: "ES:Bolo de limón",
      slug: "es-bolo-de-limon",
      description: "",
    })
    await expect(tableRows(page, "ingredients").nth(2)).not.toContainText("ES:")
    await expect(tableRows(page, "instructions").nth(1)).not.toContainText("ES:")
  })

  test("uses singular warning when one translated text is empty", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await mockTranslateMap(page, (texts) => ({
      es: texts.map((text, index) => (index === 0 || text === "" ? "" : `ES:${text}`)),
      en: echoTranslations(texts).en,
    }))
    await openEditor(page, `/edit/${TRANSLATE_BLANK_RECIPE_ID}`)

    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await expect(page.getByText(UNTRANSLATED.gl.one)).toBeVisible()
    await expect(page.locator(".p-toast-message-warn")).toBeVisible()
  })

  test("success and warning toasts follow the interface language", async ({ page }) => {
    await setLocaleCookie(page, "es")
    await mockEchoTranslate(page)
    await openEditor(page, `/es/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(SUCCESS.es)).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toHaveAttribute("aria-label", PENDING_REVIEW.es)
    await page.locator(".p-toast-message-success").screenshot({
      path: `${ARTIFACTS_DIR}/translate_success_toast_closeup_es_dark.png`,
    })
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_success_es_dark.png`,
      fullPage: true,
    })

    await setLocaleCookie(page, "en")
    await mockTranslateMap(page, (texts) => ({
      es: texts.map((text, index) => (index === 1 || text === "" ? "" : `ES:${text}`)),
      en: echoTranslations(texts).en,
    }))
    await page.goto(`/en/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await dismissObstructions(page)
    await page.getByTestId("recipe-translate-button").click()
    await expect(page.getByText(SUCCESS.en)).toBeVisible()
    await expect(page.getByText(UNTRANSLATED.en.one)).toBeVisible()
    await expect(pendingReviewMark(page, "es")).toHaveAttribute("aria-label", PENDING_REVIEW.en)
    await page.locator(".p-toast-message-warn").screenshot({
      path: `${ARTIFACTS_DIR}/translate_warn_toast_closeup_en_dark.png`,
    })
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_warn_en_dark.png`,
      fullPage: true,
    })
  })

  test("pending review marks use theme tokens in light and dark", async ({ page }) => {
    await setLocaleCookie(page, "gl")
    await mockEchoTranslate(page)
    await page.addInitScript(() => {
      localStorage.setItem("nuxt-color-mode", "light")
    })
    await openEditor(page, `/edit/${TRANSLATE_BLANK_RECIPE_ID}`)
    await page.getByTestId("recipe-translate-button").click()
    await expect(pendingReviewMark(page, "es")).toBeVisible()
    await expect(pendingReviewMark(page, "en")).toBeVisible()
    await expect(page.getByText(SUCCESS.gl)).toBeVisible()
    await page.locator(".p-toast-message-success").screenshot({
      path: `${ARTIFACTS_DIR}/translate_success_toast_closeup_gl_light.png`,
    })
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/translate_pending_marks_gl_light.png`,
      fullPage: true,
    })
  })
})
