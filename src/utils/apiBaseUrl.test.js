import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'

describe('resolveApiBaseUrl', () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        protocol: 'http:',
        port: '3000',
        origin: 'http://localhost:3000',
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('prefers explicit server info url', () => {
    expect(resolveApiBaseUrl({ip: 'localhost', port: 12321}, {url: 'http://192.168.1.10:12321/'}))
      .toBe('http://192.168.1.10:12321')
  })

  it('uses current origin when ui is served from app server port', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        protocol: 'http:',
        port: '12321',
        origin: 'http://127.0.0.1:12321',
      },
    })

    expect(resolveApiBaseUrl({ip: '192.168.1.10', port: 12321}))
      .toBe('http://127.0.0.1:12321')
  })

  it('falls back to configured ip and port for dev proxy setups', () => {
    expect(resolveApiBaseUrl({ip: 'localhost', port: 12321}))
      .toBe('http://localhost:12321')
  })

  it('defaults ip to localhost', () => {
    expect(resolveApiBaseUrl({port: 12321}))
      .toBe('http://localhost:12321')
  })
})
