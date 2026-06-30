import { promises as fsPromises } from 'fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const findById = vi.fn()

vi.mock('../../api/db/repositories/media', () => ({
  createMediaRepository: () => ({
    findById,
  }),
}))

vi.mock('../server/resolvePathCache', () => ({
  clearResolvedPathCache: vi.fn(),
}))

import {
  checkBatchDiskSpace,
  estimateSeconds,
  prepareMoveItems,
  prepareRename,
} from './moveFile'

describe('estimateSeconds', () => {
  it('returns at least one second for small batches', () => {
    expect(estimateSeconds(0, 0)).toBe(1)
    expect(estimateSeconds(1024, 0)).toBe(1)
  })

  it('estimates longer copy times for large cross-device batches', () => {
    const bytes = 800 * 1024 * 1024

    expect(estimateSeconds(bytes, bytes)).toBeGreaterThan(1)
    expect(estimateSeconds(bytes, 0)).toBeLessThan(estimateSeconds(bytes, bytes))
  })
})

describe('prepareMoveItems', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    findById.mockReset()
    vi.spyOn(fsPromises, 'stat').mockRejectedValue(new Error('missing'))
  })

  it('marks missing database rows as DB_NOT_FOUND', async () => {
    findById.mockReturnValue(null)

    const result = await prepareMoveItems({drizzle: {}} as never, [{id: 42, folder: '/dest'}])

    expect(result.prepared).toEqual([
      {
        id: 42,
        error: {code: 'DB_NOT_FOUND', message: 'Media not found in database'},
      },
    ])
    expect(result.totalBytes).toBe(0)
    expect(result.bytesNeedingCopy).toBe(0)
  })

  it('skips items that already resolve to the destination path', async () => {
    findById.mockReturnValue({id: 5, path: '/dest/movie.mp4'})
    vi.spyOn(fsPromises, 'stat').mockImplementation(async (targetPath) => {
      if (String(targetPath) === '/dest/movie.mp4') {
        return {size: 4096, isDirectory: () => false} as never
      }
      throw new Error('missing')
    })

    const result = await prepareMoveItems({drizzle: {}} as never, [{id: 5, folder: '/dest'}])

    expect(result.prepared).toEqual([
      expect.objectContaining({
        id: 5,
        fileName: 'movie.mp4',
        folder: '/dest',
        oldPath: '/dest/movie.mp4',
        newPath: '/dest/movie.mp4',
        skip: true,
        size: 4096,
      }),
    ])
  })
})

describe('checkBatchDiskSpace', () => {
  it('returns null when no cross-device copies are required', async () => {
    await expect(checkBatchDiskSpace([
      {id: 1, oldPath: '/a.mp4', newPath: '/b/a.mp4', size: 100, crossDevice: false},
    ], 0)).resolves.toBeNull()
  })
})

describe('prepareRename', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(fsPromises, 'stat').mockRejectedValue(new Error('missing'))
  })

  it('returns NOT_FOUND when the source file is missing', async () => {
    const result = await prepareRename('/missing/old.mp4', '/dest/new.mp4')

    expect(result.error).toEqual({
      code: 'NOT_FOUND',
      message: 'Source file not found',
    })
  })
})
