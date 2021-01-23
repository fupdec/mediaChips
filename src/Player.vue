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

export default {
  name: 'Player',
  components: {
    VideoPlayer: () => import('@/components/elements/VideoPlayer.vue'),
  },
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
      if (imgType === 'tag') {
        let img = path.join(this.pathToUserData, `/media/tags/${this.hoveredImageId}_.jpg`)
        return fs.existsSync(img) ? img : path.join(this.pathToUserData,'/img/templates/tag.png')
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