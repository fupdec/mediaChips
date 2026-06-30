/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { checkFilesExist } from './checkFilesExist'

describe('checkFilesExist', () => {
  it('returns existence map for unique paths', async () => {
    const results = await checkFilesExist([
      __filename,
      __filename,
      '/definitely-missing-file-12345.tmp',
    ])

    expect(results[__filename]).toBe(true)
    expect(results['/definitely-missing-file-12345.tmp']).toBe(false)
    expect(Object.keys(results)).toHaveLength(2)
  })
})
