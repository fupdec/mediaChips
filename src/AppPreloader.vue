<template>
  <v-app
    :class="{
      'not-macos': !isMac,
      'player-active': player.active,
      'electron-win': isWin && isElectron,
    }"
  >
    <template v-if="!isPlayerWindow">
      <SystemBar
        v-if="isWin && isElectron && !isPlayerWindow"
        :disabled="store.isLocked"
        @lock="store.isLocked = true"
      />

      <AppBar/>

      <!--TODO пофиксить отображение на телефоне-->
      <BottomBar v-if="settingsStore.bottomBar === '1' || mobile"/>
      <SideBar v-else/>
    </template>

    <Player v-show="isPlayerShow"/>
    <ImageViewer/>

    <v-main
      v-if="isAppReady && !isPlayerWindow"
      class="reduced-top app-main-layout"
      app
    >
      <div
        :class="addedTopClasses"
        class="added-top blur"
      ></div>

      <div class="main-scroll" :class="{'main-scroll--settings': isSettingsPage}">
        <div
          :class="[addedTopClasses, {'main-scroll-inner--settings': isSettingsPage}]"
          class="main-scroll-inner"
        >
          <router-view :key="route.fullPath + upd"/>

          <div
            v-if="(settingsStore.bottomBar == '1' || mobile) && !isSettingsPage"
            class="py-6"
          ></div>
        </div>
      </div>
    </v-main>

    <HoverImage/>

    <template v-if="!isPlayerWindow">
      <NotificationsPool/>
      <AutoUpdater/>
    </template>

    <Dialogs/>

    <v-overlay :model-value="isPlayerWindow && !isAppReady"
      :opacity="1">
      <v-progress-circular indeterminate
        size="96"
        width="2"/>
    </v-overlay>

    <ContextMenu v-if="!isPlayerWindow" v-show="contextMenu.show"></ContextMenu>
  </v-app>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from "vue"
import {useRoute} from "vue-router"
import {useDisplay} from "vuetify"
import {useI18n} from 'vue-i18n'
import {useAppStore} from "@/stores/app"
import {usePlayerStore} from "@/stores/player"
import {useSettingsStore} from "@/stores/settings"
import {useContextMenu} from "@/stores/contextMenu"
import {useRegistrationStore} from "@/stores/registration"
import {useWatcherStore} from "@/stores/watcher"
import {useDialogsStore} from "@/stores/dialogs"
import axios from "axios"
import _ from "lodash"
import {useEventBus} from "@/utils/eventBus"
import {useWatcher} from '@/composable/Watcher'
import {useMediaAdding} from '@/composable/AddingMedia'

import SystemBar from "@/components/app/SystemBar.vue"
import AppBar from "@/components/app/AppBar.vue"
import SideBar from "@/components/app/SideBar.vue"
import BottomBar from "@/components/app/BottomBar.vue"
import Player from "@/components/app/Player.vue"
import ImageViewer from "@/components/app/ImageViewer.vue"
import HoverImage from "@/components/app/HoverImage.vue"
import NotificationsPool from "@/components/app/NotificationsPool.vue"
import ContextMenu from "@/components/app/ContextMenu.vue"
import AutoUpdater from "@/components/app/AutoUpdater.vue"
import Dialogs from "@/components/app/Dialogs.vue"
import {useAppUpdater} from '@/composable/useAppUpdater'
import {useAppZoom} from '@/composable/useAppZoom'
import {useAppTheme} from '@/composable/useAppTheme'

const settingsStore = useSettingsStore()
const store = useAppStore()
const player = usePlayerStore()
const watcherStore = useWatcherStore()
const registrationStore = useRegistrationStore()
const contextMenuStore = useContextMenu()
const dialogsStore = useDialogsStore()
const route = useRoute()
const {mobile} = useDisplay()
const {locale} = useI18n()

const {init: initAppUpdater} = useAppUpdater()
const {applyTheme} = useAppTheme()
const eventBus = useEventBus()

const isAppReady = ref(false)
const upd = ref(0)

const userAgent = navigator.userAgent.toLowerCase()
const isElectron = userAgent.includes(' electron/')
const isMac = userAgent.includes('mac')
const isWin = userAgent.includes('windows')

store.isElectron = isElectron

const isPlayerWindow = computed(() => !!route.query.player)
const appZoom = route.query.player ? null : useAppZoom()
const isPlayerShow = computed(() => isPlayerWindow.value || player.active)
const contextMenu = computed(() => contextMenuStore)

const addedTopClasses = computed(() => ({
  'windows-os-added-top': isWin && isElectron,
  'added-top-tabs': store.tabs.length,
}))

const isSettingsPage = computed(() => route.path === '/settings')

const apiUrl = computed(() => store.localhost)

const {runWatcher, stopWatcher, updateWatcher} = useWatcher(apiUrl.value)
const {handleAddMedia, cleanupEventListeners} = useMediaAdding()

/* ------------------------- API LOADERS ------------------------- */

async function initSettings() {
  try {
    const res = await axios.get(apiUrl.value + "/api/Setting")
    const sets = res.data.reduce((a, i) => {
      a[i.option] = i.value
      return a
    }, {})

    settingsStore.updateMultiple(sets)
  } catch {
    store.isServerError = true
  }
}

