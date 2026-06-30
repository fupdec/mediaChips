import { describe, it, expect } from 'vitest'
import {
  asMoveError,
  errnoCode,
  errorMessage,
  errorStack,
} from './websockets'

describe('websocket error helpers', () => {
  it('extracts message and stack from Error instances', () => {
    const error = new Error('move failed')

    expect(errorMessage(error)).toBe('move failed')
    expect(errorStack(error)).toBe(error.stack)
  })

  it('stringifies non-error values', () => {
    expect(errorMessage('disk full')).toBe('disk full')
    expect(errorStack('disk full')).toBeUndefined()
  })

  it('reads errno code from error-like objects', () => {
    expect(errnoCode({code: 'ENOSPC'})).toBe('ENOSPC')
    expect(errnoCode({code: 123})).toBeUndefined()
    expect(errnoCode(null)).toBeUndefined()
  })

  it('normalizes move errors with fallback code and message', () => {
    expect(asMoveError(new Error('permission denied'))).toEqual({
      code: 'UNKNOWN',
      message: 'permission denied',
      required: undefined,
      available: undefined,
    })

    expect(asMoveError({
      code: 'NO_SPACE',
      message: 'Not enough disk space',
      required: 1024,
      available: 512,
    })).toEqual({
      code: 'NO_SPACE',
      message: 'Not enough disk space',
      required: 1024,
      available: 512,
    })
  })
})
