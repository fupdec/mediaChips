import { describe, it, expect } from 'vitest'
import { buildApiUrl, getApiBaseUrl } from '@/services/apiClient'

describe('apiClient helpers', () => {
  const appStore = {
    localhost: 'http://127.0.0.1:12321',
    config: { ip: 'localhost', port: 12321 },
  }

  it('builds api urls from relative paths', () => {
    expect(buildApiUrl('/api/media/items', 'http://localhost:12321'))
      .toBe('http://localhost:12321/api/media/items')
    expect(buildApiUrl('api/ping', 'http://localhost:12321/'))
      .toBe('http://localhost:12321/api/ping')
  })

  it('returns absolute urls unchanged', () => {
    expect(buildApiUrl('https://example.com/api/ping', 'http://localhost:12321'))
      .toBe('https://example.com/api/ping')
  })

  it('resolves base url from app store config', () => {
    expect(getApiBaseUrl(appStore)).toBe('http://localhost:12321')
  })
})
