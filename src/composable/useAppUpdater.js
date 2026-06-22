import {ref, readonly} from 'vue'
import {useAppStore} from '@/stores/app'

const status = ref({state: 'idle'})
const lastCheckManual = ref(false)
const isSupported = ref(false)

let initialized = false
let startupCheckScheduled = false
let unsubscribeStatus = null

function hasUpdaterApi() {
  return Boolean(window.electronAPI?.updater)
}

export function useAppUpdater() {
  const appStore = useAppStore()

  async function ensureInitialized() {
    if (!appStore.isElectron || !hasUpdaterApi() || initialized) return
    initialized = true

    isSupported.value = await window.electronAPI.updater.isSupported()

    unsubscribeStatus = window.electronAPI.updater.onStatus((payload) => {
      status.value = payload
    })

    const initial = await window.electronAPI.updater.getState()
    if (initial) {
      status.value = initial
    }
  }

  async function init({checkAtStartup = false} = {}) {
    await ensureInitialized()

    if (checkAtStartup && isSupported.value && !startupCheckScheduled) {
      startupCheckScheduled = true
      setTimeout(() => {
        check({manual: false})
      }, 8000)
    }
  }

  async function check({manual = false} = {}) {
    await ensureInitialized()
    if (!hasUpdaterApi()) return null
    lastCheckManual.value = manual
    const result = await window.electronAPI.updater.check()
    status.value = result
    return result
  }

  async function download() {
    await ensureInitialized()
    if (!hasUpdaterApi()) return null
    const result = await window.electronAPI.updater.download()
    status.value = result
    return result
  }

  async function install() {
    await ensureInitialized()
    if (!hasUpdaterApi()) return null
    return window.electronAPI.updater.install()
  }

  function dismiss() {
    if (['available', 'downloaded', 'error', 'up-to-date'].includes(status.value.state)) {
      status.value = {...status.value, state: 'idle'}
    }
  }

  function destroy() {
    unsubscribeStatus?.()
    unsubscribeStatus = null
    initialized = false
    startupCheckScheduled = false
  }

  return {
    status: readonly(status),
    lastCheckManual: readonly(lastCheckManual),
    isSupported: readonly(isSupported),
    ensureInitialized,
    init,
    check,
    download,
    install,
    dismiss,
    destroy,
  }
}
