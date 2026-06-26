import {shouldUseWheelSeek, preventWheelDefault, getVolumeDeltaFromWheel} from '@/utils/playerWheel'

export const SEEK_STEP_SECONDS = 10
export const SEEK_SHIFT_MULTIPLIER = 3
export const SEEK_REPEAT_THROTTLE_MS = 120

let lastSeekAt = 0

export function isPlainKey(event) {
  return !event.ctrlKey && !event.metaKey && !event.altKey
}

export function shouldHandlePlayerShortcut(event, playerStore) {
  if (!playerStore.active) return false
  if (playerStore.isKeyboardBlocked) return false

  const target = event.target
  if (!(target instanceof Element)) return true

  const tagName = target.tagName
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
    return false
  }

  if (target.closest('[data-ignore-player-hotkeys]')) {
    return false
  }

  return true
}

function shouldThrottleSeek(event) {
  if (!event.repeat) return false

  const now = Date.now()
  if (now - lastSeekAt < SEEK_REPEAT_THROTTLE_MS) return true

  lastSeekAt = now
  return false
}

function seekByDelta(playerStore, delta, event) {
  if (!playerStore.player) return false
  if (shouldThrottleSeek(event)) return false

  playerStore.playerJumpTo(playerStore.player.currentTime + delta)
  return true
}

function callControl(controls, method) {
  if (controls && typeof controls[method] === 'function') {
    controls[method]()
    return true
  }
  return false
}

export function handlePlayerKeydown(event, ctx) {
  const {
    playerStore,
    controls,
    togglePause,
    toggleFullscreen,
    changeVolume,
    openAddingMark,
    closePlayer,
  } = ctx

  let step = SEEK_STEP_SECONDS

  switch (true) {
    case event.code === 'Escape':
      if (!playerStore.isKeyboardBlocked && typeof closePlayer === 'function') {
        closePlayer()
        return true
      }
      return false

    case event.code === 'KeyZ' && isPlainKey(event):
    case event.altKey && event.code === 'ArrowLeft':
      return callControl(controls, 'prev')

    case event.code === 'KeyC' && isPlainKey(event):
    case event.altKey && event.code === 'ArrowRight':
      return callControl(controls, 'next')

    case event.code === 'Space' && isPlainKey(event):
      if (typeof togglePause === 'function') {
        togglePause()
        return true
      }
      return false

    case event.code === 'ArrowRight' && !event.altKey && !event.ctrlKey && !event.metaKey:
      if (event.shiftKey) step *= SEEK_SHIFT_MULTIPLIER
      return seekByDelta(playerStore, step, event)

    case event.code === 'ArrowLeft' && !event.altKey && !event.ctrlKey && !event.metaKey:
      if (event.shiftKey) step *= SEEK_SHIFT_MULTIPLIER
      return seekByDelta(playerStore, -step, event)

    case event.code === 'ArrowUp' && !event.altKey && !event.ctrlKey && !event.metaKey:
      if (typeof changeVolume === 'function') {
        changeVolume({deltaY: +100})
        return true
      }
      return false

    case event.code === 'ArrowDown' && !event.altKey && !event.ctrlKey && !event.metaKey:
      if (typeof changeVolume === 'function') {
        changeVolume({deltaY: -100})
        return true
      }
      return false

    case event.code === 'KeyF' && isPlainKey(event):
      if (typeof toggleFullscreen === 'function') {
        toggleFullscreen()
        return true
      }
      return false

    case event.code === 'KeyM' && isPlainKey(event):
      return callControl(controls, 'toggleMute')

    case event.code === 'KeyP' && isPlainKey(event):
      return callControl(controls, 'togglePlaylist')

    case event.code === 'KeyI' && isPlainKey(event):
      return callControl(controls, 'toggleMarks')

    case event.code === 'Comma' && isPlainKey(event):
      if (controls?.jumpToMark) {
        controls.jumpToMark('prev')
        return true
      }
      return false

    case event.code === 'Period' && isPlainKey(event):
      if (controls?.jumpToMark) {
        controls.jumpToMark('next')
        return true
      }
      return false

    case event.code === 'KeyX' && isPlainKey(event):
      return callControl(controls, 'stop')

    case event.code === 'Digit1' && isPlainKey(event):
      if (typeof openAddingMark === 'function') {
        openAddingMark('favorite')
        return true
      }
      return false

    case event.code === 'Digit2' && isPlainKey(event):
      if (typeof openAddingMark === 'function') {
        openAddingMark('bookmark')
        return true
      }
      return false

    case event.code === 'KeyE' && isPlainKey(event):
      return callControl(controls, 'editVideo')

    case event.code === 'Backspace' || event.code === 'Delete':
      if (event.shiftKey && (event.ctrlKey || event.altKey)) {
        if (controls?.deleteVideo) {
          controls.deleteVideo(true)
          return true
        }
      } else if (event.ctrlKey || event.altKey) {
        if (controls?.deleteVideo) {
          controls.deleteVideo()
          return true
        }
      }
      return false

    default:
      return false
  }
}

export function handlePlayerVideoWheel(event, {controls, changeVolume}) {
  if (shouldUseWheelSeek(event)) {
    if (controls?.wheelSeek) {
      controls.wheelSeek(event)
    }
    return
  }

  if (typeof changeVolume === 'function') {
    preventWheelDefault(event)
    changeVolume({deltaY: getVolumeDeltaFromWheel(event)})
  }
}
