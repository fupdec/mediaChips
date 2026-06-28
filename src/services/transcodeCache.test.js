import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  clearCache,
  clearCacheExcept,
  getCacheStats,
  getCacheDir,
} from '../../api/services/transcode/transcodeCache.js'

describe('transcodeCache single-video policy', () => {
  let rootDir
  let databasesPath
  const dbId = 'test-db'

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-transcode-cache-'))
    databasesPath = path.join(rootDir, 'databases')
    const cacheDir = getCacheDir(databasesPath, dbId)
    fs.mkdirSync(cacheDir, {recursive: true})

    fs.writeFileSync(path.join(cacheDir, 'aaa.json'), '{}')
    fs.writeFileSync(path.join(cacheDir, 'aaa.mp4'), Buffer.alloc(100))
    fs.writeFileSync(path.join(cacheDir, 'bbb.json'), '{}')
    fs.writeFileSync(path.join(cacheDir, 'bbb.mp4'), Buffer.alloc(200))
  })

  afterEach(() => {
    fs.rmSync(rootDir, {recursive: true, force: true})
  })

  it('reports total cache size', () => {
    expect(getCacheStats(databasesPath, dbId)).toEqual({
      bytes: 304,
      files: 4,
      entries: 0,
    })
  })

  it('keeps only the current video cache entry', () => {
    const removed = clearCacheExcept(databasesPath, dbId, 'bbb')
    expect(removed).toBe(2)
    expect(getCacheStats(databasesPath, dbId)).toEqual({
      bytes: 202,
      files: 2,
      entries: 0,
    })
  })

  it('clears cache and returns freed bytes', () => {
    expect(clearCache(databasesPath, dbId)).toEqual({
      removed: 4,
      bytes: 304,
    })
    expect(getCacheStats(databasesPath, dbId)).toEqual({
      bytes: 0,
      files: 0,
      entries: 0,
    })
  })
})
