export type AnyRecord = Record<string, unknown>

export interface SequelizeQueryInterface {
  query(sql: string, options?: unknown): Promise<[AnyRecord[], unknown]>
  random(): unknown
}

export interface SequelizeModelStatic {
  findAll(options?: unknown): Promise<AnyRecord[]>
  findOne(options?: unknown): Promise<AnyRecord | null>
  findByPk?(id: unknown, options?: unknown): Promise<unknown | null>
  findOrCreate?(options?: unknown): Promise<[unknown, boolean]>
  count(options?: unknown): Promise<number>
  bulkCreate(items: unknown[], options?: unknown): Promise<unknown[]>
  create(values: unknown, options?: unknown): Promise<unknown>
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
  sequelize: SequelizeQueryInterface
  Sequelize: {Op: Record<string, any>}
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
