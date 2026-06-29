import { eq } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { mediaTypesInWatchedFolders, watchedFolders } from '../schema/watchedFolders'
import { nowIso } from '../utils/timestamps'

export type WatchedFolderRow = typeof watchedFolders.$inferSelect

export function createWatchedFoldersRepository(db: DrizzleClient) {
  return {
    findOrCreateByPath(path: string, name: string | null | undefined): {folder: WatchedFolderRow; created: boolean} {
      const existing = db.select().from(watchedFolders).where(eq(watchedFolders.path, path)).get()
      if (existing) {
        return {folder: existing, created: false}
      }

      const timestamp = nowIso()
      const folder = db.insert(watchedFolders)
        .values({
          path,
          name: name ?? null,
          watch: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning()
        .get()

      return {folder, created: true}
    },

    updateById(id: number, data: Partial<typeof watchedFolders.$inferInsert>): void {
      db.update(watchedFolders)
        .set({
          ...data,
          updatedAt: nowIso(),
        })
        .where(eq(watchedFolders.id, id))
        .run()
    },

    deleteById(id: number): void {
      db.delete(watchedFolders).where(eq(watchedFolders.id, id)).run()
    },

    replaceMediaTypes(folderId: number, mediaTypeIds: number[]): void {
      db.delete(mediaTypesInWatchedFolders)
        .where(eq(mediaTypesInWatchedFolders.folderId, folderId))
        .run()

      for (const mediaTypeId of mediaTypeIds) {
        db.insert(mediaTypesInWatchedFolders)
          .values({folderId, mediaTypeId})
          .onConflictDoNothing()
          .run()
      }
    },

    upsertFolderWithTypes(
      folder: {path: string; name?: string | null},
      mediaTypeIds: number[],
    ): WatchedFolderRow {
      return db.transaction((tx) => {
        const repo = createWatchedFoldersRepository(tx)
        const {folder: folderRow, created} = repo.findOrCreateByPath(folder.path, folder.name)

        if (!created && folder.name != null) {
          repo.updateById(folderRow.id, {name: folder.name})
        }

        repo.replaceMediaTypes(folderRow.id, mediaTypeIds)

        return tx.select().from(watchedFolders).where(eq(watchedFolders.id, folderRow.id)).get()!
      })
    },
  }
}
