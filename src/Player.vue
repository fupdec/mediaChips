<template>
  <v-app>
    <v-main app>
      <VideoPlayer @toggleFullscreen="toggleFullscreen"/>
    </v-main>
    
    <img 
      v-show="$store.state.hoveredImage" class="list-img-preview"
      :src="getHoveredImage" height="160" max-width="160"
      :style="`top:${$store.state.hoveredImageY+30}px;left:${$store.state.hoveredImageX+30}px;`"
    />
  </v-app>
</template>


<script>
console.clear()

const {app} = require('electron').remote
const { ipcRenderer } = require('electron')

import HoveredImageFunctions from '@/mixins/HoveredImageFunctions.vue'

export default {
  name: 'Player',
  components: {
    VideoPlayer: () => import('@/components/elements/VideoPlayer.vue'),
  },
  mixins: [HoveredImageFunctions],
  mounted() {
    this.$nextTick(function () {
      this.$store.state.pathToUserData = app.getPath('userData')
      ipcRenderer.on('toggleDarkMode', (event, value) => {
        this.getDarkMode(value)
      })
    })
  },
  data: () => ({
  }),
  computed: {
    fullscreen: {
      get() {
        return this.$store.state.fullscreen
      },
      set(value) {
        this.$store.state.fullscreen = value
      },
    },
    hoveredImageId() {
      return this.$store.state.hoveredImageId
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    getHoveredImage() {
      let imgType = this.$store.state.hoveredImageType
      if (imgType === 'performer') {
        return this.getImgPerformersUrl(this.hoveredImageId)
      }
      if (imgType === 'tag') {
        return this.getImgTagsUrl(this.hoveredImageId)
      }
      if (imgType === 'website') {
        return this.getImgWebsiteUrl(this.hoveredImageId)
      }
    },
    settingsDb() {
      return this.$store.state.settingsDb
    },
  },
  methods: {
    toggleFullscreen() {
      if (this.fullscreen) {
        document.exitFullscreen()
      } else {
        document.getElementById('app').requestFullscreen()
      }
      this.fullscreen = !this.fullscreen
    },
    getDarkMode(value) {
      if (value !== null) {
        this.$vuetify.theme.dark = value
      } else {
        if (this.settingsDb===null) this.$vuetify.theme.dark = false
        else this.$vuetify.theme.dark = this.settingsDb.darkMode 
      }
    },
  },
  watch: {
    settingsDb() {
      this.getDarkMode()
    },
  },
}
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
</style>