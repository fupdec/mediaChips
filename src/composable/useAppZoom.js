import {computed} from 'vue'
import {useSettingsStore} from '@/stores/settings'
import {
  formatZoomPercent,
  getNextZoom,
  parseZoom,
  snapZoom,
} from '@/utils/appZoom'

let suppressExternalSync = false

function isElectron() {
  return typeof window !== 'undefined'
    && navigator.userAgent.toLowerCase().includes(' electron/')
}

async function applyZoomFactor(factor) {
  const clamped = snapZoom(factor)

  if (isElectron() && window.electronAPI?.invoke) {
    await window.electronAPI.invoke('setZoomFactor', clamped)
    return clamped
  }

  document.documentElement.style.zoom = String(clamped)
  return clamped
}

export function useAppZoom() {
  const settingsStore = useSettingsStore()

  const zoom = computed(() => parseZoom(settingsStore.zoom))

  async function setZoom(value, {persist = true, apply = true} = {}) {
    const clamped = snapZoom(value)

    if (apply) {
      suppressExternalSync = true
      try {
        await applyZoomFactor(clamped)
      } finally {
        suppressExternalSync = false
      }
    }

    settingsStore.zoom = String(clamped)

    if (persist) {
      await $operable.setOption(clamped, 'zoom')
    }

    return clamped
  }

  async function zoomIn() {
    return setZoom(getNextZoom(zoom.value, 1))
  }

  async function zoomOut() {
    return setZoom(getNextZoom(zoom.value, -1))
  }

  async function resetZoom() {
    return setZoom(1)
  }

  async function initFromSettings() {
    suppressExternalSync = true
    try {
      await applyZoomFactor(zoom.value)
    } finally {
      suppressExternalSync = false
    }
  }

  async function syncFromElectron(factor) {
    if (suppressExternalSync) return

    const clamped = snapZoom(factor)
    settingsStore.zoom = String(clamped)
    await $operable.setOption(clamped, 'zoom')
  }

  function shouldHandleZoomShortcut(event) {
    if (!(event.ctrlKey || event.metaKey)) return false
    if (event.altKey) return false

    const target = event.target
    if (!(target instanceof Element)) return false

    const tagName = target.tagName
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
      return false
    }

    return true
  }

  function handleKeydown(event) {
    if (!shouldHandleZoomShortcut(event)) return

    if (event.key === '=' || event.key === '+') {
      event.preventDefault()
      zoomIn()
      return
    }

    if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      zoomOut()
      return
    }

    if (event.key === '0') {
      event.preventDefault()
      resetZoom()
    }
  }

  function blockPinchZoom(event) {
    if (!shouldHandleZoomShortcut(event)) return
    if (!event.ctrlKey && !event.metaKey) return

    event.preventDefault()
  }

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    initFromSettings,
    syncFromElectron,
    handleKeydown,
    blockPinchZoom,
    formatZoomPercent,
  }
}

export {formatZoomPercent}
