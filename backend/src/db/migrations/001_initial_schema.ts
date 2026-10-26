import type { Client } from "@libsql/client"

export async function up(db: Client): Promise<void> {
  // User table (Better Auth expects singular names)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      first_name TEXT,
      last_name TEXT,
      date_of_birth TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Session table (Better Auth)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Account table (Better Auth)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      accessTokenExpiresAt TEXT,
      refreshTokenExpiresAt TEXT,
      scope TEXT,
      idToken TEXT,
      password TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Verification table (Better Auth)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Categories table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Category locales table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS category_locales (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      locale TEXT NOT NULL CHECK(locale IN ('es', 'en', 'gl')),
      name TEXT NOT NULL,
      url_name TEXT NOT NULL,
      UNIQUE(category_id, locale)
    )
  `)

  // Recipes table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      difficulty INTEGER NOT NULL DEFAULT 2 CHECK(difficulty BETWEEN 1 AND 5),
      prep_time INTEGER NOT NULL DEFAULT 1,
      cook_time INTEGER NOT NULL DEFAULT 1,
      images TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Recipe locales table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recipe_locales (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      locale TEXT NOT NULL CHECK(locale IN ('es', 'en', 'gl')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      UNIQUE(recipe_id, locale)
    )
  `)

  // Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_session_token ON session(token)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_category_locales_category_id ON category_locales(category_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recipe_locales_recipe_id ON recipe_locales(recipe_id)`)
}

export async function down(db: Client): Promise<void> {
  await db.execute(`DROP TABLE IF EXISTS recipe_locales`)
  await db.execute(`DROP TABLE IF EXISTS recipes`)
  await db.execute(`DROP TABLE IF EXISTS category_locales`)
  await db.execute(`DROP TABLE IF EXISTS categories`)
  await db.execute(`DROP TABLE IF EXISTS verification`)
  await db.execute(`DROP TABLE IF EXISTS account`)
  await db.execute(`DROP TABLE IF EXISTS session`)
  await db.execute(`DROP TABLE IF EXISTS user`)
}
