import { describe, expect, it } from 'vitest'
import {
  parseMediaListResponse,
  parseMediaTypes,
  parseMetaList,
  parseSettings,
  parseTags,
} from '@shared/schemas'

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
})
