import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  coercedBooleanSchema,
  nullableCoercedNumberSchema,
  optionalCoercedNumberSchema,
} from './coercion'

describe('schema coercion helpers', () => {
  it('coerces sqlite-style booleans', () => {
    expect(coercedBooleanSchema.parse(1)).toBe(true)
    expect(coercedBooleanSchema.parse(0)).toBe(false)
    expect(coercedBooleanSchema.parse('true')).toBe(true)
    expect(coercedBooleanSchema.parse(null)).toBe(false)
  })

  it('coerces numeric strings', () => {
    expect(optionalCoercedNumberSchema.parse('12')).toBe(12)
    expect(nullableCoercedNumberSchema.parse(null)).toBeNull()
  })

  it('rejects invalid numbers', () => {
    expect(() => optionalCoercedNumberSchema.parse('abc')).toThrow(z.ZodError)
  })
})
