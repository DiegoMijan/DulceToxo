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
const drawColumn = (
  doc: jsPDF,
  descriptions: string[],
  x: number,
  columnWidth: number,
  startPage: number,
  startY: number,
  textIndent: number,
  drawMarker: (doc: jsPDF, x: number, y: number, index: number) => void,
): ColumnCursor => {
  const cursor: ColumnCursor = { page: startPage, y: startY }
  getOrAddPage(doc, cursor.page)

  descriptions.forEach((description, index) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10.5)
    const lines = doc.splitTextToSize(description, columnWidth - textIndent)
    const blockHeight = Math.max(lines.length * 5, 6) + 3

    ensureSpace(doc, cursor, blockHeight)

    drawMarker(doc, x, cursor.y, index)

    doc.setTextColor(...BRAND.text)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10.5)
    doc.text(lines, x + textIndent, cursor.y)
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

const drawFooters = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setDrawColor(...BRAND.rule)
    doc.setLineWidth(0.3)
    doc.line(PAGE.margin, PAGE.height - 14, PAGE.width - PAGE.margin, PAGE.height - 14)
    doc.setTextColor(...BRAND.muted)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Dulce Toxo • Recetario", PAGE.margin, PAGE.height - 9)
    doc.text(`${page} / ${pageCount}`, PAGE.width - PAGE.margin, PAGE.height - 9, { align: "right" })
  }
}

// Separado de la descarga para poder probar la paginación (doc.output(...)) sin DOM.
export const buildRecipePdf = (recipe: Recipe, labels: PdfLabels): jsPDF => {
  const doc = new jsPDF({ unit: "mm", format: "a4" })

  let y = drawHeader(doc, recipe.title)
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
    recipe.ingredients.map((ingredient) => ingredient.description),
    PAGE.margin,
    leftWidth,
    firstPage,
    contentStartY,
    6,
    drawIngredientMarker,
  )
  drawColumn(
    doc,
    recipe.instructions.map((instruction) => instruction.description),
    rightX,
    rightWidth,
    firstPage,
    contentStartY,
    8,
    drawInstructionMarker,
  )

  drawFooters(doc)

  return doc
}

export const useRecipePdf = () => {
  const downloadRecipePdf = (recipe: Recipe, labels: PdfLabels) => {
    const doc = buildRecipePdf(recipe, labels)
    const fileName = `${recipe.id || recipe.title || "receta"}.pdf`.replace(/\s+/g, "-").toLowerCase()
    doc.save(fileName)
  }

  return { downloadRecipePdf }
}
