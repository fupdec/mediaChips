<template>
	<div class="app-bar-container">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="$store.state.Settings.dialogScanVideos=true" v-on="on">
            <v-icon>mdi-video-plus</v-icon>
          </v-btn>
        </template>
        <span>Add new videos</span>
      </v-tooltip>
    </div>

    <VideosAppbarActions />
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="openRandomVideo" icon tile v-on="on"> 
          <v-icon>mdi-dice-5</v-icon>
        </v-btn>
      </template>
      <span>Open random video</span>
    </v-tooltip>

    <v-spacer></v-spacer>

    <VideosAppbarCardView />
  </div>
</template>


<script>
const fs = require('fs')
const shell = require('electron').shell

import { ipcRenderer } from 'electron'

export default {
  name: 'VideosAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
  },
  methods: {
    openRandomVideo() {
      const videos = this.$store.getters.filteredVideos.value()
      if (videos.length == 0) return
      if (videos.length == 1) {
        this.playVideo(videos[0])
        return
      }
      const rand = this.getRandomIntInclusive(1, videos.length)
      const video = videos[rand-1]
      this.playVideo(video)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    playVideo(video) {
      const pathToVideo = video.path
      if (!fs.existsSync(pathToVideo)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      if (this.$store.state.Settings.isPlayVideoInSystemPlayer) shell.openPath(pathToVideo)
      else {
        let data = { videos: [video], id: video.id }
        ipcRenderer.send('openPlayer', data)
      }  
    },
  },
  watch: {
  },
}
</script>