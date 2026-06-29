import { and, eq, inArray } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { meta } from '../schema/meta'
import { tags } from '../schema/tags'
import { tagsInMedia } from '../schema/tagsInMedia'

type TagSummary = Pick<typeof tags.$inferSelect, 'name' | 'color' | 'metaId'>
type MetaSummary = Pick<typeof meta.$inferSelect, 'name' | 'icon'>

export function createTagsInMediaRepository(db: DrizzleClient) {
  return {
    bulkCreate(items: Array<typeof tagsInMedia.$inferInsert>) {
      if (!items.length) return []
      return db.insert(tagsInMedia).values(items).onConflictDoNothing().returning().all()
    },

    findOrCreate(data: typeof tagsInMedia.$inferInsert) {
      const existing = db.select()
        .from(tagsInMedia)
        .where(and(
          eq(tagsInMedia.mediaId, data.mediaId),
          eq(tagsInMedia.tagId, data.tagId),
          eq(tagsInMedia.metaId, data.metaId),
        ))
        .get()

      if (existing) return [existing, false] as const

      const created = db.insert(tagsInMedia).values(data).returning().get()
      return [created, true] as const
    },

    findAllByMediaId(mediaId: number) {
      const rows = db.select()
        .from(tagsInMedia)
        .where(eq(tagsInMedia.mediaId, mediaId))
        .all()

      const tagIds = [...new Set(rows.map((row) => row.tagId))]
      const tagRows = tagIds.length
        ? db.select({name: tags.name, color: tags.color, metaId: tags.metaId, id: tags.id})
          .from(tags)
          .all()
        : []
      const tagById = new Map(tagRows.map((row) => [row.id, row as TagSummary & {id: number}]))

      const metaIds = [...new Set(tagRows.map((row) => row.metaId).filter((id): id is number => id != null))]
      const metaRows = metaIds.length
        ? db.select({id: meta.id, name: meta.name, icon: meta.icon}).from(meta).all()
        : []
      const metaById = new Map(metaRows.map((row) => [row.id, row as MetaSummary]))

      return rows.map((row) => {
        const tag = tagById.get(row.tagId)
        return {
          ...row,
          tag: tag
            ? {
              ...tag,
              meta: tag.metaId ? metaById.get(tag.metaId) ?? null : null,
            }
            : null,
        }
      })
    },

    deleteByMediaId(mediaId: number): void {
      db.delete(tagsInMedia).where(eq(tagsInMedia.mediaId, mediaId)).run()
    },

    deleteOne(mediaId: number, tagId: number): void {
      db.delete(tagsInMedia)
        .where(and(
          eq(tagsInMedia.mediaId, mediaId),
          eq(tagsInMedia.tagId, tagId),
        ))
        .run()
    },

    deleteByMediaAndMeta(mediaId: number, metaId: number): void {
      db.delete(tagsInMedia)
        .where(and(
          eq(tagsInMedia.mediaId, mediaId),
          eq(tagsInMedia.metaId, metaId),
        ))
        .run()
    },

    deleteByMediaIdsAndMeta(mediaIds: number[], metaId: number): void {
      if (!mediaIds.length) return

      db.delete(tagsInMedia)
        .where(and(
          inArray(tagsInMedia.mediaId, mediaIds),
          eq(tagsInMedia.metaId, metaId),
        ))
        .run()
    },
  }
}
