import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({autoIncrement: true}),
  option: text('option').unique(),
  value: text('value'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})
