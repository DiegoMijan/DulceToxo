import { getDb } from "../client"

interface CategorySeed {
  id: string
  locales: {
    es: { name: string; url_name: string }
    en: { name: string; url_name: string }
    gl: { name: string; url_name: string }
  }
}

/**
 * Pastry/dessert categories for Dulce Toxo.
 * Based on the landing page categories from the frontend i18n.
 */
const categories: CategorySeed[] = [
  {
    id: "cupcakes",
    locales: {
      gl: { name: "Cupcakes", url_name: "cupcakes" },
      es: { name: "Cupcakes", url_name: "cupcakes" },
      en: { name: "Cupcakes", url_name: "cupcakes" },
    },
  },
  {
    id: "cookies",
    locales: {
      gl: { name: "Galletas", url_name: "galletas" },
      es: { name: "Galletas", url_name: "galletas" },
      en: { name: "Cookies", url_name: "cookies" },
    },
  },
  {
    id: "cheesecakes",
    locales: {
      gl: { name: "Tortas de queixo", url_name: "tortas-de-queixo" },
      es: { name: "Tartas de queso", url_name: "tartas-de-queso" },
      en: { name: "Cheesecakes", url_name: "cheesecakes" },
    },
  },
  {
    id: "sponge-cakes",
    locales: {
      gl: { name: "Bolos", url_name: "bolos" },
      es: { name: "Bizcochos", url_name: "bizcochos" },
      en: { name: "Sponge Cakes", url_name: "sponge-cakes" },
    },
  },
  {
    id: "brownies",
    locales: {
      gl: { name: "Brownies", url_name: "brownies" },
      es: { name: "Brownies", url_name: "brownies" },
      en: { name: "Brownies", url_name: "brownies" },
    },
  },
  {
    id: "cold-cakes",
    locales: {
      gl: { name: "Tortas frías", url_name: "tortas-frias" },
      es: { name: "Tartas frías", url_name: "tartas-frias" },
      en: { name: "Cold Cakes", url_name: "cold-cakes" },
    },
  },
]

/**
 * Idempotent seed script for recipe categories.
 * Skips categories that already exist.
 */
async function seed() {
  const db = getDb()
  
  console.log("Seeding categories...")
  
  for (const category of categories) {
    // Check if category already exists (idempotent)
    const existing = await db.execute({
      sql: `SELECT id FROM categories WHERE id = ?`,
      args: [category.id],
    })
    
    if (existing.rows.length > 0) {
      console.log(`Category "${category.id}" already exists, skipping...`)
      continue
    }
    
    // Insert category
    await db.execute({
      sql: `INSERT INTO categories (id, created_at) VALUES (?, datetime('now'))`,
      args: [category.id],
    })
    
    // Insert locales
    for (const [locale, data] of Object.entries(category.locales)) {
      const localeId = `${category.id}-${locale}`
      await db.execute({
        sql: `INSERT INTO category_locales (id, category_id, locale, name, url_name) VALUES (?, ?, ?, ?, ?)`,
        args: [localeId, category.id, locale, data.name, data.url_name],
      })
    }
    
    console.log(`Created category "${category.id}"`)
  }
  
  console.log("Seeding completed!")
}

seed().catch(error => {
  console.error("Seeding failed:", error)
  process.exit(1)
})
