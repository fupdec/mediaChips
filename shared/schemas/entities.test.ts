import { describe, expect, it } from 'vitest'
import {
  parseMediaListResponse,
  parseMediaTypes,
  parseMetaList,
  parseSettings,
  parseTags,
} from '@shared/schemas'
import { FilterObjectSchema } from '@shared/schemas/entities'
import { ItemsListRequestSchema } from '@shared/schemas/requests'

describe('shared schemas', () => {
  it('parses media types', () => {
    const result = parseMediaTypes([{ id: 1, type: 'video', name: 'Videos' }])
    expect(result).toEqual([{ id: 1, type: 'video', name: 'Videos' }])
  })

  it('parses tags and meta lists', () => {
    expect(parseTags([{ id: 2, name: 'Tag' }])).toEqual([{ id: 2, name: 'Tag' }])
    expect(parseMetaList([{ id: 3, name: 'Meta', type: 'array' }])).toEqual([
      { id: 3, name: 'Meta', type: 'array' },
    ])
  })

  it('parses settings entries', () => {
    expect(parseSettings([{ option: 'theme', value: 'dark' }])).toEqual([
      { option: 'theme', value: 'dark' },
    ])
  })

  it('parses media list responses', () => {
    const result = parseMediaListResponse({
      items: [{ id: 10, name: 'clip.mp4' }],
      totalFiltered: 1,
    })
    expect(result.totalFiltered).toBe(1)
    expect(result.items?.[0]?.id).toBe(10)
  })

  it('rejects invalid media type payloads', () => {
    expect(() => parseMediaTypes([{ id: 'bad' }])).toThrow()
  })

  it('coerces sqlite-style filter booleans', () => {
    const filter = FilterObjectSchema.parse({
      id: 1,
      param: 17,
      type: 'array',
      cond: 'in all',
      val: [717],
      note: null,
      active: 1,
      lock: 0,
    })
    expect(filter.active).toBe(true)
    expect(filter.lock).toBe(false)
  })

  it('accepts items list requests with legacy filter values', () => {
    const payload = ItemsListRequestSchema.parse({
      mediaTypeId: '1',
      page: '1',
      limit: 20,
      filters: [{
        id: 1,
        param: 17,
        type: 'array',
        cond: 'in all',
        val: [717],
        note: null,
        active: 1,
        lock: false,
        metaId: null,
      }],
      sortBy: 'createdAt',
      direction: 'desc',
      find_duplicates: 0,
    })
    expect(payload.mediaTypeId).toBe(1)
    expect(payload.filters?.[0]?.active).toBe(true)
    expect(payload.filters?.[0]?.metaId).toBeNull()
    expect(payload.find_duplicates).toBe(false)
  })
})
