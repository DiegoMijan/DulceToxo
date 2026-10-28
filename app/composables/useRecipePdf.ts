import { jsPDF } from "jspdf"
import type { LocaleKey, Recipe } from "#shared/types/Recipe"
import type { RecipeDetail } from "~/stores/recipes"

// Paleta de marca (coincide con app/assets/css/main.css --color-french-lilac-*)
const BRAND = {
  header: [133, 67, 136] as [number, number, number], // french-lilac-700
  headerDark: [58, 24, 58] as [number, number, number], // french-lilac-950
  accent: [236, 255, 65] as [number, number, number], // yellow-300 (línea del header real)
  bullet: [187, 115, 194] as [number, number, number], // french-lilac-500
  heading: [133, 67, 136] as [number, number, number], // french-lilac-700
  text: [45, 40, 46] as [number, number, number],
  muted: [130, 120, 132] as [number, number, number],
  rule: [238, 220, 242] as [number, number, number], // french-lilac-200
}

const PAGE = { width: 210, height: 297, margin: 16, footerReserve: 14 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2
const DESCRIPTION_LINE_HEIGHT = 5.2
const PT_TO_MM = 25.4 / 72
const HEADER = {
  brandY: 11,
  brandSize: 9,
  titleY: 24,
  titleSize: 24,
  minHeight: 34,
  titleBottomPadding: 7,
  accentHeight: 1.4,
  contentGap: 10,
}
// About half an A4 page under the title, without overflowing the body.
const MAX_IMAGE_HEIGHT_MM = 128
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

export interface PdfLabels {
  prepTime: string
  cookTime: string
  difficulty: string
  ingredients: string
  instructions: string
}

export interface CookbookPdfLabels {
  indexTitle: string
  recipesCount: string
  date: string
}

// Cursor de una columna: en qué página física va dibujando y a qué altura.
// Las dos columnas (ingredientes/instrucciones) avanzan de forma independiente,
// así que una puede necesitar más páginas que la otra sin desalinear nada.
interface ColumnCursor {
  page: number
  y: number
}

// Crea páginas hasta llegar a `pageNumber` (si ya existe, sólo cambia el puntero).
// jsPDF permite volver con setPage() y seguir dibujando sobre una página anterior,
// que es justo lo que necesitamos para intercalar las dos columnas.
const getOrAddPage = (doc: jsPDF, pageNumber: number) => {
  while (doc.getNumberOfPages() < pageNumber) {
    doc.addPage()
  }
  doc.setPage(pageNumber)
}

// Si el siguiente bloque no cabe en la página actual, salta de página
// (dejando sitio para el pie de página) y deja la columna lista para dibujar.
const ensureSpace = (doc: jsPDF, cursor: ColumnCursor, needed: number) => {
  if (cursor.y + needed > PAGE.height - PAGE.margin - PAGE.footerReserve) {
    cursor.page += 1
    cursor.y = PAGE.margin
  }
  getOrAddPage(doc, cursor.page)
}

const titleLineHeightMm = (doc: jsPDF, fontSizePt: number): number =>
  fontSizePt * doc.getLineHeightFactor() * PT_TO_MM

const wrapHeaderTitle = (doc: jsPDF, title: string): string[] => {
  doc.setFont("times", "bold")
  doc.setFontSize(HEADER.titleSize)
  const lines = doc.splitTextToSize(title.trim() || " ", CONTENT_WIDTH)
  return Array.isArray(lines) && lines.length > 0 ? lines : [""]
}

const headerHeightForTitleLines = (doc: jsPDF, lineCount: number): number => {
  const extraLines = Math.max(lineCount - 1, 0)
  const lastBaseline = HEADER.titleY + extraLines * titleLineHeightMm(doc, HEADER.titleSize)
  return Math.max(HEADER.minHeight, lastBaseline + HEADER.titleBottomPadding)
}

const drawHeader = (doc: jsPDF, title: string) => {
  const titleLines = wrapHeaderTitle(doc, title)
  const headerHeight = headerHeightForTitleLines(doc, titleLines.length)

  doc.setFillColor(...BRAND.header)
  doc.rect(0, 0, PAGE.width, headerHeight, "F")
  doc.setFillColor(...BRAND.accent)
  doc.rect(0, headerHeight, PAGE.width, HEADER.accentHeight, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(HEADER.brandSize)
  doc.text("DULCE TOXO", PAGE.margin, HEADER.brandY)

  doc.setFont("times", "bold")
  doc.setFontSize(HEADER.titleSize)
  doc.text(titleLines, PAGE.margin, HEADER.titleY)

  return headerHeight + HEADER.accentHeight + HEADER.contentGap
}

const drawMetaRow = (
  doc: jsPDF,
  y: number,
  prepTime: number,
  cookTime: number,
  difficulty: number,
  labels: PdfLabels,
) => {
  doc.setTextColor(...BRAND.text)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  let x = PAGE.margin
  const prepText = labels.prepTime.replace("{time}", String(prepTime))
  const cookText = labels.cookTime.replace("{time}", String(cookTime))
  doc.text(prepText, x, y)
  x += doc.getTextWidth(prepText) + 8
  doc.text(cookText, x, y)
  x += doc.getTextWidth(cookText) + 8

  doc.text(labels.difficulty, x, y)
  x += doc.getTextWidth(labels.difficulty) + 1
  for (let i = 0; i < 5; i++) {
    if (i < difficulty) {
      doc.setFillColor(...BRAND.header)
      doc.circle(x, y - 1.3, 1.6, "F")
    } else {
      doc.setDrawColor(...BRAND.rule)
      doc.circle(x, y - 1.3, 1.6, "S")
    }
    x += 4.5
  }

  const ruleY = y + 6
  doc.setDrawColor(...BRAND.rule)
  doc.setLineWidth(0.4)
  doc.line(PAGE.margin, ruleY, PAGE.width - PAGE.margin, ruleY)

  return ruleY + 10
}

const drawColumnTitle = (doc: jsPDF, x: number, y: number, text: string) => {
  doc.setTextColor(...BRAND.heading)
  doc.setFont("times", "bold")
  doc.setFontSize(15)
  doc.text(text, x, y)
  doc.setDrawColor(...BRAND.header)
  doc.setLineWidth(0.6)
  doc.line(x, y + 2, x + doc.getTextWidth(text), y + 2)
}

// Dibuja una columna (ingredientes o instrucciones) partiendo item a item, saltando
// de página cuando hace falta sin tocar la otra columna. `drawMarker` pinta la viñeta
// o el número de paso; `textIndent` es el hueco que le deja al texto.
interface ColumnItem {
  description: string
  isHeading?: boolean
}

const drawColumn = (
  doc: jsPDF,
  items: ColumnItem[],
  x: number,
  columnWidth: number,
  startPage: number,
  startY: number,
  textIndent: number,
  drawMarker: (doc: jsPDF, x: number, y: number, index: number) => void,
  compact = false,
): ColumnCursor => {
  const cursor: ColumnCursor = { page: startPage, y: startY }
  getOrAddPage(doc, cursor.page)

  items.forEach((item, index) => {
    const isHeading = Boolean(item.isHeading)
    // Headings keep extra space above even when ingredient rows are tighter.
    if (isHeading && index > 0) {
      ensureSpace(doc, cursor, 4)
      cursor.y += 3
    }

    const fontFamily = isHeading ? "times" : "helvetica"
    const fontStyle = isHeading ? "bolditalic" : "normal"
    const fontSize = isHeading ? 11.5 : 10.5
    const indent = isHeading ? 0 : textIndent
    const description = isHeading ? item.description.toLocaleUpperCase() : item.description
    doc.setFont(fontFamily, fontStyle)
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(description, columnWidth - indent)
    const lineHeight = isHeading ? 5.5 : 5
    const minHeight = compact && !isHeading ? 5.5 : 6
    // Compact ingredients: ~27% less gap after each row, font size unchanged.
    const extraAfter = compact && !isHeading ? 1 : 3
    const blockHeight = Math.max(lines.length * lineHeight, minHeight) + extraAfter

    ensureSpace(doc, cursor, blockHeight)

    if (!isHeading) {
      drawMarker(doc, x, cursor.y, index)
    }

    doc.setTextColor(...(isHeading ? BRAND.heading : BRAND.text))
    doc.setFont(fontFamily, fontStyle)
    doc.setFontSize(fontSize)
    doc.text(lines, x + indent, cursor.y)
    cursor.y += blockHeight
  })

  return cursor
}

const drawIngredientMarker = (doc: jsPDF, x: number, y: number) => {
  doc.setFillColor(...BRAND.bullet)
  doc.circle(x + 1.4, y - 1.6, 1.3, "F")
}

const drawInstructionMarker = (doc: jsPDF, x: number, y: number, index: number) => {
  doc.setFillColor(...BRAND.header)
  doc.circle(x + 2.6, y - 1.6, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.text(String(index + 1), x + 2.6, y - 0.9, { align: "center" })
}

const FOOTER_ELLIPSIS = "…"
const FOOTER_PAGE_GAP = 4

const truncateToWidth = (doc: jsPDF, text: string, maxWidth: number): string => {
  if (maxWidth <= 0) return ""
  if (doc.getTextWidth(text) <= maxWidth) return text

  const ellipsisWidth = doc.getTextWidth(FOOTER_ELLIPSIS)
  if (ellipsisWidth > maxWidth) return ""

  let truncated = text
  while (truncated.length > 0 && doc.getTextWidth(truncated) + ellipsisWidth > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated.length ? `${truncated}${FOOTER_ELLIPSIS}` : FOOTER_ELLIPSIS
}

const formatFooterLabel = (category: string, title: string): string => {
  const parts = ["Dulce Toxo", category.trim(), title.trim()].filter((part) => part.length > 0)
  return parts.join(" - ")
}

const drawNumberedFooters = (doc: jsPDF, labelForPage: (page: number) => string) => {
  const pageCount = doc.getNumberOfPages()
  const footerY = PAGE.height - 9

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setDrawColor(...BRAND.rule)
    doc.setLineWidth(0.3)
    doc.line(PAGE.margin, PAGE.height - 14, PAGE.width - PAGE.margin, PAGE.height - 14)
    doc.setTextColor(...BRAND.muted)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    const pageLabel = `${page} / ${pageCount}`
    const pageLabelWidth = doc.getTextWidth(pageLabel)
    const maxLabelWidth = CONTENT_WIDTH - pageLabelWidth - FOOTER_PAGE_GAP
    doc.text(truncateToWidth(doc, labelForPage(page), maxLabelWidth), PAGE.margin, footerY)
    doc.text(pageLabel, PAGE.width - PAGE.margin, footerY, { align: "right" })
  }
}

const drawFooters = (doc: jsPDF, category: string, title: string) => {
  const label = formatFooterLabel(category, title)
  drawNumberedFooters(doc, () => label)
}

// Maps to Cloudinary `f_jpg,q_80,w_1000,c_limit` via @nuxt/image.
const RECIPE_PDF_IMAGE_MODIFIERS = {
  format: "jpg",
  quality: 80,
  width: 1000,
  fit: "coverLimit",
} as const

const RECIPE_BOOK_IMAGE_MODIFIERS = {
  format: "jpg",
  quality: 70,
  width: 800,
  fit: "coverLimit",
} as const
const RECIPE_BOOK_IMAGE_CONCURRENCY = 4
const RECIPE_BOOK_LOGO_PATH = "/img/logo_toxo.webp"
const RECIPE_BOOK_LOGO_BACKGROUND = "#3a183a"

export interface RecipePdfImage {
  public_id: string
  order: number
}

export const recipePdfFileName = (title: string): string => {
  const sanitized = title.replace(INVALID_FILENAME_CHARS, "").trim()
  return `${sanitized || "recipe"}.pdf`
}

export const recipeBookPdfFileName = (collectionName: string): string => {
  const sanitized = collectionName.replace(INVALID_FILENAME_CHARS, "").trim()
  return `Dulce Toxo - ${sanitized || "recetario"}.pdf`
}

export const formatCookbookDate = (locale: string, date = new Date()): string => {
  const localeTag = locale === "gl" ? "gl-ES" : locale === "es" ? "es-ES" : "en-GB"
  return new Intl.DateTimeFormat(localeTag, { dateStyle: "long" }).format(date)
}

export const recipeDetailToPdfRecipe = (
  recipe: RecipeDetail,
  locale: LocaleKey,
  categoryName: string,
): Recipe => {
  const localeData = recipe.locales[locale]
  const ingredients = recipe.ingredients[locale] || []
  const steps = recipe.steps[locale] || []
  return {
    id: recipe.id,
    title: localeData?.title || "",
    description: localeData?.description || "",
    ingredients: ingredients.map((ingredient) => ({
      id: ingredient.id,
      description: ingredient.description,
      order: ingredient.order,
      is_heading: ingredient.is_heading ?? false,
    })),
    instructions: steps.map((step) => ({
      id: step.id,
      description: step.description,
      order: step.order,
    })),
    difficulty: recipe.difficulty as 1 | 2 | 3 | 4 | 5,
    prepTime: recipe.prep_time,
    cookTime: recipe.cook_time,
    createdAt: new Date(recipe.created_at),
    updatedAt: new Date(recipe.updated_at),
    category: categoryName || recipe.category_id,
  }
}

export const getMainRecipeImage = (images: RecipePdfImage[]): RecipePdfImage | undefined => {
  if (images.length === 0) return undefined
  return images.reduce((lowest, image) => (image.order < lowest.order ? image : lowest))
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"))
    reader.readAsDataURL(blob)
  })

const loadImageAsDataUrl = async (url: string, signal?: AbortSignal): Promise<string | null> => {
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.size) return null
    return await blobToDataUrl(blob)
  } catch (error) {
    if (isAbortError(error)) throw error
    return null
  }
}

