import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pageSettings = sqliteTable('pageSettings', {
  page: integer('page').default(1),
  size: integer('size').default(3),
  view: integer('view').default(1),
  limit: integer('limit').default(101),
  sortBy: text('sortBy').default('createdAt'),
  sortDir: text('sortDir').default('asc'),
  firstChar: text('firstChar'),
  colors: text('colors'),
  metaId: integer('metaId'),
  mediaTypeId: integer('mediaTypeId'),
  tagId: integer('tagId'),
  filterId: integer('filterId'),
  tabId: integer('tabId'),
})
