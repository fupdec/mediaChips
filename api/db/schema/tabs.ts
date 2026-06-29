import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const tabs = sqliteTable('tabs', {
  id: integer('id').primaryKey({autoIncrement: true}),
  name: text('name'),
  icon: text('icon'),
  url: text('url'),
  order: integer('order').default(0),
  metaId: integer('metaId'),
  mediaTypeId: integer('mediaTypeId'),
  tagId: integer('tagId'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})
