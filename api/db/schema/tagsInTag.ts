import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

export const tagsInTags = sqliteTable('tagsInTags', {
  parentTagId: integer('parentTagId').notNull(),
  tagId: integer('tagId').notNull(),
  metaId: integer('metaId').notNull(),
}, (table) => ({
  pk: primaryKey({columns: [table.parentTagId, table.tagId, table.metaId]}),
}))
