import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const metaInMediaTypes = sqliteTable('metaInMediaTypes', {
  metaId: integer('metaId').notNull(),
  mediaTypeId: integer('mediaTypeId').notNull(),
  scraper: text('scraper'),
  show: integer('show', {mode: 'boolean'}).default(true),
  order: integer('order'),
}, (table) => ({
  pk: primaryKey({columns: [table.metaId, table.mediaTypeId]}),
}))
