import { and, eq, inArray } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { filterRows } from '../schema/filterRows'
import { filterRowsInSavedFilters } from '../schema/filterRowsInSavedFilters'

export type FilterRowsInSavedFilterRow = typeof filterRowsInSavedFilters.$inferSelect

export function createFilterRowsInSavedFiltersRepository(db: DrizzleClient) {
  return {
    findByFilterId(filterId: number) {
      const links = db.select()
        .from(filterRowsInSavedFilters)
        .where(eq(filterRowsInSavedFilters.filterId, filterId))
        .all()

      const rowIds = links.map((link) => link.rowId)
      const rows = rowIds.length
        ? db.select().from(filterRows).where(inArray(filterRows.id, rowIds)).all()
        : []
      const rowById = new Map(rows.map((row) => [row.id, row]))

      return links.map((link) => ({
        ...link,
        filterRow: rowById.get(link.rowId) ?? null,
      }))
    },

    findByFilterIds(filterIds: number[]) {
      if (!filterIds.length) return []

      return db.select()
        .from(filterRowsInSavedFilters)
        .where(inArray(filterRowsInSavedFilters.filterId, filterIds))
        .all()
    },

    findOrCreate(filterId: number, rowId: number): {row: FilterRowsInSavedFilterRow; created: boolean} {
      const existing = db.select()
        .from(filterRowsInSavedFilters)
        .where(and(
          eq(filterRowsInSavedFilters.filterId, filterId),
          eq(filterRowsInSavedFilters.rowId, rowId),
        ))
        .get()

      if (existing) {
        return {row: existing, created: false}
      }

      const row = db.insert(filterRowsInSavedFilters)
        .values({filterId, rowId})
        .returning()
        .get()

      return {row, created: true}
    },
  }
}
