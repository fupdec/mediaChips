import {ref, onMounted, onBeforeUnmount} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import _ from 'lodash'
import {apiClient} from '@/services/apiClient'
import {updateConfig} from '@/services/configService'
import {getWatchedFolders} from '@/services/watcherService'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore, THUMB_BROADCAST_CHANNEL} from '@/stores/items'
import {useWatcherStore} from '@/stores/watcher'
import {useRegistrationStore} from '@/stores/registration'
import {useDialogsStore} from '@/stores/dialogs'
import {useEventBus} from '@/utils/eventBus'
import {useWatcher} from '@/composable/Watcher'
import {useMediaAdding} from '@/composable/AddingMedia'
import {useAppUpdater} from '@/composable/useAppUpdater'
import {useAppTheme} from '@/composable/useAppTheme'

export function useAppBootstrap({isPlayerWindow, appZoom}) {
  const route = useRoute()
  const router = useRouter()
  const {locale} = useI18n()
  const store = useAppStore()
  const settingsStore = useSettingsStore()
  const itemsStore = useItemsStore()
  const watcherStore = useWatcherStore()
  const registrationStore = useRegistrationStore()
  const dialogsStore = useDialogsStore()
  const eventBus = useEventBus()
  const {init: initAppUpdater} = useAppUpdater()
  const {applyTheme} = useAppTheme()
  const {updateWatcher} = useWatcher(store.localhost)
  const {handleAddMedia, cleanupEventListeners} = useMediaAdding()

  const isAppReady = ref(false)
  const upd = ref(0)

  function cleanupStalePlayerRoute() {
    if (route.query.player && !store.isElectron) {
      const query = {...route.query}
      delete query.player
      router.replace({query})
    }
  }

  async function initSettings() {
    try {
      const res = await apiClient.get('/api/Setting')
      const sets = res.data.reduce((a, i) => {
        a[i.option] = i.value
        return a
      }, {})

      settingsStore.updateMultiple(sets)
      cleanupStalePlayerRoute()
    } catch {
      store.isServerError = true
    }
  }

  async function loadList(url, field) {
    try {
      const res = await apiClient.get(url)
      store[field] = res.data
    } catch {
    }
  }

  function handleUpdateWatcher() {
    updateWatcher(watcherStore.folders)
  }

  function applyLocale() {
    locale.value = settingsStore.locale
    document.documentElement.lang = settingsStore.locale
  }

  function checkLogin() {
    store.isLocked = settingsStore.passwordProtection == '1'
  }

  async function getFolders() {
    watcherStore.folders = await getWatchedFolders()
  }

  async function getMachineId() {
    try {
      await registrationStore.ensureMachineId()
    } catch (error) {
      console.warn('Failed to fetch machine id:', error.message)
    }
  }

  function runAutoRegistration() {
    registrationStore.tryAutoRegisterOnStartup().catch((error) => {
      console.error('Auto registration failed:', error)
    })
  }

  const saveWindowSize = _.debounce(() => {
    const app_window = isPlayerWindow.value ? 'player' : 'win'
    const data = {
      [app_window]: {
        height: window.outerHeight,
        width: window.outerWidth,
      },
    }
    updateConfig(data)
  }, 500)

  const handleAboutApp = () => {
    dialogsStore.showAbout()
  }

  const handleLockApp = () => {
    store.isLocked = true
  }

  const handleThumbBroadcast = (event) => {
    const id = event?.data?.id
    if (id != null) {
      itemsStore.refreshThumb(id, {broadcast: false})
    }
  }

  const handleUpdateVideoFrames = (id) => {
    itemsStore.refreshThumb(id, {broadcast: false})
  }

  let unsubscribeAboutApp
  let unsubscribeLockApp
  let unsubscribeZoomChanged
  let thumbBroadcastChannel

  function setupPlayerElectronListeners() {
    if (!store.isElectron || !window.electronAPI?.on) return

    window.electronAPI.on('getItemsFromDb', (event, data) => {
      eventBus.emit('getItemsFromDb', data)
    })
    window.electronAPI.on('updateVideoFrames', (event, id) => {
      itemsStore.refreshThumb(id, {broadcast: false})
    })
    window.electronAPI.on('removeEntitiesFromState', (event, data) => {
      eventBus.emit('removeEntitiesFromState', data)
    })

    window.addEventListener('resize', saveWindowSize)
  }

  function notifyPlayerReady() {
    if (store.isElectron && window.electronAPI?.send) {
      window.electronAPI.send('player-ready')
    }
  }

  function loadPlayerBackgroundData() {
    loadList('/api/mediaType', 'mediaTypes').catch(() => {})
    getMachineId().catch(() => {})
  }

  function bindMainAppEventBus() {
    eventBus.on('getMediaTypes', async () => {
      await loadList('/api/mediaType', 'mediaTypes')
    })
    eventBus.on('getTags', async () => {
      await loadList('/api/tag', 'tags')
    })
    eventBus.on('getMeta', async () => {
      await loadList('/api/meta', 'meta')
    })
    eventBus.on('getTabs', async () => {
      await loadList('/api/tab', 'tabs')
    })
    eventBus.on('getPlaylists', async () => {
      await loadList('/api/playlist', 'playlists')
    })
    eventBus.on('updatePage', () => ++upd.value)

    eventBus.on('update:watcher', handleUpdateWatcher)
    eventBus.on('addMedia', handleAddMedia)
    eventBus.on('updateVideoFrames', handleUpdateVideoFrames)
  }

  async function bootstrapPlayerWindow() {
    setupPlayerElectronListeners()
    isAppReady.value = true
    notifyPlayerReady()

    const settingsPromise = initSettings()
      .then(() => {
        applyTheme()
        applyLocale()
      })
      .catch(() => {
        store.isServerError = true
      })

    loadPlayerBackgroundData()
    await settingsPromise
  }

  async function bootstrapMainApp() {
    await initSettings()

    if (store.isElectron && window.electronAPI?.updater) {
      initAppUpdater({
        checkAtStartup: settingsStore.checkForUpdatesAtStartup === '1',
      })
    }

    applyTheme()
    applyLocale()
    checkLogin()

    if (appZoom) {
      await appZoom.initFromSettings()
      window.addEventListener('keydown', appZoom.handleKeydown)
      window.addEventListener('wheel', appZoom.blockPinchZoom, {passive: false})

      if (store.isElectron && window.electronAPI?.on) {
        unsubscribeZoomChanged = window.electronAPI.on('zoom-changed', appZoom.syncFromElectron)
      }
    }

    await getMachineId()
    await getFolders()

    await loadList('/api/mediaType', 'mediaTypes')
    await loadList('/api/tag', 'tags')
    await loadList('/api/meta', 'meta')
    await loadList('/api/tab', 'tabs')
    await loadList('/api/playlist', 'playlists')

    bindMainAppEventBus()

    if (typeof BroadcastChannel !== 'undefined') {
      thumbBroadcastChannel = new BroadcastChannel(THUMB_BROADCAST_CHANNEL)
      thumbBroadcastChannel.addEventListener('message', handleThumbBroadcast)
    }

    isAppReady.value = true
    runAutoRegistration()

    if (store.isElectron) {
      setupPlayerElectronListeners()

      unsubscribeAboutApp = window.electronAPI.on('aboutApp', handleAboutApp)
      unsubscribeLockApp = window.electronAPI.on('lockApp', handleLockApp)
    }
  }

  onMounted(async () => {
    if (isPlayerWindow.value) {
      await bootstrapPlayerWindow()
      return
    }

    await bootstrapMainApp()
  })

  onBeforeUnmount(() => {
    cleanupEventListeners()
    eventBus.off('updateVideoFrames', handleUpdateVideoFrames)
    thumbBroadcastChannel?.removeEventListener('message', handleThumbBroadcast)
    thumbBroadcastChannel?.close()
    thumbBroadcastChannel = null
    window.removeEventListener('resize', saveWindowSize)
    unsubscribeAboutApp?.()
    unsubscribeLockApp?.()
    unsubscribeZoomChanged?.()

    if (appZoom) {
      window.removeEventListener('keydown', appZoom.handleKeydown)
      window.removeEventListener('wheel', appZoom.blockPinchZoom)
    }
  })

  return {
    isAppReady,
  }
}
