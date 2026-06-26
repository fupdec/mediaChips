import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {
  isStandalonePlayerRoute,
  openSeparatePlayer,
  canOpenSeparatePlayer,
} from '@/utils/playerWindow'

describe('playerWindow', () => {
  const originalElectronApi = window.electronAPI

  beforeEach(() => {
    delete window.electronAPI
  })

  afterEach(() => {
    if (originalElectronApi === undefined) {
      delete window.electronAPI
    } else {
      window.electronAPI = originalElectronApi
    }
  })

  describe('isStandalonePlayerRoute', () => {
    it('returns false without player query param', () => {
      expect(isStandalonePlayerRoute({query: {}})).toBe(false)
    })

    it('returns true in electron when player query is set', () => {
      window.electronAPI = {send: vi.fn()}
      expect(isStandalonePlayerRoute({query: {player: 'true'}})).toBe(true)
    })

    it('returns false in browser even with player query', () => {
      expect(isStandalonePlayerRoute({query: {player: 'true'}})).toBe(false)
    })
  })

  describe('openSeparatePlayer', () => {
    it('returns false in browser', () => {
      expect(openSeparatePlayer({video: {id: 1}})).toBe(false)
    })

    it('sends open-player through electron', () => {
      const payload = {video: {id: 1}, videos: [], time: 0}
      window.electronAPI = {send: vi.fn()}

      expect(openSeparatePlayer(payload)).toBe(true)
      expect(window.electronAPI.send).toHaveBeenCalledWith('open-player', payload)
    })
  })

  describe('canOpenSeparatePlayer', () => {
    it('is false in browser', () => {
      expect(canOpenSeparatePlayer()).toBe(false)
    })

    it('is true in electron', () => {
      window.electronAPI = {send: vi.fn()}
      expect(canOpenSeparatePlayer()).toBe(true)
    })
  })
})
