export type MoveProgressHandler = (transferred: number, size: number) => void

export interface MoveItemInput {
  id: unknown
  folder: string
}

export interface MoveItemError {
  code: string
  message?: string
}

export interface PreparedMoveItem {
  id: unknown
  fileName?: string
  folder?: string
  oldPath?: string
  newPath?: string
  size?: number
  skip?: boolean
  crossDevice?: boolean
  error?: MoveItemError
}

export interface PreparedRenameItem {
  oldPath: string
  newPath: string
  fileName: string
  folder: string
  size?: number
  skip?: boolean
  crossDevice?: boolean
  error?: MoveItemError
}

export interface DiskSpaceError {
  required: number
  available: number
  root?: string
}

export interface MoveFileResult {
  crossDevice: boolean
  size: number
}

export interface PrepareMoveItemsResult {
  prepared: PreparedMoveItem[]
  totalBytes: number
  bytesNeedingCopy: number
}