export const loadRecipeImageAsDataUrl = async (
  imageUrl: string,
  signal?: AbortSignal,
): Promise<string | null> => {
  if (!imageUrl) return null
  return loadImageAsDataUrl(imageUrl, signal)
}

const resolvePdfImageUrl = (
  renderer: ReturnType<typeof useImage>,
  publicId: string,
  modifiers: typeof RECIPE_PDF_IMAGE_MODIFIERS | typeof RECIPE_BOOK_IMAGE_MODIFIERS,
): string => {
  if (publicId.startsWith("/")) return publicId
  return renderer(publicId, modifiers, { provider: "cloudinary" })
}

const drawDescription = (doc: jsPDF, y: number, description: string): number => {
  const trimmed = description.trim()
  if (!trimmed) return y

  doc.setTextColor(...BRAND.text)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(trimmed, CONTENT_WIDTH)
  doc.text(lines, PAGE.margin, y)
  return y + lines.length * DESCRIPTION_LINE_HEIGHT + 6
}

const drawMainImage = (doc: jsPDF, y: number, imageDataUrl: string): number => {
  try {
    const properties = doc.getImageProperties(imageDataUrl)
    const pageBottom = PAGE.height - PAGE.margin - PAGE.footerReserve
    let availableHeight = pageBottom - y
    if (availableHeight < 30) {
      doc.addPage()
      y = PAGE.margin
      availableHeight = pageBottom - y
    }

    const maxHeight = Math.min(MAX_IMAGE_HEIGHT_MM, availableHeight)
    const ratio = properties.width / properties.height
    let width = CONTENT_WIDTH
    let height = width / ratio
    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }

    // Portrait/square images that do not fill the content width sit in the center.
    const x = PAGE.margin + (CONTENT_WIDTH - width) / 2
    const format = imageDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG"
    doc.addImage(imageDataUrl, format, x, y, width, height)
    return y + height + 8
  } catch {
    return y
  }
}

