import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

export const mediaInPlaylists = sqliteTable('mediaInPlaylists', {
  mediaId: integer('mediaId').notNull(),
  playlistId: integer('playlistId').notNull(),
  order: integer('order'),
}, (table) => ({
  pk: primaryKey({columns: [table.mediaId, table.playlistId]}),
}))
