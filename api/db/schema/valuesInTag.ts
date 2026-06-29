import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const valuesInTags = sqliteTable('valuesInTags', {
  tagId: integer('tagId').notNull(),
  metaId: integer('metaId').notNull(),
  value: text('value'),
}, (table) => ({
  pk: primaryKey({columns: [table.tagId, table.metaId]}),
}))
