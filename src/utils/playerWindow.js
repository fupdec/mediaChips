export const PLAYER_BROADCAST_CHANNEL = 'mediachips-player'
const PENDING_PLAY_KEY = 'mediachips-pending-play'
const POPUP_NAME = 'mediachips-player'

let browserPlayerWindow = null
let broadcastChannel = null

export function isStandalonePlayerRoute(route, openInSeparateWindow) {
  if (!route?.query?.player) return false
  if (window.electronAPI) return true
  return openInSeparateWindow == '1'
}

function getBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(PLAYER_BROADCAST_CHANNEL)
  }
  return broadcastChannel
}

function buildPlayerWindowUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('player', 'true')
  url.hash = ''
  return url.toString()
}

function storePendingPlay(data) {
  sessionStorage.setItem(PENDING_PLAY_KEY, JSON.stringify(data))
}

export function consumePendingPlay() {
  const raw = sessionStorage.getItem(PENDING_PLAY_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_PLAY_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function postPlayMessage(data) {
  getBroadcastChannel()?.postMessage({type: 'play-video', data})
}

export function openBrowserPlayerWindow(data) {
  const isNewWindow = !browserPlayerWindow || browserPlayerWindow.closed

  if (isNewWindow) {
    storePendingPlay(data)

    const features = [
      'popup=yes',
      'width=1280',
      'height=720',
      'resizable=yes',
      'menubar=no',
      'toolbar=no',
      'location=no',
    ].join(',')

    browserPlayerWindow = window.open(buildPlayerWindowUrl(), POPUP_NAME, features)

    if (!browserPlayerWindow) {
      sessionStorage.removeItem(PENDING_PLAY_KEY)
      return false
    }

    return true
  }

  browserPlayerWindow.focus()
  postPlayMessage(data)
  return true
}

export function openSeparatePlayer(data) {
  if (window.electronAPI?.send) {
    window.electronAPI.send('open-player', data)
    return true
  }

  return openBrowserPlayerWindow(data)
}

export function subscribePlayerWindowMessages(handler) {
  const channel = getBroadcastChannel()
  if (!channel) return () => {}

  const listener = (event) => handler(event.data)
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}
