<template>
  <div class="mx-4">
    <div class="d-flex">
      <div>
        <div>MediaChips v{{ appVersion }}-beta</div>
        <div>by MediaChips contributors</div>
        <v-btn
          @click="dialogs.versions = true"
          class="px-5 mt-2 mr-2"
          color="primary"
          rounded
          variant="flat"
          dark
        >
          <v-icon start>mdi-text</v-icon>
          Show version history
        </v-btn>
        <v-btn
          @click="openLink('https://mediachips.app/')"
          class="px-5 mt-2 mr-2"
          color="#7059b7"
          rounded
          variant="flat"
          dark
        >
          <v-icon start>mdi-web</v-icon>
          Website
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <div class="text-center d-flex flex-column">
        <img :src="logoPath" alt="MediaChips" width="64" height="64"/>
        <span>2026</span>
      </div>
    </div>

    <!-- Commented out social buttons section -->
    <!--
    <div class="d-flex flex-wrap mt-2">
      <v-btn
        @click="openLink('https://mediachips.app/')"
        class="px-5 mb-2 mr-2"
        color="#7059b7"
        rounded
        variant="flat"
        dark
      >
        <v-icon start>mdi-web</v-icon> Website
      </v-btn>
      <v-btn
        @click="openLink('https://github.com/mediachips/mediachips')"
        class="px-5 mb-2 mr-2"
        color="#eee"
        light
        rounded
        variant="flat"
      >
        <v-icon start>mdi-github</v-icon> Github
      </v-btn>
      <v-btn
        @click="openLink('https://reddit.com/r/mediachips/')"
        class="px-5 mb-2 mr-2"
        color="#ff4500"
        rounded
        variant="flat"
      >
        <v-icon start>mdi-reddit</v-icon> Reddit
      </v-btn>
      <v-btn
        @click="openLink('https://discord.gg/dEQPper2yu')"
        class="px-5 mb-2 mr-2"
        color="#7289DA"
        rounded
        variant="flat"
      >
        <v-icon start>mdi-discord</v-icon> Discord
      </v-btn>
      <v-btn
        @click="openLink('https://patreon.com/mediachips')"
        class="px-5 mb-2 mr-2"
        color="#ff424d"
        rounded
        variant="flat"
      >
        <v-icon start>mdi-patreon</v-icon> Patreon
      </v-btn>
    </div>
    -->

    <v-divider class="my-4"></v-divider>

    <div class="d-flex flex-column">
      <div class="mb-4">
        Thanks to the people who worked on these wonderful libraries
      </div>
      <div class="d-flex flex-wrap">
        <span
          v-for="(lib, index) in libraries"
          :key="lib.name"
          @click="openLink(lib.url)"
          class="mr-2 link"
        >
          {{ lib.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import {useAppStore} from '@/stores/app'
import {useDialogsStore} from '@/stores/dialogs'
import path from 'path-browserify'

const libraries = ref([
  { name: 'electron', url: 'https://github.com/electron' },
  { name: 'vue', url: 'https://github.com/vuejs/vue' },
  { name: 'vuetify', url: 'https://github.com/vuetifyjs/vuetify' },
  { name: 'vuex', url: 'https://github.com/vuejs/vuex' },
  { name: 'ffmpeg', url: 'https://www.ffmpeg.org/' },
  { name: 'videohubapp', url: 'https://github.com/whyboris/Video-Hub-App' },
  { name: 'apexcharts', url: 'https://github.com/apexcharts' },
  { name: 'archiver', url: 'https://github.com/archiverjs/node-archiver' },
  { name: 'axios', url: 'https://github.com/axios/axios' },
  { name: 'cheerio', url: 'https://github.com/cheeriojs/cheerio' },
  { name: 'core-js', url: 'https://github.com/zloirock/core-js' },
  { name: 'ffmpeg-static', url: 'https://github.com/eugeneware/ffmpeg-static' },
  { name: 'ffprobe-static', url: 'https://github.com/joshwnj/ffprobe-static' },
  { name: 'filepond', url: 'https://github.com/pqina/filepond' },
  { name: 'fluent-ffmpeg', url: 'https://github.com/fluent-ffmpeg/node-fluent-ffmpeg' },
  { name: 'fs-extra', url: 'https://github.com/jprichardson/node-fs-extra' },
  { name: 'jimp', url: 'https://github.com/oliver-moran/jimp' },
  { name: 'lowdb', url: 'https://github.com/typicode/lowdb' },
  { name: 'node-disk-info', url: 'https://github.com/cristiammercado/node-disk-info' },
  { name: 'node-stream-zip', url: 'https://github.com/antelle/node-stream-zip' },
  { name: 'shortid', url: 'https://github.com/dylang/shortid' },
  { name: 'vue-advanced-cropper', url: 'https://github.com/Norserium/vue-advanced-cropper' },
  { name: 'vue-country-flag', url: 'https://github.com/P3trur0/vue-country-flag' },
  { name: 'vue-router', url: 'https://github.com/vuejs/vue-router' },
  { name: 'vue-the-mask', url: 'https://www.npmjs.com/package/vue-the-mask' },
  { name: 'vuedraggable', url: 'https://github.com/SortableJS/Vue.Draggable' },
  { name: 'selection', url: 'https://github.com/Simonwep/selection' },
  { name: 'v-viewer', url: 'https://github.com/mirari/v-viewer' }
])

// Инициализация хранилищ
const appStore = useAppStore()
const dialogsStore = useDialogsStore()

// Реактивные ссылки из хранилищ
const appVersion = computed(() => appStore.appVersion)
const dialogs = computed(() => dialogsStore)

// Метод для получения пути к логотипу
const logoPath = computed(() => {
  // В Vite используем import для статических ассетов
  try {
    // Способ 1: Импорт через Vite
    return new URL('/icons/icon.png', import.meta.url).href
  } catch (error) {
    // Способ 2: Относительный путь из public директории
    return "/icons/icon.png"
  }
})

// Метод для открытия ссылок
const openLink = (link) => {
  // В Electron приложении
  if (window.electron && window.electron.shell) {
    window.electron.shell.openExternal(link)
  } else {
    // В веб-версии
    window.open(link, '_blank')
  }
}
</script>

<style scoped>
.link {
  margin-right: 5px;
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.link:hover {
  color: rgb(var(--v-primary-darken-2));
}

.text-secondary {
  color: rgba(0, 0, 0, 0.6);
}
</style>