import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildFilteredTotalsCacheKey,
  clearMediaListTotalsCache,
  getCachedFilteredTotals,
  getCachedUnfilteredTotal,
  setCachedFilteredTotals,
  setCachedUnfilteredTotal,
} from './mediaListTotalsCache'

describe('mediaListTotalsCache', () => {
  afterEach(() => {
    clearMediaListTotalsCache()
    vi.useRealTimers()
  })

  it('stores and returns filtered totals by cache key', () => {
    const key = buildFilteredTotalsCacheKey({
      mediaTypeId: 1,
      filters: [{ active: true, param: 'rating', type: 'number', cond: '>', val: 5 }],
    })

    setCachedFilteredTotals(key, { totalFiltered: 12, totalFilesize: 4096 })
    expect(getCachedFilteredTotals(key)).toEqual({ totalFiltered: 12, totalFilesize: 4096 })
  })

  it('expires cached totals after TTL', () => {
    vi.useFakeTimers()
    const key = buildFilteredTotalsCacheKey({ mediaTypeId: 2, filters: [] })

    setCachedFilteredTotals(key, { totalFiltered: 3, totalFilesize: 100 })
    setCachedUnfilteredTotal(2, 99)

    vi.advanceTimersByTime(31_000)
    expect(getCachedFilteredTotals(key)).toBeNull()

    vi.advanceTimersByTime(30_000)
    expect(getCachedUnfilteredTotal(2)).toBeNull()
  })
})
