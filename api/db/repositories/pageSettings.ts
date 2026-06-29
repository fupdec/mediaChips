import { and, eq, isNull, type SQL } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { pageSettings } from '../schema/pageSettings'

const PAGE_SETTING_COLUMNS = {
  page: pageSettings.page,
  size: pageSettings.size,
  view: pageSettings.view,
  limit: pageSettings.limit,
  sortBy: pageSettings.sortBy,
  sortDir: pageSettings.sortDir,
  firstChar: pageSettings.firstChar,
  colors: pageSettings.colors,
  metaId: pageSettings.metaId,
  mediaTypeId: pageSettings.mediaTypeId,
  tagId: pageSettings.tagId,
  filterId: pageSettings.filterId,
  tabId: pageSettings.tabId,
} as const

function buildWhere(criteria: Record<string, unknown>): SQL | undefined {
  const conditions = Object.entries(criteria)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const column = PAGE_SETTING_COLUMNS[key as keyof typeof PAGE_SETTING_COLUMNS]
      if (!column) return null
      return value == null ? isNull(column) : eq(column, value as string | number)
    })
    .filter((condition): condition is SQL => condition != null)

  if (!conditions.length) return undefined
  return conditions.length === 1 ? conditions[0] : and(...conditions)
}

export function createPageSettingsRepository(db: DrizzleClient) {
  return {
    findOne(criteria: Record<string, unknown>) {
      const where = buildWhere(criteria)
      if (!where) return undefined
      return db.select().from(pageSettings).where(where).get()
    },

    findOrCreate(criteria: Record<string, unknown>) {
      const existing = this.findOne(criteria)
      if (existing) return [existing, false] as const

      const created = db.insert(pageSettings)
        .values(criteria as typeof pageSettings.$inferInsert)
        .returning()
        .get()

      return [created, true] as const
    },

    update(criteria: Record<string, unknown>, data: Record<string, unknown>): void {
      const where = buildWhere(criteria)
      if (!where) return
      db.update(pageSettings)
        .set(data as Partial<typeof pageSettings.$inferInsert>)
        .where(where)
        .run()
    },
  }
}
