import type { Sequelize as SequelizeInstance } from 'sequelize'
import type { AnyRecord } from './db'

export type SequelizeModule = typeof import('sequelize')

export interface SequelizeQueryInterface {
  query(sql: string, options?: unknown): Promise<[AnyRecord[], unknown]>
  random(): unknown
  describeTable(table: string): Promise<AnyRecord>
  bulkInsert(table: string, records: unknown[], options?: unknown): Promise<unknown>
  bulkDelete(table: string, records?: unknown, options?: unknown): Promise<unknown>
  addColumn(table: string, column: string, options?: unknown): Promise<unknown>
  removeColumn(table: string, column: string, options?: unknown): Promise<unknown>
  addIndex(table: string, fields: unknown, options?: unknown): Promise<unknown>
  removeIndex(table: string, index: string, options?: unknown): Promise<unknown>
  showIndex(table: string): Promise<AnyRecord[]>
  showAllTables(): Promise<string[]>
  sequelize: SequelizeConnection
}

export interface SequelizeConnection extends SequelizeQueryInterface {
  models?: AnyRecord
  sync(options?: unknown): Promise<unknown>
  getQueryInterface(): SequelizeQueryInterface
  query(sql: string, options?: unknown): Promise<[AnyRecord[], unknown]>
  authenticate(): Promise<void>
  close(): Promise<void>
}

export type SequelizeModelFactory = (
  sequelize: SequelizeInstance,
  Sequelize: SequelizeModule,
) => unknown

export type MigrationContext = {
  context: SequelizeQueryInterface
}

export type MigrationFn = (ctx: MigrationContext) => Promise<void>
