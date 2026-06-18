<template>
  <v-system-bar
    :class="{ maximized: maximized }"
    :color="colorRGBA"
    :style="gradient"
    class="system-bar-custom"
    window
    app
  >
    <v-menu bottom
      theme="light"
      offset-y
      min-width="160"
      class="system-menu">

      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          :ripple="false"
          class="system-menu-btn"
          height="32"
          size="small"
          variant="text"
        >
          App
        </v-btn>
      </template>

      <v-list
        density="compact"
        class="context-menu"
        rounded="lg"
        nav
      >

        <v-list-item
          link
          @click="lock"
          :disabled="SETTINGS.passwordProtection !== '1'"
        >
          <template v-slot:prepend>
            <v-icon size="small">mdi-lock</v-icon>
          </template>

          <v-list-item-title>
            Lock
          </v-list-item-title>
        </v-list-item>

        <v-divider class="my-1"></v-divider>

        <v-list-item link
          density="compact"
          @click="close">

          <template v-slot:prepend>
            <v-icon size="small">mdi-logout</v-icon>
          </template>

          <v-list-item-title>
            Exit
          </v-list-item-title>

        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu bottom
      offset-y
      min-width="160"
      class="system-menu">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          :ripple="false"
          class="system-menu-btn"
          height="32"
          size="small"
          variant="text"
        >
          Help
        </v-btn>
      </template>

      <v-list
        density="compact"
        class="context-menu"
        rounded="lg"
        nav
      >
        <v-list-item link
          @click="toggleDevTools">
          <template v-slot:prepend>
            <v-icon size="small">mdi-tools</v-icon>
          </template>
          <v-list-item-title>
            Toggle Developer Tools
            <span class="pl-8">
              <v-hotkey keys="Ctrl+Shift+I"></v-hotkey>
            </span>
          </v-list-item-title>
        </v-list-item>
        <v-divider class="my-1"></v-divider>
        <v-list-item link
          density="compact"
          @click="about">
          <template v-slot:prepend>
            <v-icon size="small">mdi-information-variant</v-icon>
          </template>
          <v-list-item-title>
            About
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

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

<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {useRouter} from 'vue-router'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useHeaderBarStyle} from '@/composable/useHeaderBarStyle'
import WindowControls from '@/components/ui/WindowControls.vue' // Импортируем компонент

// Пропсы
defineProps({
  disabled: Boolean,
})

// Эмиты
const emit = defineEmits(['lock'])

// Реактивные переменные
const maximized = ref(false)

const router = useRouter()

// Хранилища Pinia
const settingsStore = useSettingsStore()
const dialogsStore = useDialogsStore()

const {colorRGBA, gradient, barTheme} = useHeaderBarStyle('system')

// Компьютеды
const SETTINGS = computed(() => settingsStore)
const app_title = computed(() => settingsStore.app_title || 'MediaChips')

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
  if (window.electronAPI) {
    window.electronAPI.send('closeApp')
  }
}

const lock = () => {
  emit('lock')
}

const about = () => {
  dialogsStore.about.show = true
}

const back = () => {
  router.go(-1)
}

const forward = () => {
  router.go(1)
}

const toggleDevTools = () => {
  if (window.electronAPI) {
    window.electronAPI.send("toggleDevTools")
  }
}

// Обработчики IPC событий
const handleMaximize = () => {
  maximized.value = true
}

const handleUnmaximize = () => {
  maximized.value = false
}

const handleLockApp = () => {
  lock()
}

const handleAboutApp = () => {
  about()
}

const handleNavigationBack = () => {
  back()
}

const handleNavigationForward = () => {
  forward()
}

// Жизненный цикл
onMounted(() => {
  if (window.electronAPI) {
    // Подписываемся на события IPC
    window.electronAPI.on('maximize', handleMaximize)
    window.electronAPI.on('unmaximize', handleUnmaximize)
    window.electronAPI.on('lockApp', handleLockApp)
    window.electronAPI.on('aboutApp', handleAboutApp)
    window.electronAPI.on('navigationBack', handleNavigationBack)
    window.electronAPI.on('navigationForward', handleNavigationForward)
  }
})

onUnmounted(() => {
  if (window.electronAPI) {
    // Отписываемся от событий IPC
    window.electronAPI.removeListener('maximize', handleMaximize)
    window.electronAPI.removeListener('unmaximize', handleUnmaximize)
    window.electronAPI.removeListener('lockApp', handleLockApp)
    window.electronAPI.removeListener('aboutApp', handleAboutApp)
    window.electronAPI.removeListener('navigationBack', handleNavigationBack)
    window.electronAPI.removeListener('navigationForward', handleNavigationForward)
  }
})
</script>

<style lang="scss">
.app-menu-container {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 0;
  left: 30px;
  height: 100%;

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
  width: 100%;
  text-align: center;
  font-size: 12px;
  pointer-events: none;
  -webkit-app-region: drag;
}

.v-system-bar {
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    height: 100%;
    top: 3px;
    left: 3px;
    right: 138px;
    background-color: transparent;
    -webkit-app-region: drag;
    pointer-events: none;
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
  z-index: 1;
  -webkit-app-region: no-drag;
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