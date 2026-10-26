import { getDb } from "./client"
import * as migration001 from "./migrations/001_initial_schema"

const migrations = [
  { name: "001_initial_schema", ...migration001 },
]

async function createMigrationsTable(db: ReturnType<typeof getDb>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

async function getExecutedMigrations(db: ReturnType<typeof getDb>): Promise<string[]> {
  const result = await db.execute(`SELECT name FROM _migrations ORDER BY id`)
  return result.rows.map(row => row.name as string)
}

async function markMigrationExecuted(db: ReturnType<typeof getDb>, name: string) {
  await db.execute({
    sql: `INSERT INTO _migrations (name) VALUES (?)`,
    args: [name],
  })
}

async function migrate() {
  const db = getDb()
  
  console.log("Starting migrations...")
  
  await createMigrationsTable(db)
  const executed = await getExecutedMigrations(db)
  
  for (const migration of migrations) {
    if (executed.includes(migration.name)) {
      console.log(`Skipping ${migration.name} (already executed)`)
      continue
    }
    
    console.log(`Running ${migration.name}...`)
    try {
      await migration.up(db)
      await markMigrationExecuted(db, migration.name)
      console.log(`Completed ${migration.name}`)
    } catch (error) {
      console.error(`Failed to run ${migration.name}:`, error)
      throw error
    }
  }
  
  console.log("All migrations completed successfully!")
}

migrate().catch(error => {
  console.error("Migration failed:", error)
  process.exit(1)
})
