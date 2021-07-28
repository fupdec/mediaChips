<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-home-outline</v-icon> Home </div>

    <v-container class="text-center">
      <v-row>
        <v-col v-if="videosNumber==0" cols="12">
          <img alt="mediaChips" width="200" height="200" :src="logoPath">
          <h2 class="my-8">Welcome to mediaChips application!</h2>
      
          <div v-if="metaNumber==0" cols="12">
            <div class="mb-4"> First, create a meta for your videos. 
              You can view and customize the meta in the settings. </div>
            <v-btn @click="createAllMeta=true" :disabled="isAllMetaCreated" class="mb-4" color="primary" x-large rounded block>
              <v-icon left>mdi-auto-fix</v-icon> Create all meta </v-btn>
          </div>

          <div class="mb-4 mt-10">Then add videos from your computer by selecting folders.</div>
          <v-btn @click="$store.state.Settings.dialogScanVideos=true" color="primary" x-large rounded block>
            <v-icon left>mdi-plus</v-icon> Add videos </v-btn>
        </v-col>
      </v-row>

      <v-row v-if="videosNumber>0">
        <v-col cols="12">
          <v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="headline mb-1">
                  Total videos: {{videosNumber}}
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  {{$store.state.quantityRecentVideos}} recently added videos
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div class="recent-videos-grid" @mousedown="stopSmoothScroll($event)"> 
              <v-hover v-for="video in recentVideos" :key="video.id">
                <template v-slot:default="{ hover }">
                  <v-img :src="getVideoThumbUrl(video.id)" @click="playVideo(video)" aspect-ratio="1">
                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute color="secondary">
                        <v-btn icon x-large outlined>
                          <v-icon>mdi-play</v-icon>
                        </v-btn>
                      </v-overlay>
                    </v-fade-transition>
                  </v-img>
                </template>
              </v-hover>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2 pr-4" color="secondary" to="/videos/:default?tabId=default" draggable="false" outlined rounded>
                <v-icon left>mdi-video</v-icon> Open Videos</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card hover to="/settings" draggable="false">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="">
                  Add new videos, change theme colors and more
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2 pr-4" color="secondary" to="/settings" draggable="false" outlined rounded> 
                <v-icon left>mdi-cog</v-icon> Open settings</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="$store.state.Settings.videosTotal==0">
        <h2>First of all add videos in settings</h2>
        <v-btn class="ma-2" color="secondary" to="/settings" draggable="false">Open settings</v-btn>
      </div>
    </v-container>

    <CreateAllMeta v-if="createAllMeta" :dialog="createAllMeta" @finish="closeDialogCreateAllMeta" @close="createAllMeta=false"/>

    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>

<script>
const {app} = require('electron').remote
const path = require('path')
const fs = require('fs')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'

export default {
  name: 'HomePage',
  components: {
    vuescroll,
    CreateAllMeta: () => import("@/components/pages/meta/CreateAllMeta.vue"),
  },
  mixins: [LabelFunctions], 
  mounted() {
    this.$nextTick(function () {
      this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:app.getVersion()})
    })
  },
  data: ()=>({
    seriesTags: [],
    seriesWebsites: [],
    isScrollToTopVisible: false,
    createAllMeta: false,
    isAllMetaCreated: false,
  }),
  computed: {
    settings() { return this.$store.getters.settings.value() },
    previewsNumber() { return this.$store.state.quantityRecentVideos },
    recentVideos() { return this.$store.getters.videos.orderBy('date', ['desc']).take(this.previewsNumber).value() },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    logoPath() { return path.join('file://', __static, '/icons/icon.png') },
    videosNumber() { return this.$store.getters.videos.value().length },
    metaNumber() { return this.$store.getters.meta.filter(i=>i.type!=='specific').value().length },
  },
  methods: {
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getVideoThumbUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return 'file://' + this.checkVideoImageExist(imgPath)
    },
    checkVideoImageExist(imgPath) {
      if (fs.existsSync(imgPath)) return imgPath
      else return path.join(__static, '/img/default.jpg')
    },
    playVideo(video) {
      if (!fs.existsSync(video.path)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = video.path
        return
      }
      if (this.$store.state.Settings.isPlayVideoInSystemPlayer) shell.openPath(video.path) 
      else {
        let data = { videos: this.recentVideos, id: video.id }
        ipcRenderer.send('openPlayer', data)
      }
    },
    closeDialogCreateAllMeta() {
      this.createAllMeta = false
      this.isAllMetaCreated = true
    },
    openLink(link) { shell.openExternal(link) },
  },
}
</script>

<style lang="less">
.error-fix {
  font-size: 10px;
  user-select: text;
}
.recent-videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10%, 10%));
  .v-image {
    cursor: pointer;
  }
}
</style>