const drawRecipeContent = (
  doc: jsPDF,
  recipe: Recipe,
  labels: PdfLabels,
  imageDataUrl?: string | null,
) => {
  let y = drawHeader(doc, recipe.title)
  if (imageDataUrl) {
    y = drawMainImage(doc, y, imageDataUrl)
  }
  y = drawDescription(doc, y, recipe.description)
  y = drawMetaRow(doc, y, recipe.prepTime, recipe.cookTime, recipe.difficulty, labels)

  const gutter = 10
  const leftWidth = (PAGE.width - PAGE.margin * 2 - gutter) * 0.42
  const rightX = PAGE.margin + leftWidth + gutter
  const rightWidth = PAGE.width - PAGE.margin * 2 - leftWidth - gutter

  drawColumnTitle(doc, PAGE.margin, y, labels.ingredients)
  drawColumnTitle(doc, rightX, y, labels.instructions)

  const contentStartY = y + 9
  const firstPage = doc.getCurrentPageInfo().pageNumber

  drawColumn(
    doc,
    recipe.ingredients.map((ingredient) => ({
      description: ingredient.description,
      isHeading: ingredient.is_heading,
    })),
    PAGE.margin,
    leftWidth,
    firstPage,
    contentStartY,
    6,
    drawIngredientMarker,
    true,
  )
  drawColumn(
    doc,
    recipe.instructions.map((instruction) => ({
      description: instruction.description,
    })),
    rightX,
    rightWidth,
    firstPage,
    contentStartY,
    8,
    drawInstructionMarker,
  )
}

