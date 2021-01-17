<template>
  <v-app :class="[textFont, headerFont]">
    <v-main app>
      <VideoPlayer />
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

import FilterVideos from '@/mixins/FilterVideos'

export default {
  name: 'Player',
  components: {
    VideoPlayer: () => import('@/components/elements/VideoPlayer.vue'),
  },
  mixins: [FilterVideos],
  mounted() {
    this.$nextTick(function () {
      this.$store.state.pathToUserData = app.getPath('userData')
      this.$vuetify.theme.dark = this.$store.getters.darkMode
    })
  },
  data: () => ({
  }),
  computed: {
    textFont() {
      return 'text-font-' + this.$store.getters.getTextFont.toLowerCase()
    },
    headerFont() {
      return 'header-font-' + this.$store.getters.getHeaderFont.toLowerCase()
    },
    darkMode: {
      get() {
        return this.$store.getters.darkMode
      },
      set(darkModeValue) {
        this.$vuetify.theme.dark = darkModeValue
        this.$store.dispatch('toggleDarkMode', darkModeValue)
      },
    },
    hoveredImageId() {
      return this.$store.state.hoveredImageId
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
  },
  methods: {
  },
}
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
</style>