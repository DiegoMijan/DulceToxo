import { betterAuth } from "better-auth"
import { Kysely } from "kysely"
import { LibsqlDialect } from "kysely-libsql"
import { createClient } from "@libsql/client"

const client = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = new Kysely({
  dialect: new LibsqlDialect({ client }),
})

export const auth = betterAuth({
  database: {
    db,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      first_name: {
        type: "string",
        required: false,
      },
      last_name: {
        type: "string",
        required: false,
      },
      date_of_birth: {
        type: "string",
        required: false,
      },
      type: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:4000",
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
