import { defineConfig } from 'drizzle-kit'

const dbUrl = process.env.DRIZZLE_DB_URL ?? './databases/sample/db.sqlite'

export default defineConfig({
  schema: './api/db/schema/index.ts',
  out: './api/db/migrations-drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
})
