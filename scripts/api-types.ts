import fs from "node:fs/promises"
import path from "node:path"
import openapiTS, { astToString } from "openapi-typescript"

const BACKEND_URL = process.env.BACKEND_URL
if (!BACKEND_URL) {
  console.error("Error: BACKEND_URL environment variable is not set.")
  console.error("Make sure your .env file contains BACKEND_URL=http://localhost:4000")
  process.exit(1)
}

const OPENAPI_URL = `${BACKEND_URL}/_openapi.json`
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../shared/types/api.d.ts")

async function main() {
  console.log(`Fetching OpenAPI spec from ${OPENAPI_URL}...`)

  try {
    const ast = await openapiTS(new URL(OPENAPI_URL))
    const contents = astToString(ast)

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
    await fs.writeFile(OUTPUT_PATH, contents, "utf-8")

    console.log(`Types generated successfully at ${OUTPUT_PATH}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to generate types: ${error.message}`)
    } else {
      console.error("Failed to generate types:", error)
    }
    process.exit(1)
  }
}

main()
