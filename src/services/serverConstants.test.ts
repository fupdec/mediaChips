import {describe, it, expect} from 'vitest'
import {
  FIXED_PORT,
  getAllowLan,
  getBindHostForServer,
  isAllowedOrigin,
  isLoopbackHost,
  isPrivateIpv4,
} from '../../app/server/constants.js'

describe('server constants', () => {
  it('detects loopback hosts', () => {
    expect(isLoopbackHost('localhost')).toBe(true)
    expect(isLoopbackHost('127.0.0.1')).toBe(true)
    expect(isLoopbackHost('192.168.1.2')).toBe(false)
  })

  it('detects private ipv4 ranges', () => {
    expect(isPrivateIpv4('192.168.0.10')).toBe(true)
    expect(isPrivateIpv4('10.0.0.5')).toBe(true)
    expect(isPrivateIpv4('8.8.8.8')).toBe(false)
  })

  it('allows missing origin', () => {
    expect(isAllowedOrigin(undefined)).toBe(true)
  })

  it('allows loopback browser origins', () => {
    expect(isAllowedOrigin('http://localhost:12321')).toBe(true)
  })

  it('exports fixed server port', () => {
    expect(FIXED_PORT).toBe(12321)
    expect(typeof getBindHostForServer()).toBe('string')
    expect(typeof getAllowLan()).toBe('boolean')
  })
})
