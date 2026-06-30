import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AppWebSocket } from '../types/websockets'
import type { Request } from 'express'

const {
  prepareMoveItems,
  checkBatchDiskSpace,
  prepareRename,
  checkRenameDiskSpace,
  moveFile,
  updateById,
} = vi.hoisted(() => ({
  prepareMoveItems: vi.fn(),
  checkBatchDiskSpace: vi.fn(),
  prepareRename: vi.fn(),
  checkRenameDiskSpace: vi.fn(),
  moveFile: vi.fn(),
  updateById: vi.fn(),
}))

vi.mock('./moveFile', () => ({
  prepareMoveItems,
  checkBatchDiskSpace,
  prepareRename,
  checkRenameDiskSpace,
  moveFile,
  estimateSeconds: () => 3,
}))

vi.mock('../../api/db/repositories/media', () => ({
  createMediaRepository: () => ({
    updateById,
  }),
}))

import { createMovingWsHandler } from './movingWsHandler'

type OutboundMessage = Record<string, unknown>

type MockWebSocket = AppWebSocket & {
  messages: OutboundMessage[]
  emit: (event: string, ...args: unknown[]) => Promise<void>
}

function createMockWebSocket(): MockWebSocket {
  const listeners = new Map<string, Array<(...args: unknown[]) => void | Promise<void>>>()

  const ws: MockWebSocket = {
    readyState: 1,
    messages: [],
    send(data: string) {
      ws.messages.push(JSON.parse(data) as OutboundMessage)
    },
    close: vi.fn(),
    on(event: string, listener: (...args: unknown[]) => void) {
      const current = listeners.get(event) || []
      current.push(listener)
      listeners.set(event, current)
    },
    async emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) || []) {
        await listener(...args)
      }
    },
  }

  return ws
}

describe('createMovingWsHandler', () => {
  const db = {drizzle: {}} as never
  const req = {} as Request

  beforeEach(() => {
    vi.clearAllMocks()
    checkBatchDiskSpace.mockResolvedValue(null)
    checkRenameDiskSpace.mockResolvedValue(null)
    moveFile.mockResolvedValue({crossDevice: false, size: 0})
    updateById.mockReturnValue(undefined)
  })

  it('closes immediately when a move message has no items', async () => {
    const ws = createMockWebSocket()
    createMovingWsHandler(db)(ws, req)

    await ws.emit('message', JSON.stringify({type: 'move', items: []}))

    expect(prepareMoveItems).not.toHaveBeenCalled()
    expect(ws.messages).toEqual([{type: 'close', moved: 0, failed: 0, total: 0}])
  })

  it('reports skipped move items as success without calling moveFile', async () => {
    prepareMoveItems.mockResolvedValue({
      prepared: [{
        id: 5,
        fileName: 'movie.mp4',
        folder: '/dest',
        oldPath: '/dest/movie.mp4',
        newPath: '/dest/movie.mp4',
        skip: true,
        size: 1024,
      }],
      totalBytes: 0,
      bytesNeedingCopy: 0,
    })

    const ws = createMockWebSocket()
    createMovingWsHandler(db)(ws, req)

    await ws.emit('message', JSON.stringify({
      type: 'move',
      items: [{id: 5, folder: '/dest'}],
    }))

    expect(moveFile).not.toHaveBeenCalled()
    expect(ws.messages).toEqual([
      expect.objectContaining({type: 'init', total: 1, preFailed: 0}),
      expect.objectContaining({type: 'success', id: 5, skipped: true}),
      expect.objectContaining({type: 'close', moved: 1, failed: 0, total: 1}),
    ])
  })

  it('emits NO_SPACE errors and closes without moving files', async () => {
    prepareMoveItems.mockResolvedValue({
      prepared: [{
        id: 7,
        fileName: 'clip.mp4',
        folder: '/dest',
        oldPath: '/src/clip.mp4',
        newPath: '/dest/clip.mp4',
        size: 2048,
        crossDevice: true,
      }],
      totalBytes: 2048,
      bytesNeedingCopy: 2048,
    })
    checkBatchDiskSpace.mockResolvedValue({
      required: 2048,
      available: 512,
      root: '/',
    })

    const ws = createMockWebSocket()
    createMovingWsHandler(db)(ws, req)

    await ws.emit('message', JSON.stringify({
      type: 'move',
      items: [{id: 7, folder: '/dest'}],
    }))

    expect(moveFile).not.toHaveBeenCalled()
    expect(ws.messages).toEqual([
      expect.objectContaining({type: 'init', total: 1, estimatedSeconds: 0}),
      expect.objectContaining({type: 'error', id: 7, code: 'NO_SPACE'}),
      expect.objectContaining({type: 'close', moved: 0, failed: 1, total: 1}),
    ])
  })

  it('closes rename requests with missing paths as failed', async () => {
    const ws = createMockWebSocket()
    createMovingWsHandler(db)(ws, req)

    await ws.emit('message', JSON.stringify({type: 'rename', old_path: '', new_path: ''}))

    expect(prepareRename).not.toHaveBeenCalled()
    expect(ws.messages).toEqual([{type: 'close', moved: 0, failed: 1, total: 1}])
  })

  it('returns an error close payload for invalid JSON', async () => {
    const ws = createMockWebSocket()
    createMovingWsHandler(db)(ws, req)

    await ws.emit('message', '{not-json')

    expect(ws.messages).toEqual([{type: 'close', moved: 0, failed: 0, total: 0, error: true}])
  })
})
