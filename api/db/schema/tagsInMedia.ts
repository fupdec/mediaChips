import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

export const tagsInMedia = sqliteTable('tagsInMedia', {
  mediaId: integer('mediaId').notNull(),
  tagId: integer('tagId').notNull(),
  metaId: integer('metaId').notNull(),
}, (table) => ({
  pk: primaryKey({columns: [table.mediaId, table.tagId, table.metaId]}),
}))
