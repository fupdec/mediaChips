import {describe, it, expect} from 'vitest'
import {
  filterMarksByTypes,
  getMarkListColor,
  getMarkListIcon,
  getMarkTimelineColor,
  getMarkTimelineIcon,
  getMarkTypeFilterValue,
  formatMarkTimeRange,
  getMarkTimelinePositionStyle,
  getMarkTimelineWidthStyle,
} from '@/composable/playerMarkDisplay'

describe('playerMarkDisplay', () => {
  it('resolves list icon by mark type', () => {
    expect(getMarkListIcon({type: 'favorite'})).toBe('heart')
    expect(getMarkListIcon({type: 'meta', meta: {icon: 'star'}})).toBe('star')
    expect(getMarkListIcon({type: 'note'})).toBe('marker')
  })

  it('resolves timeline icon defaults', () => {
    expect(getMarkTimelineIcon({type: 'note'})).toBe('tooltip')
  })

  it('resolves list color by mark type', () => {
    expect(getMarkListColor({type: 'bookmark'})).toBe('#f44336')
    expect(getMarkListColor({type: 'meta', tag: {color: '#abc'}})).toBe('#abc')
    expect(getMarkListColor({type: 'note'})).toBe('primary')
  })

  it('resolves timeline color defaults', () => {
    expect(getMarkTimelineColor({type: 'note'})).toBe('#ffffff')
  })

  it('filters marks by selected chip types', () => {
    const marks = [
      {id: 1, type: 'favorite'},
      {id: 2, type: 'meta', metaId: 5},
      {id: 3, type: 'bookmark'},
    ]

    expect(filterMarksByTypes(marks, ['favorite'])).toEqual([marks[0]])
    expect(filterMarksByTypes(marks, ['bookmark', 5])).toEqual([marks[1], marks[2]])
  })

  it('uses meta id for meta mark filter value', () => {
    expect(getMarkTypeFilterValue({type: 'meta', metaId: 7})).toBe(7)
  })

  it('formats mark time range', () => {
    const format = (value) => `t${value}`
    expect(formatMarkTimeRange({time: 10}, format)).toBe('t10')
    expect(formatMarkTimeRange({time: 10, end: 20}, format)).toBe('t10 – t20')
  })

  it('builds timeline layout styles', () => {
    expect(getMarkTimelinePositionStyle({time: 30}, 120)).toBe('left: 25%;')
    expect(getMarkTimelineWidthStyle({time: 10, end: 30}, 100, 400)).toBe('width: 80px;')
  })
})
