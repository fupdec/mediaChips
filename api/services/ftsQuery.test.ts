import { describe, expect, it } from 'vitest'
import { buildFtsMatchQuery } from './ftsQuery'

describe('buildFtsMatchQuery', () => {
  it('returns null for empty input', () => {
    expect(buildFtsMatchQuery('')).toBeNull()
    expect(buildFtsMatchQuery('   ')).toBeNull()
  })

  it('builds prefix match for a single token', () => {
    expect(buildFtsMatchQuery('actor')).toBe('"actor"*')
  })

  it('builds AND prefix match for multiple tokens', () => {
    expect(buildFtsMatchQuery('john smith')).toBe('"john"* AND "smith"*')
  })

  it('escapes double quotes in tokens', () => {
    expect(buildFtsMatchQuery('a"b')).toBe('"a""b"*')
  })
})
