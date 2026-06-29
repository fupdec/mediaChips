import { and, desc, eq, isNull } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { meta } from '../schema/meta'
import { pageSettings } from '../schema/pageSettings'
import { savedFilters } from '../schema/savedFilters'
import { nowIso } from '../utils/timestamps'

export type MetaRow = typeof meta.$inferSelect
export type MetaInsert = typeof meta.$inferInsert

const META_COLUMNS = new Set([
  'type', 'name', 'nameSingular', 'icon', 'hint', 'order', 'views', 'oldId',
  'synonyms', 'hidden', 'nested', 'marks', 'bookmark', 'parser', 'country', 'career',
  'scraper', 'rating', 'favorite', 'chipVariant', 'chipLabel', 'color',
  'imageAspectRatio', 'isLink', 'ratingIcon', 'ratingIconEmpty', 'ratingIconHalf',
  'ratingMax', 'ratingColor', 'ratingHalf', 'sortBy', 'sortDir',
])

function pickMetaFields(data: Record<string, unknown>): Partial<MetaInsert> {
  const picked: Partial<MetaInsert> = {}
  for (const [key, value] of Object.entries(data)) {
    if (META_COLUMNS.has(key)) {
      (picked as Record<string, unknown>)[key] = value
    }
  }
  return picked
}

export function createMetaRepository(db: DrizzleClient) {
  return {
    findAll(): MetaRow[] {
      return db.select().from(meta).all()
    },

    findById(id: number): MetaRow | undefined {
      return db.select().from(meta).where(eq(meta.id, id)).get()
    },

    findLatest(limit = 1): MetaRow[] {
      return db.select().from(meta).orderBy(desc(meta.createdAt)).limit(limit).all()
    },

    create(body: Record<string, unknown>): MetaRow {
      const {pageSetting, pageSettings: pageSettingsList, metaSetting, ...rest} = body
      void metaSetting

      const timestamp = nowIso()
      const row = db.insert(meta)
        .values({
          ...pickMetaFields(rest),
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning()
        .get()

      const nestedPageSetting = pageSetting ?? (Array.isArray(pageSettingsList) ? pageSettingsList[0] : null)
      if (nestedPageSetting && typeof nestedPageSetting === 'object') {
        db.insert(pageSettings)
          .values({
            ...(nestedPageSetting as Record<string, unknown>),
            metaId: row.id,
          } as typeof pageSettings.$inferInsert)
          .run()
      }

      return row
    },

    updateById(id: number, body: Record<string, unknown>): void {
      db.update(meta)
        .set({
          ...pickMetaFields(body),
          updatedAt: nowIso(),
        })
        .where(eq(meta.id, id))
        .run()
    },

    deleteById(id: number): void {
      db.delete(meta).where(eq(meta.id, id)).run()
    },

    ensureArrayMetaResources(metaId: number): {filterId: number; created: boolean} {
      const existing = db.select()
        .from(savedFilters)
        .where(and(eq(savedFilters.metaId, metaId), isNull(savedFilters.name)))
        .get()

      if (existing) {
        return {filterId: existing.id, created: false}
      }

      const timestamp = nowIso()
      const filter = db.insert(savedFilters)
        .values({
          name: null,
          metaId,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning()
        .get()

      db.update(pageSettings)
        .set({filterId: filter.id})
        .where(eq(pageSettings.metaId, metaId))
        .run()

      return {filterId: filter.id, created: true}
    },
  }
}
