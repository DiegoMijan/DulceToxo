import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import openapiTS, { astToString } from "openapi-typescript"

const BACKEND_URL = process.env.BACKEND_URL
if (!BACKEND_URL) {
  console.error("Error: BACKEND_URL environment variable is not set.")
  console.error("Make sure your .env file contains BACKEND_URL=http://localhost:4000")
  process.exit(1)
}

const OPENAPI_URL = `${BACKEND_URL}/_openapi.json`
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../shared/types/api.d.ts")

const redactGeneratedDocs = (contents: string): string => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  let redacted = contents
  if (cloudName) {
    redacted = redacted.split(cloudName).join("<cloud>")
  }

  return redacted
    .replace(/in the \S+\/recipes folder/g, "in the recipes folder")
    .replace(/Only images in the \S+\/ folder/g, "Only images in the Cloudinary folder")
    .replace(
      /must start with \S+\/, e\.g\. \S+\/recipes\/[^)]+\)/g,
      "must start with the configured Cloudinary prefix, e.g. recipes/abc123)",
    )
}

async function main() {
  console.log(`Fetching OpenAPI spec from ${OPENAPI_URL}...`)

  try {
    const ast = await openapiTS(new URL(OPENAPI_URL))
    const contents = redactGeneratedDocs(astToString(ast))

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
    await fs.writeFile(OUTPUT_PATH, contents, "utf-8")

    // Formatear con Biome para que regenerar no ensucie el diff
    const format = spawnSync("bunx", ["biome", "format", "--write", OUTPUT_PATH], {
      stdio: "inherit",
      shell: process.platform === "win32",
    })
    if (format.status !== 0) {
      console.error("Biome no pudo formatear el fichero generado")
      process.exit(1)
    }

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
