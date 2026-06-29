import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const imageMetadata = sqliteTable('imageMetadata', {
  mediaId: integer('mediaId').primaryKey(),
  width: integer('width').default(0),
  height: integer('height').default(0),
  orientation: integer('orientation').default(1),
})
