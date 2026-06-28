import type { AnyRecord } from './db'

export interface OldIdMapping {
  oldId: unknown
  id?: unknown
  type?: string
}

export interface SettingOptionRow {
  option: string
}

export type LowDbTagsByMetaId = Record<string, AnyRecord[]>

export interface LowDbImportObject {
  meta: AnyRecord[]
  tags: Array<LowDbTagsByMetaId>
  videos: AnyRecord[]
  videoMetadata: AnyRecord[]
  playlists: AnyRecord[]
  marks: AnyRecord[]
  onlyMeta: AnyRecord[]
  metaInTags: AnyRecord[]
  pinnedMeta: AnyRecord[]
  settings: AnyRecord
  watchedFolders: AnyRecord[]
}