// Separado de la descarga para poder probar la paginación (doc.output(...)) sin DOM.
export const buildRecipePdf = (
  recipe: Recipe,
  labels: PdfLabels,
  imageDataUrl?: string | null,
): jsPDF => {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  drawRecipeContent(doc, recipe, labels, imageDataUrl)
  drawFooters(doc, recipe.category, recipe.title)
  return doc
}

const COVER_BAND_HEIGHT = 118
const INDEX_LINE_HEIGHT = 7.4
const INDEX_BODY_TOP = 36

const rasterizeImageToJpeg = (source: string, background: string): Promise<string | null> =>
  new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.naturalWidth || 1
      canvas.height = image.naturalHeight || 1
      const context = canvas.getContext("2d")
      if (!context) {
        resolve(null)
        return
      }
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", 0.9))
    }
    image.onerror = () => resolve(null)
    image.src = source
  })

const drawCoverLogo = (doc: jsPDF, logoDataUrl: string) => {
  try {
    const properties = doc.getImageProperties(logoDataUrl)
    const maxWidth = 90
    const maxHeight = 52
    let width = maxWidth
    let height = width * (properties.height / properties.width)
    if (height > maxHeight) {
      height = maxHeight
      width = height * (properties.width / properties.height)
    }
    const x = (PAGE.width - width) / 2
    const format = logoDataUrl.includes("png") ? "PNG" : "JPEG"
    doc.addImage(logoDataUrl, format, x, 18, width, height)
  } catch {
    // Cover still works without the logo.
  }
}

