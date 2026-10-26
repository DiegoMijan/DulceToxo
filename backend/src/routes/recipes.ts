import { Hono } from "hono"
import { getDb } from "../db/client"
import { requireAdmin } from "../middleware/auth"

const app = new Hono()

interface RecipeLocale {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
}

interface Recipe {
  id: string
  category_id: string
  difficulty: number
  prep_time: number
  cook_time: number
  images: string[] | null
  created_at: string
  updated_at: string
  locales?: Record<"es" | "en" | "gl", RecipeLocale>
}

// GET /recipes - List all recipes (public)
app.get("/", async (c) => {
  const db = getDb()
  const categoryId = c.req.query("category")
  
  let recipesResult
  if (categoryId) {
    recipesResult = await db.execute({
      sql: `SELECT * FROM recipes WHERE category_id = ? ORDER BY created_at DESC`,
      args: [categoryId],
    })
  } else {
    recipesResult = await db.execute(`SELECT * FROM recipes ORDER BY created_at DESC`)
  }
  
  const recipeIds = recipesResult.rows.map(r => r.id as string)
  if (recipeIds.length === 0) {
    return c.json([])
  }
  
  const placeholders = recipeIds.map(() => "?").join(",")
  const localesResult = await db.execute({
    sql: `SELECT * FROM recipe_locales WHERE recipe_id IN (${placeholders})`,
    args: recipeIds,
  })
  
  const localesByRecipe = new Map<string, Record<string, RecipeLocale>>()
  for (const row of localesResult.rows) {
    const recipeId = row.recipe_id as string
    const locale = row.locale as string
    if (!localesByRecipe.has(recipeId)) {
      localesByRecipe.set(recipeId, {} as Record<string, RecipeLocale>)
    }
    localesByRecipe.get(recipeId)![locale] = {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      ingredients: JSON.parse(row.ingredients as string),
      instructions: JSON.parse(row.instructions as string),
    }
  }
  
  const recipes: Recipe[] = recipesResult.rows.map(row => ({
    id: row.id as string,
    category_id: row.category_id as string,
    difficulty: row.difficulty as number,
    prep_time: row.prep_time as number,
    cook_time: row.cook_time as number,
    images: row.images ? JSON.parse(row.images as string) : null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    locales: localesByRecipe.get(row.id as string) as Record<"es" | "en" | "gl", RecipeLocale>,
  }))
  
  return c.json(recipes)
})

// GET /recipes/:id - Get single recipe (public)
app.get("/:id", async (c) => {
  const db = getDb()
  const id = c.req.param("id")
  
  const recipeResult = await db.execute({
    sql: `SELECT * FROM recipes WHERE id = ?`,
    args: [id],
  })
  
  if (recipeResult.rows.length === 0) {
    return c.json({ error: "Not Found", message: "Recipe not found" }, 404)
  }
  
  const row = recipeResult.rows[0]
  
  const localesResult = await db.execute({
    sql: `SELECT * FROM recipe_locales WHERE recipe_id = ?`,
    args: [id],
  })
  
  const locales: Record<string, RecipeLocale> = {}
  for (const localeRow of localesResult.rows) {
    const locale = localeRow.locale as string
    locales[locale] = {
      id: localeRow.id as string,
      title: localeRow.title as string,
      description: localeRow.description as string,
      ingredients: JSON.parse(localeRow.ingredients as string),
      instructions: JSON.parse(localeRow.instructions as string),
    }
  }
  
  const recipe: Recipe = {
    id: row.id as string,
    category_id: row.category_id as string,
    difficulty: row.difficulty as number,
    prep_time: row.prep_time as number,
    cook_time: row.cook_time as number,
    images: row.images ? JSON.parse(row.images as string) : null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    locales: locales as Record<"es" | "en" | "gl", RecipeLocale>,
  }
  
  return c.json(recipe)
})

// POST /recipes - Create recipe (admin only)
app.post("/", requireAdmin, async (c) => {
  const db = getDb()
  const body = await c.req.json()
  
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  await db.execute({
    sql: `INSERT INTO recipes (id, category_id, difficulty, prep_time, cook_time, images, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      body.category_id,
      body.difficulty || 2,
      body.prep_time || 1,
      body.cook_time || 1,
      body.images ? JSON.stringify(body.images) : null,
      now,
      now,
    ],
  })
  
  // Insert locales
  for (const locale of ["es", "en", "gl"]) {
    const localeData = body.locales?.[locale]
    if (localeData) {
      const localeId = crypto.randomUUID()
      await db.execute({
        sql: `INSERT INTO recipe_locales (id, recipe_id, locale, title, description, ingredients, instructions)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          localeId,
          id,
          locale,
          localeData.title || "",
          localeData.description || "",
          JSON.stringify(localeData.ingredients || []),
          JSON.stringify(localeData.instructions || []),
        ],
      })
    }
  }
  
  return c.json({ id, message: "Recipe created successfully" }, 201)
})

// PUT /recipes/:id - Update recipe (admin only)
app.put("/:id", requireAdmin, async (c) => {
  const db = getDb()
  const id = c.req.param("id")
  const body = await c.req.json()
  
  const existing = await db.execute({
    sql: `SELECT id FROM recipes WHERE id = ?`,
    args: [id],
  })
  
  if (existing.rows.length === 0) {
    return c.json({ error: "Not Found", message: "Recipe not found" }, 404)
  }
  
  const now = new Date().toISOString()
  
  await db.execute({
    sql: `UPDATE recipes SET 
            category_id = COALESCE(?, category_id),
            difficulty = COALESCE(?, difficulty),
            prep_time = COALESCE(?, prep_time),
            cook_time = COALESCE(?, cook_time),
            images = COALESCE(?, images),
            updated_at = ?
          WHERE id = ?`,
    args: [
      body.category_id || null,
      body.difficulty || null,
      body.prep_time || null,
      body.cook_time || null,
      body.images ? JSON.stringify(body.images) : null,
      now,
      id,
    ],
  })
  
  // Update locales
  for (const locale of ["es", "en", "gl"]) {
    const localeData = body.locales?.[locale]
    if (localeData) {
      await db.execute({
        sql: `INSERT INTO recipe_locales (id, recipe_id, locale, title, description, ingredients, instructions)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(recipe_id, locale) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                ingredients = excluded.ingredients,
                instructions = excluded.instructions`,
        args: [
          crypto.randomUUID(),
          id,
          locale,
          localeData.title || "",
          localeData.description || "",
          JSON.stringify(localeData.ingredients || []),
          JSON.stringify(localeData.instructions || []),
        ],
      })
    }
  }
  
  return c.json({ message: "Recipe updated successfully" })
})

// DELETE /recipes/:id - Delete recipe (admin only)
app.delete("/:id", requireAdmin, async (c) => {
  const db = getDb()
  const id = c.req.param("id")
  
  const existing = await db.execute({
    sql: `SELECT id FROM recipes WHERE id = ?`,
    args: [id],
  })
  
  if (existing.rows.length === 0) {
    return c.json({ error: "Not Found", message: "Recipe not found" }, 404)
  }
  
  // Delete locales first (cascade should handle this, but being explicit)
  await db.execute({
    sql: `DELETE FROM recipe_locales WHERE recipe_id = ?`,
    args: [id],
  })
  
  await db.execute({
    sql: `DELETE FROM recipes WHERE id = ?`,
    args: [id],
  })
  
  return c.json({ message: "Recipe deleted successfully" })
})

export default app
