import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

export const filterRowsInSavedFilters = sqliteTable('filterRowsInSavedFilters', {
  filterId: integer('filterId').notNull(),
  rowId: integer('rowId').notNull(),
}, (table) => ({
  pk: primaryKey({columns: [table.filterId, table.rowId]}),
}))
