import { describe, expect, it, vi } from 'vitest'
import { validateBody, validateQuery } from './validateBody'
import {
  BulkMetaApplyRequestSchema,
  HomeMediaQuerySchema,
  MediaTagCountQuerySchema,
  PathPayloadSchema,
} from '../../shared/schemas/requests'

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res
}

describe('validateBody', () => {
  it('passes parsed body to the next handler', () => {
    const middleware = validateBody(PathPayloadSchema)
    const req = { body: { path: '/media/video.mp4' } }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.body).toEqual({ path: '/media/video.mp4' })
  })

  it('returns 400 with field errors when validation fails', () => {
    const middleware = validateBody(PathPayloadSchema)
    const req = { body: {} }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Invalid request body',
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'path' }),
      ]),
    })
  })

  it('validates bulk meta apply payloads', () => {
    const middleware = validateBody(BulkMetaApplyRequestSchema)
    const req = {
      body: {
        itemType: 'media',
        itemIds: [1, 2],
        changes: [],
      },
    }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.body.itemType).toBe('media')
    expect(req.body.itemIds).toEqual([1, 2])
  })

  it('rejects bulk meta apply without item ids', () => {
    const middleware = validateBody(BulkMetaApplyRequestSchema)
    const req = {
      body: {
        itemType: 'tag',
        itemIds: [],
      },
    }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })
})

describe('validateQuery', () => {
  it('coerces numeric query params', () => {
    const middleware = validateQuery(HomeMediaQuerySchema)
    const req = { query: { continueLimit: '12', limit: '8' } }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.query.continueLimit).toBe(12)
    expect(req.query.limit).toBe(8)
  })

  it('requires media and tag ids for tag count queries', () => {
    const middleware = validateQuery(MediaTagCountQuerySchema)
    const req = { query: { mediaTypeId: '2', tagId: '9' } }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.query.mediaTypeId).toBe(2)
    expect(req.query.tagId).toBe(9)
  })

  it('returns 400 for invalid query params', () => {
    const middleware = validateQuery(MediaTagCountQuerySchema)
    const req = { query: { mediaTypeId: 'abc' } }
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Invalid request query',
    })
  })

  it('works when req.query is read-only (Express 5 router)', () => {
    const middleware = validateQuery(HomeMediaQuerySchema)
    const req = { query: { continueLimit: '12' } }
    Object.defineProperty(req, 'query', {
      get() {
        return { continueLimit: '12' }
      },
      configurable: true,
    })
    const res = createMockResponse()
    const next = vi.fn()

    middleware(req as never, res as never, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.query.continueLimit).toBe(12)
  })
})
