import { and, asc, eq } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { playlists } from '../schema/playlists'
import { nowIso } from '../utils/timestamps'

export type PlaylistRow = typeof playlists.$inferSelect
export type PlaylistInsert = typeof playlists.$inferInsert

export function createPlaylistsRepository(db: DrizzleClient) {
  return {
    create(data: Partial<PlaylistInsert>): PlaylistRow {
      const timestamp = nowIso()
      return db.insert(playlists)
        .values({
          name: data.name ?? null,
          favorite: data.favorite ?? false,
          oldId: data.oldId ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning()
        .get()
    },

    findAll(): PlaylistRow[] {
      return db.select().from(playlists).orderBy(asc(playlists.name)).all()
    },

    updateById(id: number, data: Partial<PlaylistInsert>): void {
      db.update(playlists)
        .set({
          ...data,
          updatedAt: nowIso(),
        })
        .where(eq(playlists.id, id))
        .run()
    },

    deleteById(id: number): void {
      db.delete(playlists).where(eq(playlists.id, id)).run()
    },
  }
}
