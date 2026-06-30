import { describe, expect, it } from 'vitest'
import { buildFolderPathLikePatterns } from './watcherFolderPaths'

describe('buildFolderPathLikePatterns', () => {
  it('builds slash patterns for a normalized folder path', () => {
    const patterns = buildFolderPathLikePatterns('/media/videos')

    expect(patterns).toContain('/media/videos/%')
    expect(patterns).toContain('/media/videos\\%')
  })

  it('strips trailing separators before building patterns', () => {
    const patterns = buildFolderPathLikePatterns('/media/videos/')

    expect(patterns).toContain('/media/videos/%')
    expect(patterns.some((pattern) => pattern.includes('//%'))).toBe(false)
  })
})
