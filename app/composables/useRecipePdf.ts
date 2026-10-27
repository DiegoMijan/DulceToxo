import { jsPDF } from "jspdf"

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
// About half an A4 page under the title, without overflowing the body.
const MAX_IMAGE_HEIGHT_MM = 128
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

interface PdfLabels {
  prepTime: string
  cookTime: string
  difficulty: string
  ingredients: string
  instructions: string
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

const drawHeader = (doc: jsPDF, title: string) => {
  const headerHeight = 34

  doc.setFillColor(...BRAND.header)
  doc.rect(0, 0, PAGE.width, headerHeight, "F")
  doc.setFillColor(...BRAND.accent)
  doc.rect(0, headerHeight, PAGE.width, 1.4, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("DULCE TOXO", PAGE.margin, 11)

  doc.setFont("times", "bold")
  doc.setFontSize(24)
  const titleLines = doc.splitTextToSize(title, PAGE.width - PAGE.margin * 2)
  doc.text(titleLines, PAGE.margin, 24)

  return headerHeight + 10
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

const drawFooters = (doc: jsPDF, category: string, title: string) => {
  const pageCount = doc.getNumberOfPages()
  const footerY = PAGE.height - 9
  const label = formatFooterLabel(category, title)

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
    doc.text(truncateToWidth(doc, label, maxLabelWidth), PAGE.margin, footerY)
    doc.text(pageLabel, PAGE.width - PAGE.margin, footerY, { align: "right" })
  }
}

// Maps to Cloudinary `f_jpg,q_80,w_1000,c_limit` via @nuxt/image.
const RECIPE_PDF_IMAGE_MODIFIERS = {
  format: "jpg",
  quality: 80,
  width: 1000,
  fit: "coverLimit",
} as const

export interface RecipePdfImage {
  public_id: string
  order: number
}

export const recipePdfFileName = (title: string): string => {
  const sanitized = title.replace(INVALID_FILENAME_CHARS, "").trim()
  return `${sanitized || "recipe"}.pdf`
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

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.size) return null
    return await blobToDataUrl(blob)
  } catch {
    return null
  }
}

export const loadRecipeImageAsDataUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl) return null
  return loadImageAsDataUrl(imageUrl)
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

// Separado de la descarga para poder probar la paginación (doc.output(...)) sin DOM.
export const buildRecipePdf = (
  recipe: Recipe,
  labels: PdfLabels,
  imageDataUrl?: string | null,
): jsPDF => {
  const doc = new jsPDF({ unit: "mm", format: "a4" })

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

  drawFooters(doc, recipe.category, recipe.title)

  return doc
}

export const useRecipePdf = () => {
  const img = useImage()
  const categoriesStore = useCategories()

  const resolveCategoryName = (categoryIdOrName: string): string => {
    const match = categoriesStore.categoriesByLocale.find(
      (category) => category.id === categoryIdOrName,
    )
    return match?.name || categoryIdOrName
  }

  const downloadRecipePdf = async (
    recipe: Recipe,
    labels: PdfLabels,
    images: RecipePdfImage[] = [],
  ) => {
    const mainImage = getMainRecipeImage(images)
    const imageUrl = mainImage
      ? img(mainImage.public_id, RECIPE_PDF_IMAGE_MODIFIERS, { provider: "cloudinary" })
      : null
    const imageDataUrl = imageUrl ? await loadRecipeImageAsDataUrl(imageUrl) : null
    const doc = buildRecipePdf(
      { ...recipe, category: resolveCategoryName(recipe.category) },
      labels,
      imageDataUrl,
    )
    doc.save(recipePdfFileName(recipe.title))
  }

  return { downloadRecipePdf }
}
