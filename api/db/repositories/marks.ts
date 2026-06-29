import { asc, eq } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { marks } from '../schema/marks'
import { media } from '../schema/media'
import { meta } from '../schema/meta'
import { tags } from '../schema/tags'

export type MarkRow = typeof marks.$inferSelect
export type MarkInsert = typeof marks.$inferInsert

export function createMarksRepository(db: DrizzleClient) {
  return {
    create(data: Partial<MarkInsert>): MarkRow {
      return db.insert(marks)
        .values({
          type: data.type ?? null,
          text: data.text ?? null,
          time: data.time ?? null,
          end: data.end ?? null,
          tagId: data.tagId ?? null,
          mediaId: data.mediaId ?? null,
        })
        .returning()
        .get()
    },

    findIdsByMediaId(mediaId: unknown): Array<{id: number}> {
      return db.select({id: marks.id})
        .from(marks)
        .where(eq(marks.mediaId, Number(mediaId)))
        .all()
    },

    findIdsByTagId(tagId: unknown): Array<{id: number}> {
      return db.select({id: marks.id})
        .from(marks)
        .where(eq(marks.tagId, Number(tagId)))
        .all()
    },

    findAllForVideo(mediaId: number) {
      const rows = db.select()
        .from(marks)
        .where(eq(marks.mediaId, mediaId))
        .orderBy(asc(marks.time))
        .all()

      const tagIds = [...new Set(rows.map((row) => row.tagId).filter((id): id is number => id != null))]
      const allTags = tagIds.length
        ? db.select().from(tags).all().filter((tag) => tagIds.includes(tag.id))
        : []
      const tagById = new Map(allTags.map((tag) => [tag.id, tag]))

      const metaIds = [...new Set(allTags.map((tag) => tag.metaId).filter((id): id is number => id != null))]
      const metaRows = metaIds.length ? db.select().from(meta).all() : []
      const metaById = new Map(metaRows.filter((row) => metaIds.includes(row.id)).map((row) => [row.id, row]))

      return rows.map((row) => {
        const tag = row.tagId ? tagById.get(row.tagId) : null
        const metaRow = tag?.metaId ? metaById.get(tag.metaId) ?? null : null
        return {
          ...row,
          'tag.name': tag?.name ?? null,
          'tag.color': tag?.color ?? null,
          'tag.metaId': tag?.metaId ?? null,
          meta: metaRow,
        }
      })
    },

    findAllWithRelations() {
      const rows = db.select().from(marks).all()
      const tagIds = [...new Set(rows.map((row) => row.tagId).filter((id): id is number => id != null))]
      const mediaIds = [...new Set(rows.map((row) => row.mediaId).filter((id): id is number => id != null))]

      const tagRows = tagIds.length ? db.select().from(tags).all().filter((tag) => tagIds.includes(tag.id)) : []
      const mediaRows = mediaIds.length ? db.select().from(media).all().filter((item) => mediaIds.includes(item.id)) : []
      const metaIds = [...new Set(tagRows.map((tag) => tag.metaId).filter((id): id is number => id != null))]
      const metaRows = metaIds.length ? db.select().from(meta).all().filter((row) => metaIds.includes(row.id)) : []

      const tagById = new Map(tagRows.map((tag) => [tag.id, tag]))
      const mediaById = new Map(mediaRows.map((item) => [item.id, item]))
      const metaById = new Map(metaRows.map((row) => [row.id, row]))

      return rows.map((row) => {
        const tag = row.tagId ? tagById.get(row.tagId) : null
        const medium = row.mediaId ? mediaById.get(row.mediaId) : null
        return {
          ...row,
          tag: tag
            ? {
              ...tag,
              meta: tag.metaId ? metaById.get(tag.metaId) ?? null : null,
            }
            : null,
          media: medium,
        }
      })
    },

    deleteById(id: number): void {
      db.delete(marks).where(eq(marks.id, id)).run()
    },
  }
}
