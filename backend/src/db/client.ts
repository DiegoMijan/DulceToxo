import { createClient, type Client } from "@libsql/client"

let client: Client | null = null

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url) {
      throw new Error("TURSO_URL environment variable is required")
    }

    client = createClient({
      url,
      authToken,
    })
  }
  return client
}

export { client }
