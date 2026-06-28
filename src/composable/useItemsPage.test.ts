import {describe, it, expect} from 'vitest'
import {getNextInfiniteMediaPage, INFINITE_PAGE_SIZE} from '@/composable/useItemsPage'

describe('useItemsPage helpers', () => {
  it('returns first page when list is empty', () => {
    expect(getNextInfiniteMediaPage(0)).toBe(1)
  })

  it('calculates next infinite page from loaded item count', () => {
    expect(getNextInfiniteMediaPage(INFINITE_PAGE_SIZE)).toBe(2)
    expect(getNextInfiniteMediaPage(INFINITE_PAGE_SIZE * 2 + 3)).toBe(3)
  })
})
