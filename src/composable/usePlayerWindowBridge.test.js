import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {ref} from 'vue'
import {usePlayerWindowBridge} from '@/composable/usePlayerWindowBridge'

const routeRef = ref({query: {}})
const appState = {app_title: 'MediaChips Test'}
const playerState = {mediaWindowTitle: ''}
const emitMock = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => routeRef.value,
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({}),
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => appState,
}))

vi.mock('@/stores/player', () => ({
  usePlayerStore: () => playerState,
}))

vi.mock('@/utils/eventBus', () => ({
  useEventBus: () => ({
    emit: emitMock,
  }),
}))

describe('usePlayerWindowBridge', () => {
  const originalElectronApi = window.electronAPI
  const originalOs = window.os

  beforeEach(() => {
    routeRef.value = {query: {}}
    appState.app_title = 'MediaChips Test'
    playerState.mediaWindowTitle = ''
    document.title = 'initial'
    emitMock.mockReset()
    delete window.electronAPI
    delete window.os
  })

  afterEach(() => {
    if (originalElectronApi === undefined) delete window.electronAPI
    else window.electronAPI = originalElectronApi

    if (originalOs === undefined) delete window.os
    else window.os = originalOs
  })

  it('detects standalone player route in electron', () => {
    routeRef.value = {query: {player: 'true'}}
    window.electronAPI = {send: vi.fn()}

    const {isPlayerWindow} = usePlayerWindowBridge()
    expect(isPlayerWindow.value).toBe(true)
  })

  it('does not treat browser player query as standalone', () => {
    routeRef.value = {query: {player: 'true'}}

    const {isPlayerWindow} = usePlayerWindowBridge()
    expect(isPlayerWindow.value).toBe(false)
  })

  it('updates document title in standalone mode', () => {
    routeRef.value = {query: {player: 'true'}}
    window.electronAPI = {send: vi.fn()}

    const {updatePlayerWindowTitle, resetPlayerWindowTitle} = usePlayerWindowBridge()
    updatePlayerWindowTitle({name: 'clip.mp4'})

    expect(document.title).toBe('MediaChips Test - clip.mp4')
    expect(playerState.mediaWindowTitle).toBe('MediaChips Test - clip.mp4')

    resetPlayerWindowTitle()
    expect(document.title).toBe('MediaChips Test')
    expect(playerState.mediaWindowTitle).toBe('')
  })

  it('emits getItemsFromDb through event bus in inline mode', () => {
    const {updateItemVideo} = usePlayerWindowBridge()
    updateItemVideo(42)

    expect(emitMock).toHaveBeenCalledWith('getItemsFromDb', {
      ids: [42],
      type: 'media',
    })
  })

  it('sends getItemsFromDb through electron in standalone mode', () => {
    routeRef.value = {query: {player: 'true'}}
    window.electronAPI = {send: vi.fn()}

    const {updateItemVideo} = usePlayerWindowBridge()
    updateItemVideo(7)

    expect(window.electronAPI.send).toHaveBeenCalledWith('getItemsFromDb', {
      ids: [7],
      type: 'media',
    })
    expect(emitMock).not.toHaveBeenCalled()
  })

  it('attaches electron play and stop handlers', () => {
    const listeners = new Map()
    window.electronAPI = {
      on: vi.fn((event, handler) => listeners.set(event, handler)),
      removeListener: vi.fn(),
    }

    const onPlayVideo = vi.fn()
    const onStopPlaying = vi.fn()
    const onInvalidPlayData = vi.fn()
    const {attach, detach} = usePlayerWindowBridge({onInvalidPlayData})

    attach({onPlayVideo, onStopPlaying})

    listeners.get('play-video')?.(null, {video: {id: 1}, videos: [], time: 0})
    expect(onPlayVideo).toHaveBeenCalledWith({id: 1}, [], 0)

    listeners.get('play-video')?.(null, {})
    expect(onInvalidPlayData).toHaveBeenCalled()

    listeners.get('stop-playing-video')?.()
    expect(onStopPlaying).toHaveBeenCalled()

    detach()
    expect(window.electronAPI.removeListener).toHaveBeenCalledTimes(2)
  })

  it('exits electron fullscreen on macOS when needed', () => {
    window.os = true
    window.electronAPI = {send: vi.fn()}
    vi.stubGlobal('navigator', {platform: 'MacIntel'})

    const {exitElectronFullscreenIfNeeded} = usePlayerWindowBridge()
    exitElectronFullscreenIfNeeded()

    expect(window.electronAPI.send).toHaveBeenCalledWith('setFullScreen', false)

    vi.unstubAllGlobals()
  })
})
