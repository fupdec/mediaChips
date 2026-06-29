import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { formatValidationError, validated } from './validate'

describe('formatValidationError', () => {
  it('formats zod issue paths', () => {
    try {
      z.object({ id: z.number() }).parse({ id: 'bad' })
    } catch (error) {
      expect(formatValidationError(error)).toContain('id:')
    }
  })
})

describe('validated', () => {
  it('warns with formatted zod paths and falls back to raw data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const parser = z.object({ id: z.number() }).parse

    const result = validated(parser, { id: 'bad' })

    expect(result).toEqual({ id: 'bad' })
    expect(warn).toHaveBeenCalledWith(
      '[typedApi] Response validation failed:',
      expect.stringContaining('id:'),
    )
    warn.mockRestore()
  })
})
