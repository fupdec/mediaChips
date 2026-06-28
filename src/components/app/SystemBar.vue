<template>
  <v-system-bar
    :class="{ maximized: maximized }"
    :color="colorRGBA"
    :style="gradient"
    class="system-bar-custom"
    window
    app
  >
    <div class="app-menu-container">
      <v-menu
        bottom
        offset-y
        :offset="[1, -1]"
        :transition="false"
        min-width="150"
        content-class="system-menu-dropdown"
        class="system-menu"
        :z-index="2000"
      >

      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          :ripple="false"
          class="system-menu-btn"
          height="32"
          size="small"
          variant="text"
        >
          {{ t('systemBar.menu_app') }}
        </v-btn>
      </template>

      <v-list
        density="compact"
        class="context-menu"
        :lines="false"
        nav
        rounded="lg"
      >
        <div class="wrapper">
          <v-list-item
            link
            class="pr-3"
            @click="lock"
            :disabled="SETTINGS.passwordProtection !== '1'"
          >
            <v-list-item-title>
              <v-icon class="mr-3">mdi-lock</v-icon>
              {{ t('systemBar.lock') }}
            </v-list-item-title>
          </v-list-item>

          <v-divider class="ma-1"/>

          <v-list-item
            link
            class="pr-3"
            @click="close"
          >
            <v-list-item-title>
              <v-icon class="mr-3">mdi-logout</v-icon>
              {{ t('common.exit') }}
            </v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
      </v-menu>

      <v-menu
        v-model="helpMenuOpen"
        bottom
        offset-y
        :offset="[1, -1]"
        :transition="false"
        min-width="150"
        content-class="system-menu-dropdown"
        class="system-menu"
        :z-index="2000"
      >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          :ripple="false"
          class="system-menu-btn"
          height="32"
          size="small"
          variant="text"
        >
          {{ t('systemBar.menu_help') }}
        </v-btn>
      </template>

      <v-list
        density="compact"
        class="context-menu"
        :lines="false"
        nav
        rounded="lg"
      >
        <div class="wrapper">
          <v-list-item
            link
            class="pr-3"
            @click="toggleDevTools"
          >
            <v-list-item-title class="system-menu-item-with-hotkey">
              <span>
                <v-icon class="mr-3">mdi-tools</v-icon>
                {{ t('systemBar.toggle_dev_tools') }}
              </span>
              <v-hotkey keys="Ctrl+Shift+I" inline/>
            </v-list-item-title>
          </v-list-item>

          <v-divider class="ma-1"/>

          <v-list-item
            link
            class="pr-3"
            @mouseup.stop="openAboutDialog"
          >
            <v-list-item-title>
              <v-icon class="mr-3">mdi-information-variant</v-icon>
              {{ t('settings.tabs.about') }}
            </v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
      </v-menu>
    </div>

    <v-spacer></v-spacer>
    <div
      class="app-system-bar-title"
      v-text="app_title"
    ></div>
    <v-spacer></v-spacer>

    <!-- Импортируем компонент кнопок окна -->
    <WindowControls
      @minimize="minimize"
      @maximize="maximize"
      @unmaximize="unmaximize"
      @close="close"
      window-type="main"
    />
  </v-system-bar>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useHeaderBarStyle} from '@/composable/useHeaderBarStyle'
import WindowControls from '@/components/ui/WindowControls.vue' // Импортируем компонент

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  lock: []
}>()

// Реактивные переменные
const maximized = ref(false)
const helpMenuOpen = ref(false)

const router = useRouter()
const {t} = useI18n()

// Хранилища Pinia
const settingsStore = useSettingsStore()
const appStore = useAppStore()
const dialogsStore = useDialogsStore()

const {colorRGBA, gradient, barTheme} = useHeaderBarStyle('system')

// Компьютеды
const SETTINGS = computed(() => settingsStore)
const app_title = computed(() => appStore.app_title || 'MediaChips')

// Методы окон (теперь вызываются из WindowControls через emits)
const minimize = () => {
  // Эта функция вызывается через emit из WindowControls
}

const maximize = () => {
  maximized.value = true
}

const unmaximize = () => {
  maximized.value = false
}

const close = () => {
  if (window.electronAPI?.send) {
    window.electronAPI.send('closeApp')
  }
}

const lock = () => {
  emit('lock')
}

const openAboutDialog = () => {
  helpMenuOpen.value = false
  nextTick(() => {
    dialogsStore.showAbout()
  })
}

const back = () => {
  router.go(-1)
}

const forward = () => {
  router.go(1)
}

const toggleDevTools = () => {
  if (window.electronAPI?.invoke) {
    window.electronAPI.invoke('toggleDevTools')
  }
}

// Обработчики IPC событий
const handleMaximize = () => {
  maximized.value = true
}

const handleUnmaximize = () => {
  maximized.value = false
}

const handleNavigationBack = () => {
  back()
}

const handleNavigationForward = () => {
  forward()
}

// Жизненный цикл
onMounted(() => {
  if (window.electronAPI?.on) {
    window.electronAPI.on('maximize', handleMaximize)
    window.electronAPI.on('unmaximize', handleUnmaximize)
    window.electronAPI.on('navigationBack', handleNavigationBack)
    window.electronAPI.on('navigationForward', handleNavigationForward)
  }
})

onUnmounted(() => {
  if (window.electronAPI?.removeListener) {
    window.electronAPI.removeListener('maximize', handleMaximize)
    window.electronAPI.removeListener('unmaximize', handleUnmaximize)
    window.electronAPI.removeListener('navigationBack', handleNavigationBack)
    window.electronAPI.removeListener('navigationForward', handleNavigationForward)
  }
})
</script>

<style lang="scss">
.app-menu-container {
  -webkit-app-region: no-drag;
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  height: 100%;
  flex: 0 0 auto;

  .v-btn {
    text-transform: capitalize;
    font-weight: normal;
    letter-spacing: normal;
    padding: 0 8px !important;
    min-width: 0 !important;

    &__content {
      line-height: 1;
    }
  }
}

.app-system-bar-title {
  position: absolute;
  left: 120px;
  right: 138px;
  text-align: center;
  font-size: 12px;
  -webkit-app-region: drag;
}

.v-system-bar {
  overflow: visible;

  &:before {
    content: "";
    position: absolute;
    height: 100%;
    top: 3px;
    left: 120px;
    right: 138px;
    background-color: transparent;
    -webkit-app-region: drag;
    pointer-events: none;
    z-index: 0;
  }

  &.maximized:before {
    top: 0;
  }
}

.context-menu,
.system-menu {
  -webkit-app-region: no-drag;
}

.system-menu-btn {
  position: relative;
  z-index: 2;
  -webkit-app-region: no-drag;
}

.system-menu-dropdown {
  min-width: 150px !important;
}

.system-bar-custom .context-menu {
  min-width: 150px;

  .system-menu-item-with-hotkey {
    display: flex;
    align-items: center;
    width: 100%;

    > span:first-child {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
    }

    .v-hotkey {
      flex-shrink: 0;
      margin-left: 12px;
    }
  }
}

@media (max-width: 840px) {
  .app-system-bar-title {
    right: 160px;
    position: absolute;
  }
}

@media (max-width: 680px) {
  .app-system-bar-title {
    display: none;
  }
}
</style>