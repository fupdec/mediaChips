<template>
  <v-app>
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
const fs = require("fs")
const path = require("path")

import HoveredImageFunctions from '@/mixins/HoveredImageFunctions'

export default {
  name: 'Player',
  components: {
    VideoPlayer: () => import('@/components/elements/VideoPlayer.vue'),
  },
  mixins: [HoveredImageFunctions],
  mounted() {
    this.$nextTick(function () {
      this.$store.state.pathToUserData = app.getPath('userData')
      this.$vuetify.theme.dark = true
    })
  },
  data: () => ({
  }),
  computed: {
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
  },
  methods: {
  },
}
</script>


<style lang="sass">
  @import '@/assets/styles/app.scss'
</style>