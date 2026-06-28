import type { AnyRecord } from './db'

export interface ClipPromptEntry {
  key: string
  prompt: string
}

export interface ClipFrame {
  framePath: string
  mediaId?: unknown
  mediaPath?: string
  timestamp?: string
}

export interface ClipClassificationRow {
  key: string
  score: number
  prompt?: string
  mediaId?: unknown
  mediaPath?: string
  timestamp?: string
}

export interface ClipTagSuggestionSample {
  mediaId?: unknown
  timestamp?: string
  score?: number
}

export interface ClipTagSuggestion {
  key: string
  word: string
  label: string
  canonical: string
  occurrences: number
  confidence: number
  samples: ClipTagSuggestionSample[]
  mediaIds: unknown[]
}

export interface ClipTaggerOptions {
  locale?: string
  framesPerVideo?: number
  frameWidth?: number
  topK?: number
  minScore?: number
  limit?: number
  excludeExisting?: boolean
  tags?: Array<{ name?: string }>
}

export interface ClipTaggerMediaItem extends AnyRecord {
  id?: unknown
  path?: string
}

export interface ClipTaggerBatchResult {
  suggestions: ClipTagSuggestion[]
  frames: number
  media: number
  model: string
}

export interface ExtractFramesResult {
  tmpDir: string
  frames: ClipFrame[]
}
