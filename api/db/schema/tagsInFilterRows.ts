import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

export const tagsInFilterRows = sqliteTable('tagsInFilterRows', {
  tagId: integer('tagId').notNull(),
  rowId: integer('rowId').notNull(),
  metaId: integer('metaId').notNull(),
}, (table) => ({
  pk: primaryKey({columns: [table.tagId, table.rowId, table.metaId]}),
}))
