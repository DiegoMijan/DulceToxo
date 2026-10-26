import { Hono } from "hono"
import { getDb } from "../db/client"

const app = new Hono()

interface CategoryLocale {
  id: string
  name: string
  url_name: string
}

interface CategoryWithLocales {
  id: string
  created_at: string
  locale: Record<"es" | "en" | "gl", CategoryLocale>
}

app.get("/", async (c) => {
  const db = getDb()
  
  const categoriesResult = await db.execute(`
    SELECT id, created_at FROM categories ORDER BY created_at
  `)
  
  const localesResult = await db.execute(`
    SELECT id, category_id, locale, name, url_name FROM category_locales
  `)
  
  const localesByCategory = new Map<string, Record<string, CategoryLocale>>()
  for (const row of localesResult.rows) {
    const categoryId = row.category_id as string
    const locale = row.locale as string
    if (!localesByCategory.has(categoryId)) {
      localesByCategory.set(categoryId, {} as Record<string, CategoryLocale>)
    }
    localesByCategory.get(categoryId)![locale] = {
      id: row.id as string,
      name: row.name as string,
      url_name: row.url_name as string,
    }
  }
  
  const categories: CategoryWithLocales[] = categoriesResult.rows.map(row => ({
    id: row.id as string,
    created_at: row.created_at as string,
    locale: (localesByCategory.get(row.id as string) || {}) as Record<"es" | "en" | "gl", CategoryLocale>,
  }))
  
  return c.json(categories)
})

export default app