const drawCookbookCover = (
  doc: jsPDF,
  collectionName: string,
  cookbookLabels: CookbookPdfLabels,
  logoDataUrl?: string | null,
) => {
  doc.setFillColor(...BRAND.headerDark)
  doc.rect(0, 0, PAGE.width, COVER_BAND_HEIGHT, "F")
  doc.setFillColor(...BRAND.accent)
  doc.rect(0, COVER_BAND_HEIGHT, PAGE.width, HEADER.accentHeight, "F")

  if (logoDataUrl) drawCoverLogo(doc, logoDataUrl)

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("DULCE TOXO", PAGE.width / 2, COVER_BAND_HEIGHT - 14, { align: "center" })

  doc.setTextColor(...BRAND.header)
  doc.setFont("times", "bold")
  doc.setFontSize(28)
  const nameLines = doc.splitTextToSize(collectionName.trim() || " ", CONTENT_WIDTH)
  doc.text(nameLines, PAGE.width / 2, COVER_BAND_HEIGHT + 28, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(13)
  doc.setTextColor(...BRAND.text)
  const countY = COVER_BAND_HEIGHT + 28 + nameLines.length * 12 + 8
  doc.text(cookbookLabels.recipesCount, PAGE.width / 2, countY, { align: "center" })

  doc.setTextColor(...BRAND.muted)
  doc.setFontSize(11)
  doc.text(cookbookLabels.date, PAGE.width / 2, PAGE.height - PAGE.margin - 8, { align: "center" })
}

const countIndexPages = (entryCount: number): number => {
  const usable = PAGE.height - INDEX_BODY_TOP - PAGE.margin - PAGE.footerReserve
  const perPage = Math.max(1, Math.floor(usable / INDEX_LINE_HEIGHT))
  return Math.max(1, Math.ceil(Math.max(entryCount, 1) / perPage))
}

const drawIndexEntry = (doc: jsPDF, y: number, title: string, pageNumber: number) => {
  const pageStr = String(pageNumber)
  doc.setFont("times", "bold")
  doc.setFontSize(12)
  const pageWidth = doc.getTextWidth(pageStr)
  const maxTitleWidth = CONTENT_WIDTH - pageWidth - 10
  doc.setFont("times", "normal")
  const titleText = truncateToWidth(doc, title, maxTitleWidth)
  doc.setTextColor(...BRAND.text)
  doc.text(titleText, PAGE.margin, y)

  const titleWidth = doc.getTextWidth(titleText)
  const dotsStart = PAGE.margin + titleWidth + 2
  const dotsEnd = PAGE.width - PAGE.margin - pageWidth - 2
  doc.setTextColor(...BRAND.muted)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  let dots = ""
  while (doc.getTextWidth(dots) < dotsEnd - dotsStart) dots += "."
  doc.text(dots, dotsStart, y)

  doc.setTextColor(...BRAND.heading)
  doc.setFont("times", "bold")
  doc.setFontSize(12)
  doc.text(pageStr, PAGE.width - PAGE.margin, y, { align: "right" })
}

const drawCookbookIndex = (
  doc: jsPDF,
  startPage: number,
  entries: Array<{ title: string; page: number }>,
  indexTitle: string,
) => {
  const bottom = PAGE.height - PAGE.margin - PAGE.footerReserve
  let pageOffset = 0
  let y = INDEX_BODY_TOP

  const openIndexPage = (offset: number, showTitle: boolean) => {
    doc.setPage(startPage + offset)
    if (!showTitle) {
      y = PAGE.margin
      return
    }
    doc.setTextColor(...BRAND.heading)
    doc.setFont("times", "bold")
    doc.setFontSize(20)
    doc.text(indexTitle, PAGE.margin, PAGE.margin + 12)
    doc.setDrawColor(...BRAND.header)
    doc.setLineWidth(0.6)
    doc.line(
      PAGE.margin,
      PAGE.margin + 15,
      PAGE.margin + doc.getTextWidth(indexTitle),
      PAGE.margin + 15,
    )
    y = INDEX_BODY_TOP
  }

  openIndexPage(0, true)
  for (const entry of entries) {
    if (y + INDEX_LINE_HEIGHT > bottom) {
      pageOffset += 1
      openIndexPage(pageOffset, false)
    }
    drawIndexEntry(doc, y, entry.title, entry.page)
    y += INDEX_LINE_HEIGHT
  }
}

const offsetPageNumber = (page: number, insertAt: number, count: number): number =>
  page >= insertAt ? page + count : page

export const buildCookbookPdf = (
  recipes: Array<{ recipe: Recipe; imageDataUrl?: string | null }>,
  labels: PdfLabels,
  options: {
    collectionName: string
    includeCoverAndIndex: boolean
    cookbookLabels: CookbookPdfLabels
    logoDataUrl?: string | null
  },
): jsPDF => {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  let firstPageTaken = false
  const acquirePage = () => {
    if (!firstPageTaken) {
      firstPageTaken = true
      doc.setPage(1)
      return
    }
    doc.addPage()
  }

  const ranges: Array<{ title: string; start: number; end: number }> = []

  if (options.includeCoverAndIndex) {
    acquirePage()
    drawCookbookCover(doc, options.collectionName, options.cookbookLabels, options.logoDataUrl)
  }

  for (const entry of recipes) {
    acquirePage()
    const start = doc.getCurrentPageInfo().pageNumber
    drawRecipeContent(doc, entry.recipe, labels, entry.imageDataUrl)
    ranges.push({ title: entry.recipe.title, start, end: doc.getNumberOfPages() })
  }

  let indexPageCount = 0
  if (options.includeCoverAndIndex) {
    indexPageCount = countIndexPages(recipes.length)
    const insertAt = 2
    for (let index = 0; index < indexPageCount; index++) {
      doc.insertPage(insertAt + index)
    }
    const entries = ranges.map((range) => ({
      title: range.title,
      page: offsetPageNumber(range.start, insertAt, indexPageCount),
    }))
    drawCookbookIndex(doc, insertAt, entries, options.cookbookLabels.indexTitle)
  }

  const titleByPage: Record<number, string> = {}
  for (const range of ranges) {
    const start = offsetPageNumber(range.start, 2, indexPageCount)
    const end = offsetPageNumber(range.end, 2, indexPageCount)
    for (let page = start; page <= end; page++) titleByPage[page] = range.title
  }

  drawNumberedFooters(doc, (page) =>
    formatFooterLabel(options.collectionName, titleByPage[page] ?? ""),
  )
  return doc
}

export type DownloadCookbookPdfOptions = {
  collectionName: string
  fileStem: string
  includePhotos: boolean
  includeCoverAndIndex: boolean
  labels: PdfLabels
  cookbookLabels: CookbookPdfLabels
  signal?: AbortSignal
  onProgress?: (completed: number, total: number) => void
}

export const useRecipePdf = () => {
  const img = useImage()
  const { locale } = useI18n()
  const categoriesStore = useCategories()
  const recipesStore = useRecipes()

  const resolveCategoryName = (categoryIdOrName: string): string => {
    const match = categoriesStore.categoriesByLocale.find(
      (category) => category.id === categoryIdOrName,
    )
    return match?.name || categoryIdOrName
  }

  const loadLogoDataUrl = async (signal?: AbortSignal): Promise<string | null> => {
    const source = await loadImageAsDataUrl(RECIPE_BOOK_LOGO_PATH, signal)
    if (!source) return null
    if (source.startsWith("data:image/jpeg") || source.startsWith("data:image/png")) return source
    return rasterizeImageToJpeg(source, RECIPE_BOOK_LOGO_BACKGROUND)
  }

  const loadCookbookImages = async (
    details: RecipeDetail[],
    includePhotos: boolean,
    signal?: AbortSignal,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Array<string | null>> => {
    if (!includePhotos) {
      onProgress?.(details.length, details.length)
      return details.map(() => null)
    }

    let completed = 0
    return mapWithConcurrency(
      details,
      RECIPE_BOOK_IMAGE_CONCURRENCY,
      async (detail) => {
        const mainImage = getMainRecipeImage(detail.images)
        const imageUrl = mainImage
          ? resolvePdfImageUrl(img, mainImage.public_id, RECIPE_BOOK_IMAGE_MODIFIERS)
          : null
        const imageDataUrl = imageUrl ? await loadRecipeImageAsDataUrl(imageUrl, signal) : null
        completed += 1
        onProgress?.(completed, details.length)
        return imageDataUrl
      },
      signal,
    )
  }

  const downloadRecipePdf = async (
    recipe: Recipe,
    labels: PdfLabels,
    images: RecipePdfImage[] = [],
  ) => {
    const mainImage = getMainRecipeImage(images)
    const imageUrl = mainImage
      ? resolvePdfImageUrl(img, mainImage.public_id, RECIPE_PDF_IMAGE_MODIFIERS)
      : null
    const imageDataUrl = imageUrl ? await loadRecipeImageAsDataUrl(imageUrl) : null
    const doc = buildRecipePdf(
      { ...recipe, category: resolveCategoryName(recipe.category) },
      labels,
      imageDataUrl,
    )
    doc.save(recipePdfFileName(recipe.title))
  }

  const downloadCookbookPdf = async (ids: string[], options: DownloadCookbookPdfOptions) => {
    throwIfAborted(options.signal)
    const details = await recipesStore.loadRecipesForPdf(ids, {
      signal: options.signal,
      onProgress: options.includePhotos ? undefined : options.onProgress,
    })
    throwIfAborted(options.signal)
    if (details.length === 0) {
      throw new Error("No recipes available for the cookbook")
    }

    const localeKey = locale.value as LocaleKey
    const pdfRecipes = details.map((detail) =>
      recipeDetailToPdfRecipe(detail, localeKey, options.collectionName),
    )
    const images = await loadCookbookImages(
      details,
      options.includePhotos,
      options.signal,
      options.onProgress,
    )
    const logoDataUrl = options.includeCoverAndIndex ? await loadLogoDataUrl(options.signal) : null

    throwIfAborted(options.signal)
    const doc = buildCookbookPdf(
      pdfRecipes.map((recipe, index) => ({ recipe, imageDataUrl: images[index] })),
      options.labels,
      {
        collectionName: options.collectionName,
        includeCoverAndIndex: options.includeCoverAndIndex,
        cookbookLabels: options.cookbookLabels,
        logoDataUrl,
      },
    )
    throwIfAborted(options.signal)
    doc.save(recipeBookPdfFileName(options.fileStem))
  }

  return { downloadRecipePdf, downloadCookbookPdf }
}
