import type { Client } from "@libsql/client"

/**
 * Migration to add the type column to the user table.
 * User types: 0 = regular user (default), 1 = admin
 */
export async function up(db: Client): Promise<void> {
  // Check if user table exists and if type column already exists
  const tableInfo = await db.execute(`PRAGMA table_info(user)`)
  const hasTypeColumn = tableInfo.rows.some(row => row.name === "type")
  
  if (!hasTypeColumn) {
    // Add type column: 0 = regular user, 1 = admin
    await db.execute(`ALTER TABLE user ADD COLUMN type INTEGER NOT NULL DEFAULT 0`)
    console.log("Added type column to user table")
  } else {
    console.log("Type column already exists in user table")
  }
}

export async function down(db: Client): Promise<void> {
  // SQLite doesn't support DROP COLUMN in older versions
  // For safety, we don't drop the column
  console.log("Warning: Cannot drop column in SQLite, skipping down migration for type column")
}
