import { describe, expect, it } from 'vitest'
import {
  chunkIntoRows,
  getColumnCount,
  getMinColumnWidth,
  shouldUseVirtualGrid,
  VIRTUAL_GRID_THRESHOLD,
} from '@/utils/gridLayout'

describe('shouldUseVirtualGrid', () => {
  it('is disabled while lists use server pagination and lazy previews', () => {
    expect(shouldUseVirtualGrid(VIRTUAL_GRID_THRESHOLD - 1, true)).toBe(false)
    expect(shouldUseVirtualGrid(VIRTUAL_GRID_THRESHOLD, true)).toBe(false)
    expect(shouldUseVirtualGrid(100, true, 'media')).toBe(false)
    expect(shouldUseVirtualGrid(100, true, 'tag')).toBe(false)
    expect(shouldUseVirtualGrid(100, false)).toBe(false)
  })
})

describe('chunkIntoRows', () => {
  it('groups items into rows by column count', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]
    const rows = chunkIntoRows(items, 2)

    expect(rows).toHaveLength(3)
    expect(rows[0].items.map((item) => item.id)).toEqual([1, 2])
    expect(rows[1].items.map((item) => item.id)).toEqual([3, 4])
    expect(rows[2].items.map((item) => item.id)).toEqual([5])
    expect(rows[2].startIndex).toBe(4)
  })
})

describe('getColumnCount', () => {
  it('returns one column for line grid', () => {
    expect(getColumnCount(1200, 200, 20, { lineGrid: true })).toBe(1)
  })

  it('derives column count from container width', () => {
    const minWidth = getMinColumnWidth({ size: 3 })
    const columns = getColumnCount(1200, minWidth, 20)

    expect(columns).toBeGreaterThan(1)
  })
})
