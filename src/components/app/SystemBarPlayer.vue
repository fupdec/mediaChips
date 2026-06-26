<template>
  <v-system-bar
    :class="{ maximized: maximized }"
    class="system-bar-player"
    color="rgb(29 29 29 / 80%)"
    theme="dark"
    window
  >
    <v-spacer></v-spacer>
    <div class="app-system-bar-title" :title="appTitle">{{ appTitle }}</div>
    <v-spacer></v-spacer>

    <!-- Импортируем компонент кнопок окна -->
    <WindowControls
      v-if="platform.win || platform.linux"
      @minimize="minimize"
      @maximize="maximize"
      @unmaximize="unmaximize"
      @close="close"
      window-type="player"
    />
  </v-system-bar>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {usePlayerStore} from '@/stores/player'
import WindowControls from '@/components/ui/WindowControls.vue'
import {useDisplay} from "vuetify"; // Импортируем компонент

const props = defineProps({
  disabled: Boolean,
  os: {
    type: [Boolean, String],
    default: false
  }
})

const {platform} = useDisplay()
const appStore = useAppStore()
const playerStore = usePlayerStore()
const {mediaWindowTitle} = storeToRefs(playerStore)

const maximized = ref(false)

const appTitle = computed(() => {
  if (mediaWindowTitle.value) return mediaWindowTitle.value
  return appStore.app_title || 'MediaChips'
})

// Методы окон (теперь вызываются из WindowControls через emits)
function minimize() {
  // Эта функция вызывается через emit из WindowControls
}

function maximize() {
  maximized.value = true
}

function unmaximize() {
  maximized.value = false
}

function close() {
  // Эта функция вызывается через emit из WindowControls
}

onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.on("maximize", () => {
      maximized.value = true
    })

    window.electronAPI.on("unmaximize", () => {
      maximized.value = false
    })

    window.electronAPI.on("enter-full-screen", () => {
      playerStore.fullscreen = true
    })

    window.electronAPI.on("leave-full-screen", () => {
      playerStore.fullscreen = false
    })
  }
})
</script>

<style lang="scss">
.system-bar-player {
  top: 0 !important;
  left: 0 !important;
  border-radius: 0 !important;
  overflow: hidden;
  -webkit-app-region: drag;
  width: 100% !important;
  position: relative;

  .app-system-bar-title {
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    text-align: center;
    padding: 0 138px 0 80px;
    max-width: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
  }
}
</style>