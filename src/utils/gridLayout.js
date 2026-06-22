const CARD_GRID_MIN = {
  default: {1: 150, 2: 200, 3: 250, 4: 300, 5: 350, 6: 450},
  image: {1: 140, 2: 220, 3: 220, 4: 280, 5: 320, 6: 400},
  wide: {1: 200, 2: 250, 3: 300, 4: 350, 5: 400, 6: 500},
}

const CHIP_MIN = {1: 80, 2: 100, 3: 110, 4: 120, 5: 140, 6: 160}

const GAP_SIZE = {
  xs: {x: 10, y: 15},
  s: {x: 15, y: 20},
  m: {x: 20, y: 25},
  l: {x: 25, y: 30},
  xl: {x: 30, y: 35},
}

const DESCRIPTION_HEIGHT = {1: 72, 2: 78, 3: 82, 4: 88, 5: 96, 6: 108}

const LINE_ROW_HEIGHT = {1: 100, 2: 120, 3: 130, 4: 140, 5: 160, 6: 180}

export const VIRTUAL_GRID_THRESHOLD = 48

export const VIRTUAL_ROW_BUFFER = 2

export function getGridGap(gapSize = 'xs') {
  return GAP_SIZE[gapSize] || GAP_SIZE.xs
}

export function getMinColumnWidth(options = {}) {
  const size = Number(options.size) || 3

  if (options.lineGrid) return options.containerWidth || 1200

  if (options.chipsGrid) {
    return CHIP_MIN[size] || CHIP_MIN[3]
  }

  if (options.imageGrid) {
    return CARD_GRID_MIN.image[size] || CARD_GRID_MIN.image[3]
  }

  if (options.wideImage) {
    return CARD_GRID_MIN.wide[size] || CARD_GRID_MIN.wide[3]
  }

  return CARD_GRID_MIN.default[size] || CARD_GRID_MIN.default[3]
}

export function getColumnCount(containerWidth, minColumnWidth, gapX, options = {}) {
  if (options.lineGrid) return 1
  if (!containerWidth || !minColumnWidth) return 1

  return Math.max(1, Math.floor((containerWidth + gapX) / (minColumnWidth + gapX)))
}

export function chunkIntoRows(items, columnCount) {
  const rows = []
  const cols = Math.max(1, columnCount)

  for (let startIndex = 0; startIndex < items.length; startIndex += cols) {
    rows.push({
      index: rows.length,
      startIndex,
      items: items.slice(startIndex, startIndex + cols),
    })
  }

  return rows
}

export function estimateRowHeight(options = {}) {
  const size = Number(options.size) || 3
  const gap = getGridGap(options.gapSize)
  const columnCount = Math.max(1, options.columnCount || 1)
  const containerWidth = options.containerWidth || 1200

  if (options.lineGrid) {
    return (LINE_ROW_HEIGHT[size] || LINE_ROW_HEIGHT[3]) + gap.y
  }

  if (options.chipsGrid) {
    const chipHeight = {1: 28, 2: 32, 3: 36, 4: 40, 5: 44, 6: 48}[size] || 36
    return chipHeight + gap.y + 10
  }

  const gapX = gap.x
  const colWidth = (containerWidth - gapX * (columnCount - 1)) / columnCount
  const aspect = options.imageGrid ? 2 : 9 / 16
  const description = DESCRIPTION_HEIGHT[size] || DESCRIPTION_HEIGHT[3]

  return colWidth * aspect + description + gap.y
}

export function shouldUseVirtualGrid(itemCount, isInfiniteScroll) {
  return Boolean(isInfiniteScroll && itemCount >= VIRTUAL_GRID_THRESHOLD)
}

export function getLayoutTopInScroll(layoutEl, scrollEl) {
  if (!layoutEl || !scrollEl) return 0

  const layoutRect = layoutEl.getBoundingClientRect()
  const scrollRect = scrollEl.getBoundingClientRect()

  return layoutRect.top - scrollRect.top + scrollEl.scrollTop
}
