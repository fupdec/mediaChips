import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const valuesInMedia = sqliteTable('valuesInMedia', {
  mediaId: integer('mediaId').notNull(),
  metaId: integer('metaId').notNull(),
  value: text('value'),
}, (table) => ({
  pk: primaryKey({columns: [table.mediaId, table.metaId]}),
}))
