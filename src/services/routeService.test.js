import {describe, it, expect} from 'vitest'
import {getTabUrl, getUrlParam, checkCurrentPage} from '@/services/routeService'

describe('routeService', () => {
  it('builds tab urls from tab params', () => {
    expect(getTabUrl({url: '/media', id: 3, mediaTypeId: 5})).toBe(
      '/media?tabId=3&mediaTypeId=5',
    )
    expect(getTabUrl({url: '/meta', metaId: 2})).toBe('/meta?metaId=2')
    expect(getTabUrl({url: '/home'})).toBe('/home?')
  })

  it('reads numeric query params', () => {
    const route = {query: {mediaTypeId: '12', tagId: '7', empty: ''}}

    expect(getUrlParam(route, 'mediaTypeId')).toBe(12)
    expect(getUrlParam(route, 'tagId')).toBe(7)
    expect(getUrlParam(route, 'missing')).toBe(null)
    expect(getUrlParam(route, 'empty')).toBe(null)
  })

  it('checks whether route path includes page segment', () => {
    expect(checkCurrentPage({path: '/meta?metaId=1'}, 'meta')).toBe(true)
    expect(checkCurrentPage({path: '/media'}, 'meta')).toBe(false)
    expect(checkCurrentPage({path: '/tag/42'}, 'tag')).toBe(true)
  })
})
