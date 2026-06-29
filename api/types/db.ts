import type { DrizzleClient } from '../db/client'
import type Database from 'better-sqlite3'

export type AnyRecord = Record<string, unknown>

export type SequelizeModule = typeof import('sequelize')

export type SequelizeInstance = AnyRecord & {
  update(values: unknown, options?: unknown): Promise<unknown>
  destroy?(options?: unknown): Promise<number>
  toJSON?(): AnyRecord
  dataValues?: AnyRecord
}

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
}

export interface SequelizeModelStatic {
  findAll(options?: unknown): Promise<SequelizeInstance[]>
  findOne(options?: unknown): Promise<SequelizeInstance | null>
  findByPk(id: unknown, options?: unknown): Promise<SequelizeInstance | null>
  findAndCountAll(options?: unknown): Promise<{rows: AnyRecord[]; count: number}>
  findOrCreate(options?: unknown): Promise<[SequelizeInstance, boolean]>
  count(options?: unknown): Promise<number>
  bulkCreate(items: unknown[], options?: unknown): Promise<SequelizeInstance[]>
  create(values: unknown, options?: unknown): Promise<SequelizeInstance>
  update(values: unknown, options?: unknown): Promise<unknown>
  upsert(values: unknown, options?: unknown): Promise<unknown>
  destroy(options?: unknown): Promise<number>
  max?(field: string, options?: unknown): Promise<unknown>
}

export interface ApiDb {
  path?: string
  path_databases?: string
  config?: {
    id?: string
    name?: string
    active?: boolean
  }
  sequelize: SequelizeConnection
  Sequelize: SequelizeModule
  drizzle: DrizzleClient
  sqlite: Database.Database
  Media: SequelizeModelStatic
  Mark: SequelizeModelStatic
  Tag: SequelizeModelStatic
  Meta: SequelizeModelStatic
  MediaType: SequelizeModelStatic
  FilterRow: SequelizeModelStatic
  FilterRowsInSavedFilter: SequelizeModelStatic
  TagsInFilterRow: SequelizeModelStatic
  SavedFilter: SequelizeModelStatic
  Playlist: SequelizeModelStatic
  TagsInMedia: SequelizeModelStatic
  ValuesInMedia: SequelizeModelStatic
  TagsInTag: SequelizeModelStatic
  ValuesInTag: SequelizeModelStatic
  VideoMetadata: SequelizeModelStatic
  ImageMetadata: SequelizeModelStatic
  Setting: SequelizeModelStatic
  Tab: SequelizeModelStatic
  PinnedMeta: SequelizeModelStatic
  MetaInMediaType: SequelizeModelStatic
  MetaSetting: SequelizeModelStatic
  PageSetting: SequelizeModelStatic
  MediaInPlaylists: SequelizeModelStatic
  MediaTypesInWatchedFolders: SequelizeModelStatic
  WatchedFolder: SequelizeModelStatic
  [modelName: string]: unknown
}

export type MediaLike = AnyRecord & {
  id?: number | string
  path?: string
  name?: string
  basename?: string
  ext?: string
  mediaTypeId?: number | string
  filesize?: number
  contentHash?: string | null
}

export type FilterLike = AnyRecord & {
  type?: string
  param?: string | number
  cond?: string
  val?: unknown
  active?: boolean | number | string
}

export type TagLike = AnyRecord & {
  id?: number | string
  name?: string
  metaId?: number | string
}

export type MetaLike = AnyRecord & {
  id?: number | string
  name?: string
  type?: string
}
