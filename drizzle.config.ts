import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './api/db/schema/index.ts',
  out: './api/db/migrations-drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DRIZZLE_DB_URL ?? './databases/sample/db.sqlite',
  },
})
