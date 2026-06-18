<template>
  <div class="window-controls">
    <v-btn
      @click="minimize"
      width="46"
      height="32"
      variant="plain"
      size="small"
      class="window-control-btn"
    >
      <v-icon>mdi-minus</v-icon>
    </v-btn>
    <v-btn
      v-if="maximized"
      @click="unmaximize"
      width="46"
      height="32"
      variant="plain"
      size="small"
      class="window-control-btn"
    >
      <v-icon>mdi-window-restore</v-icon>
    </v-btn>
    <v-btn
      v-else
      @click="maximize"
      width="46"
      height="32"
      variant="plain"
      size="small"
      class="window-control-btn"
    >
      <v-icon>mdi-square-outline</v-icon>
    </v-btn>
    <v-btn
      @click="close"
      width="46"
      height="32"
      class="window-control-btn close-app-btn"
      variant="plain"
      size="small"
    >
      <v-icon>mdi-window-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import {useRoute} from "vue-router";

const props = defineProps({
  windowType: {
    type: String,
    default: 'main' // 'main' или 'player'
  }
})

const route = useRoute()

const windowType = computed(() => !!route.query.player ? 'player' : 'main')

const emit = defineEmits(['minimize', 'maximize', 'unmaximize', 'close'])

const maximized = ref(false)

const minimize = () => {
  emit('minimize')
  if (window.electronAPI) {
    window.electronAPI.invoke("minimize", windowType.value)
  }
}

const maximize = () => {
  maximized.value = true
  emit('maximize')
  if (window.electronAPI) {
    window.electronAPI.invoke("maximize", windowType.value)
  }
}

const unmaximize = () => {
  maximized.value = false
  emit('unmaximize')
  if (window.electronAPI) {
    window.electronAPI.invoke("unmaximize", windowType.value)
  }
}

const close = () => {
  emit('close')
  if (window.electronAPI) {
    if (windowType.value === 'player') {
      window.electronAPI.invoke("closePlayer")
    } else {
      window.electronAPI.send("closeApp")
    }
  }
}

// Обработчики событий от IPC
const handleMaximize = () => {
  maximized.value = true
}

const handleUnmaximize = () => {
  maximized.value = false
}

onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.on('maximize', handleMaximize)
    window.electronAPI.on('unmaximize', handleUnmaximize)
  }
})

onUnmounted(() => {
  if (window.electronAPI) {
    window.electronAPI.removeListener('maximize', handleMaximize)
    window.electronAPI.removeListener('unmaximize', handleUnmaximize)
  }
})
</script>

<style scoped
  lang="scss">
.window-controls {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;

  &.windows-style {
    .window-control-btn {
      min-width: 0;
    }

    .close-app-btn {
      &:hover {
        background-color: #d70000;

        .v-icon {
          color: #fff !important;
        }
      }
    }
  }

  .window-control-btn {
    min-width: 0;
    border-radius: 0 !important;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .close-app-btn:hover {
    background-color: #d70000 !important;

    .v-icon {
      color: #fff !important;
    }
  }
}
</style>