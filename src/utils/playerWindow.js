export function isStandalonePlayerRoute(route) {
  if (!route?.query?.player) return false
  return Boolean(window.electronAPI)
}

export function openSeparatePlayer(data) {
  if (!window.electronAPI?.send) return false

  window.electronAPI.send('open-player', data)
  return true
}

export function canOpenSeparatePlayer() {
  return Boolean(window.electronAPI?.send)
}
