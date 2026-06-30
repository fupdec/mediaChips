import { describe, expect, it } from 'vitest'
import {
  buildMasonryLayout,
  chunkIntoRows,
  estimateRowHeight,
  estimateMasonryItemHeight,
  findVisibleMasonryItems,
  getColumnCount,
  getMediaAspectRatio,
  getMinColumnWidth,
  packMasonryColumns,
  shouldUseVirtualGrid,
  shouldUseVirtualMasonry,
  VIRTUAL_GRID_THRESHOLD,
} from '@/utils/gridLayout'

describe('shouldUseVirtualGrid', () => {
  it('enables virtual grid for infinite-scroll lists with enough items', () => {
    expect(shouldUseVirtualGrid(VIRTUAL_GRID_THRESHOLD - 1, true, 'tag')).toBe(false)
    expect(shouldUseVirtualGrid(VIRTUAL_GRID_THRESHOLD, true, 'tag')).toBe(true)
    expect(shouldUseVirtualGrid(100, true, 'tag')).toBe(true)
    expect(shouldUseVirtualGrid(VIRTUAL_GRID_THRESHOLD, true, 'media')).toBe(true)
    expect(shouldUseVirtualGrid(100, true, 'media')).toBe(true)
    expect(shouldUseVirtualGrid(100, false, 'tag')).toBe(false)
    expect(shouldUseVirtualGrid(100, false, 'media')).toBe(false)
  })
})

describe('shouldUseVirtualMasonry', () => {
  it('uses the same threshold as the row virtualizer', () => {
    expect(shouldUseVirtualMasonry(VIRTUAL_GRID_THRESHOLD, true, 'media')).toBe(true)
    expect(shouldUseVirtualMasonry(VIRTUAL_GRID_THRESHOLD - 1, true, 'media')).toBe(false)
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

describe('estimateRowHeight', () => {
  it('uses meta image aspect ratio for tag card grids', () => {
    const defaultHeight = estimateRowHeight({
      size: 3,
      containerWidth: 1200,
      columnCount: 4,
      imageAspectRatio: 1,
    })
    const wideHeight = estimateRowHeight({
      size: 3,
      containerWidth: 1200,
      columnCount: 4,
      imageAspectRatio: 2,
    })

    expect(wideHeight).toBeLessThan(defaultHeight)
  })

  it('uses square estimate for image grids', () => {
    const imageHeight = estimateRowHeight({
      size: 3,
      containerWidth: 1200,
      columnCount: 4,
      imageGrid: true,
    })
    const tagHeight = estimateRowHeight({
      size: 3,
      containerWidth: 1200,
      columnCount: 4,
      imageAspectRatio: 1,
    })

    expect(imageHeight).toBe(tagHeight)
  })
})

describe('getMediaAspectRatio', () => {
  it('returns width divided by height', () => {
    expect(getMediaAspectRatio({ width: 1920, height: 1080 })).toBeCloseTo(16 / 9)
    expect(getMediaAspectRatio({ width: 0, height: 1080 })).toBe(1)
  })
})

describe('estimateMasonryItemHeight', () => {
  it('scales height from column width and media aspect ratio', () => {
    const height = estimateMasonryItemHeight({ width: 1000, height: 2000 }, 200)
    expect(height).toBe(400)
  })
})

describe('packMasonryColumns', () => {
  it('balances items across the shortest column', () => {
    const items = [
      { id: 1, width: 1000, height: 2000 },
      { id: 2, width: 1000, height: 500 },
      { id: 3, width: 1000, height: 500 },
    ]

    const columns = packMasonryColumns(
      items,
      2,
      (item, colWidth) => estimateMasonryItemHeight(item, colWidth),
      200,
    )

    expect(columns).toHaveLength(2)
    expect(columns[0].items).toHaveLength(1)
    expect(columns[1].items).toHaveLength(2)
    expect(columns[0].items[0].item.id).toBe(1)
    expect(columns[1].items.map((entry) => entry.item.id)).toEqual([2, 3])
  })
})

describe('buildMasonryLayout', () => {
  it('tracks absolute positions and total height with gaps', () => {
    const items = [
      { id: 1, width: 1000, height: 1000 },
      { id: 2, width: 1000, height: 500 },
      { id: 3, width: 1000, height: 500 },
    ]

    const layout = buildMasonryLayout(
      items,
      2,
      200,
      10,
      15,
      (item, colWidth) => estimateMasonryItemHeight(item, colWidth),
    )

    expect(layout.positions).toHaveLength(3)
    expect(layout.positions[0]).toMatchObject({ index: 0, column: 0, top: 0, height: 200 })
    expect(layout.positions[1]).toMatchObject({ index: 1, column: 1, top: 0, height: 100 })
    expect(layout.positions[2]).toMatchObject({ index: 2, column: 1, top: 115, height: 100 })
    expect(layout.totalHeight).toBe(215)
  })
})

describe('findVisibleMasonryItems', () => {
  it('returns only items intersecting the viewport window', () => {
    const positions = [
      { item: { id: 1 }, index: 0, column: 0, top: 0, height: 100 },
      { item: { id: 2 }, index: 1, column: 0, top: 115, height: 100 },
      { item: { id: 3 }, index: 2, column: 0, top: 230, height: 100 },
    ]

    const visible = findVisibleMasonryItems(positions, 90, 220, 0)

    expect(visible.map((entry) => entry.item.id)).toEqual([1, 2])
    expect(findVisibleMasonryItems(positions, 250, 400, 0).map((entry) => entry.item.id)).toEqual([3])
  })
})
