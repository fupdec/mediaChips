import { count, eq, inArray } from 'drizzle-orm'
import type Database from 'better-sqlite3'
import type { DrizzleClient } from '../client'
import { tags } from '../schema/tags'
import { nowIso } from '../utils/timestamps'

export type TagRow = typeof tags.$inferSelect
export type TagInsert = typeof tags.$inferInsert

const TAG_ITEMS_QUERY = `SELECT tags.*, tags_in_tags.tag_tags, values_in_tags.tag_values
FROM tags
         LEFT JOIN (SELECT tagsInTags.parentTagId                                     id,
                           GROUP_CONCAT(tagsInTags.tagId || '^' || tagsInTags.metaId) tag_tags
                    FROM tagsInTags
                    GROUP BY id) AS tags_in_tags ON tags.id = tags_in_tags.id
         LEFT JOIN (SELECT valuesInTags.tagId                                             id,
                           GROUP_CONCAT(valuesInTags.value || '^' || valuesInTags.metaId) tag_values
                    FROM valuesInTags
                    GROUP BY id) AS values_in_tags ON tags.id = values_in_tags.id
WHERE tags.metaId = ?`

export function createTagsRepository(db: DrizzleClient, sqlite: Database.Database) {
  return {
    bulkCreate(items: Array<Partial<TagInsert>>): TagRow[] {
      if (!items.length) return []

      const timestamp = nowIso()
      const values = items.map((item) => ({
        oldId: item.oldId ?? null,
        name: item.name ?? '',
        synonyms: item.synonyms ?? null,
        rating: item.rating ?? 0,
        favorite: item.favorite ?? false,
        bookmark: item.bookmark ?? null,
        country: item.country ?? null,
        color: item.color ?? null,
        views: item.views ?? 0,
        viewedAt: item.viewedAt ?? null,
        metaId: item.metaId ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))

      return db.insert(tags).values(values).returning().all()
    },

    findAllRaw(): TagRow[] {
      return db.select().from(tags).all()
    },

    findOldIdMappings(): Array<{id: number; oldId: string | null}> {
      return db.select({id: tags.id, oldId: tags.oldId}).from(tags).all()
    },

    findById(id: number): TagRow | undefined {
      return db.select().from(tags).where(eq(tags.id, id)).get()
    },

    countAll(): number {
      const row = db.select({count: count()}).from(tags).get()
      return Number(row?.count ?? 0)
    },

    updateById(id: number, data: Partial<TagInsert>, options: {silent?: boolean} = {}): void {
      const payload: Partial<TagInsert> = {...data}
      if (!options.silent) {
        payload.updatedAt = nowIso()
      }

      db.update(tags)
        .set(payload)
        .where(eq(tags.id, id))
        .run()
    },

    updateByIds(ids: number[], data: Partial<TagInsert>): void {
      if (!ids.length) return

      db.update(tags)
        .set({
          ...data,
          updatedAt: nowIso(),
        })
        .where(inArray(tags.id, ids))
        .run()
    },

    deleteById(id: number): void {
      db.delete(tags).where(eq(tags.id, id)).run()
    },

    getItemsForMeta(metaId: number, ids: number[] = []) {
      if (!ids.length) {
        return sqlite.prepare(TAG_ITEMS_QUERY).all(metaId)
      }

      const placeholders = ids.map(() => '?').join(', ')
      return sqlite.prepare(`${TAG_ITEMS_QUERY} AND tags.id IN (${placeholders})`).all(metaId, ...ids)
    },
  }
}
