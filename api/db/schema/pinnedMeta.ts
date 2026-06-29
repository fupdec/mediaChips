import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pinnedMetas = sqliteTable('pinnedMetas', {
  metaId: integer('metaId').notNull(),
  pinnedMetaId: integer('pinnedMetaId').notNull(),
  scraper: text('scraper'),
  show: integer('show', {mode: 'boolean'}).default(true),
  order: integer('order'),
}, (table) => ({
  pk: primaryKey({columns: [table.metaId, table.pinnedMetaId]}),
}))
