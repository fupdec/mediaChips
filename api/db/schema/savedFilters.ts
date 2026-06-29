import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const savedFilters = sqliteTable('savedFilters', {
  id: integer('id').primaryKey({autoIncrement: true}),
  name: text('name'),
  metaId: integer('metaId'),
  mediaTypeId: integer('mediaTypeId'),
  tagId: integer('tagId'),
  tabId: integer('tabId'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})
