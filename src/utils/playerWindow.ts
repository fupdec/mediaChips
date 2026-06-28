import type { RouteLocationNormalizedLoaded } from 'vue-router'

type PlayerRouteLike = Pick<RouteLocationNormalizedLoaded, 'query'> | RouteLocationNormalizedLoaded

export function isStandalonePlayerRoute(route: PlayerRouteLike | null | undefined): boolean {
  if (!route?.query?.player) return false
  return Boolean(window.electronAPI)
}

export function openSeparatePlayer(data: Record<string, unknown>): boolean {
  if (!window.electronAPI?.send) return false

  window.electronAPI.send('open-player', data)
  return true
}

export function canOpenSeparatePlayer() {
  return Boolean(window.electronAPI?.send)
}
