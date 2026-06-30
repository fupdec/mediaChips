import path from 'path'
import { normalizeMediaPath } from './normalizeUserPath'

export function buildFolderPathLikePatterns(folderPath: string): string[] {
  const normalized = normalizeMediaPath(folderPath).replace(/[\\/]+$/, '')
  if (!normalized) return []

  const patterns = new Set<string>()
  for (const sep of ['/', '\\']) {
    patterns.add(`${normalized}${sep}%`)
  }

  const resolved = path.resolve(normalized).replace(/[\\/]+$/, '')
  if (resolved !== normalized) {
    for (const sep of ['/', '\\']) {
      patterns.add(`${resolved}${sep}%`)
    }
  }

  return [...patterns]
}