async function loadList(url, field) {
  try {
    const res = await axios.get(apiUrl.value + url)
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
  store.isLocked = settingsStore.passwordProtection == "1"
}

async function getFolders() {
  watcherStore.folders = await $operable.getWatchedFolders()
}

async function getMachineId() {
  await axios
    .get(apiUrl.value + "/api/Task/getMachineId")
    .then((res) => {
      registrationStore.machineId = res.data
    })
    .catch((e) => {
      console.log(e)
    })
}

function runAutoRegistration() {
  registrationStore.tryAutoRegisterOnStartup().catch((error) => {
    console.error('Auto registration failed:', error)
  })
}

/* ------------------------- OTHER LOGIC ------------------------- */

const saveWindowSize = _.debounce(() => {
  const app_window = isPlayerWindow ? 'player' : 'win'
  const data = {
    [app_window]: {
      height: window.outerHeight,
      width: window.outerWidth,
    }
  }
  $operable.updateConfig(data)
}, 500)

const handleAboutApp = () => {
  dialogsStore.showAbout()
}

const handleLockApp = () => {
  store.isLocked = true
}

let unsubscribeAboutApp
let unsubscribeLockApp
let unsubscribeZoomChanged

/* ------------------------- MOUNTED ------------------------- */

onMounted(async () => {
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

  // get data from DB
  await loadList("/api/mediaType", "mediaTypes")
  await loadList("/api/tag", "tags")
  await loadList("/api/meta", "meta")
  await loadList("/api/tab", "tabs")
  await loadList("/api/playlist", "playlists")

  // global event listeners
  eventBus.on("getMediaTypes", async () => {
    await loadList("/api/mediaType", "mediaTypes")
  })
  eventBus.on("getTags", async () => {
    await loadList("/api/tag", "tags")
  })
  eventBus.on("getMeta", async () => {
    await loadList("/api/meta", "meta")
  })
  eventBus.on("getTabs", async () => {
    await loadList("/api/tab", "tabs")
  })
  eventBus.on("getPlaylists", async () => {
    await loadList("/api/playlist", "playlists")
  })
  eventBus.on("updatePage", () => ++upd.value)

  eventBus.on('update:watcher', handleUpdateWatcher)
  eventBus.on('addMedia', handleAddMedia)

  isAppReady.value = true
  runAutoRegistration()

  // setInterval(clearConsole, 1000 * 60 * 5)

  if (store.isElectron) {
    window.electronAPI.on("getItemsFromDb", (event, data) => {
      eventBus.emit("getItemsFromDb", data)
    })
    window.electronAPI.on("removeEntitiesFromState", (event, data) => {
      eventBus.emit("removeEntitiesFromState", data)
    })

    unsubscribeAboutApp = window.electronAPI.on('aboutApp', handleAboutApp)
    unsubscribeLockApp = window.electronAPI.on('lockApp', handleLockApp)

    window.addEventListener('resize', saveWindowSize)
  }
})

onBeforeUnmount(() => {
  cleanupEventListeners()
  window.removeEventListener('resize', saveWindowSize)
  unsubscribeAboutApp?.()
  unsubscribeLockApp?.()
  unsubscribeZoomChanged?.()

  if (appZoom) {
    window.removeEventListener('keydown', appZoom.handleKeydown)
    window.removeEventListener('wheel', appZoom.blockPinchZoom)
  }
})
</script>

<style lang="scss">
@import "@/assets/styles/app.scss";

html,
body {
  overflow: hidden;
  height: 100%;
}

.reduced-top {
  padding-top: 0 !important;
}

.app-main-layout {
  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden !important;
}

.main-scroll {
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.main-scroll-inner {
  padding-top: 48px;

  &.added-top-tabs {
    padding-top: calc(48px + 28px);
  }

  &.windows-os-added-top {
    padding-top: calc(48px + 32px);

    &.added-top-tabs {
      padding-top: calc(48px + 32px + 28px);
    }
  }
}

.main-scroll--settings {
  overflow: hidden;
}

.main-scroll-inner--settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.added-top {
  &.blur {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding-top: 48px;
    pointer-events: none;
    backdrop-filter: blur(10px);
    background-color: rgba(var(--v-theme-background), 0.7);
    z-index: 10;

    &.windows-os-added-top {
      padding-top: calc(48px + 32px);
    }

    &.added-top-tabs {
      padding-bottom: 28px;
    }
  }
}

// Windows Electron header chrome (macOS-like transparency + blur)
.electron-win {
  .system-bar-custom.v-system-bar {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: none !important;
    border-bottom: none !important;
    overflow: visible;
    z-index: 1010 !important;
  }

  .v-app-bar.os-windows-electron {
    border-top: none !important;

    .v-toolbar__underlay {
      opacity: 0;
    }

    // macOS-style: bar is semi-transparent, blur only on toolbar buttons
    .v-toolbar__content .v-btn {
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);

      &:not(.v-btn--variant-flat) {
        background: transparent !important;

        .v-btn__overlay,
        .v-btn__underlay {
          opacity: 0;
        }

        &:hover .v-btn__overlay {
          opacity: var(--v-hover-opacity);
        }
      }
    }
  }

  .added-top.blur {
    backdrop-filter: blur(10px);
  }

  .filters-drawer .filter-block {
    backdrop-filter: blur(20px);
  }
}
</style>
