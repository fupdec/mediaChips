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

    <v-main
      v-if="isAppReady && !isPlayerWindow"
      class="reduced-top app-main-layout"
      app
    >
      <div
        :class="addedTopClasses"
        class="added-top blur"
      ></div>

      <div class="main-scroll">
        <div :class="addedTopClasses"
          class="main-scroll-inner">
          <router-view :key="route.fullPath + upd"/>

          <div v-if="settingsStore.bottomBar == '1' || mobile"
            class="py-6"></div>
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
import {useDisplay, useTheme} from "vuetify"
import {useI18n} from 'vue-i18n'
import {useAppStore} from "@/stores/app"
import {usePlayerStore} from "@/stores/player"
import {useSettingsStore} from "@/stores/settings"
import {useContextMenu} from "@/stores/contextMenu"
import {useRegistrationStore} from "@/stores/registration"
import {useWatcherStore} from "@/stores/watcher"
import axios from "axios"
import _ from "lodash"
import {useEventBus} from "@/utils/eventBus"
import {useWatcher} from '@/composable/Watcher'

import SystemBar from "@/components/app/SystemBar.vue"
import AppBar from "@/components/app/AppBar.vue"
import SideBar from "@/components/app/SideBar.vue"
import BottomBar from "@/components/app/BottomBar.vue"
import Player from "@/components/app/Player.vue"
import HoverImage from "@/components/app/HoverImage.vue"
import NotificationsPool from "@/components/app/NotificationsPool.vue"
import ContextMenu from "@/components/app/ContextMenu.vue"
import AutoUpdater from "@/components/app/AutoUpdater.vue"
import Dialogs from "@/components/app/Dialogs.vue"

const settingsStore = useSettingsStore()
const store = useAppStore()
const player = usePlayerStore()
const watcherStore = useWatcherStore()
const registrationStore = useRegistrationStore()
const contextMenuStore = useContextMenu()
const route = useRoute()
const {mobile} = useDisplay()
const theme = useTheme()
const {locale} = useI18n()

const eventBus = useEventBus()

const isAppReady = ref(false)
const upd = ref(0)

const userAgent = navigator.userAgent.toLowerCase()
const isElectron = userAgent.includes(' electron/')
const isMac = userAgent.includes('mac')
const isWin = userAgent.includes('windows')

store.isElectron = isElectron

const isPlayerWindow = computed(() => !!route.query.player)
const isPlayerShow = computed(() => isPlayerWindow.value || player.active)
const contextMenu = computed(() => contextMenuStore)

const addedTopClasses = computed(() => ({
  'windows-os-added-top': isWin && isElectron,
  'added-top-tabs': store.tabs.length,
}))

const apiUrl = computed(() => store.localhost)

const {runWatcher, stopWatcher, updateWatcher} = useWatcher(apiUrl.value)

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

function applyTheme() {
  let isDarkMode

  if (settingsStore.system_dark_mode == '1') {
    const match = window.matchMedia('(prefers-color-scheme: dark)')
    isDarkMode = match.matches
  } else {
    isDarkMode = settingsStore.darkMode == "1"
  }

  const mode = isDarkMode ? "dark" : "light"

  const primary = isDarkMode ? settingsStore.appColorDarkPrimary : settingsStore.appColorLightPrimary
  const secondary = isDarkMode ? settingsStore.appColorDarkSecondary : settingsStore.appColorLightSecondary

  theme.themes.value[mode].colors.primary = primary
  theme.themes.value[mode].colors.secondary = secondary

  theme.change(isDarkMode ? "dark" : "light")
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

/* ------------------------- MOUNTED ------------------------- */

onMounted(async () => {
  await initSettings()
  applyTheme()
  applyLocale()
  checkLogin()
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

    window.addEventListener('resize', saveWindowSize)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', saveWindowSize)
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

// backdrop-filter breaks GPU compositing in Electron on Windows (blank white window)
.electron-win {
  * {
    backdrop-filter: none !important;
  }
}
</style>
