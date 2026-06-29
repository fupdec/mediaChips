import type { MediaType } from '@/types/media'

export interface WatcherFolderInfo {
  id: number
  name?: string
  path?: string
  watch?: boolean
  [key: string]: unknown
}

export interface WatcherFileChangeGroup {
  type: MediaType
  new: string[]
  lost: Array<{ id: number; path: string; [key: string]: unknown }>
}

export interface WatcherFilesEntry {
  folder: WatcherFolderInfo
  files: WatcherFileChangeGroup[]
}

export type WatcherFolderState = WatcherFilesEntry

export interface WatcherWsInboundMessage {
  type: string
  data?: unknown
}

export function isWatcherFilesMessage(
  message: WatcherWsInboundMessage,
): message is WatcherWsInboundMessage & { type: 'files'; data: WatcherFilesEntry[] } {
  return message.type === 'files' && Array.isArray(message.data)
}

export function parseWatcherInboundMessage(raw: unknown): WatcherWsInboundMessage {
  if (!raw || typeof raw !== 'object') {
    return { type: 'unknown' }
  }

  const message = raw as WatcherWsInboundMessage
  return {
    type: typeof message.type === 'string' ? message.type : 'unknown',
    data: message.data,
  }
}
