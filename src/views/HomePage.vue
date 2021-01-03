<template>
  <vuescroll>
    <div class="headline text-h3 text-center my-6">Home</div>

    <v-container class="text-center">
      <div v-if="$store.getters.videosTotal==0">
        <img alt="AMDB" width="200" height="200" :src="logoPath">
        <h2 class="mt-8">Welcome to Adult Video Database application!</h2>
        <v-divider class="my-10"></v-divider>
      </div>
      <v-row v-else>
        <v-col cols="12">
          <div class="mb-2 red--text">Starting from version 0.5.5 there will be no bitrate information in the video.
            <br> Also updated video resolution information. 
            <br> To update the metadata in existing videos click the "Fix metadata in videos" button. </div>
          <v-btn @click="fixVideos" color="red" x-large class="mt-8" block> 
            <v-icon left>mdi-auto-fix</v-icon> Fix metadata in videos </v-btn>
          <v-dialog v-model="dialogFixVideos" width="1200" scrollable persistent>
            <v-card>
              <v-card-title>
                <div>Fixing metadata in videos</div>
                <v-spacer></v-spacer>
                <v-icon>mdi-video-outline</v-icon>
              </v-card-title>
              <v-divider></v-divider>
              <vuescroll>
                <v-card-text class="pt-10">
                  <div v-if="fixingVideos" class="text-center">
                    <h3 class="mb-2">Fixing...</h3>
                    <v-icon x-large class="loading-animation">mdi-loading</v-icon>
                    <h5 class="mt-6">Each video takes 1 second to read. 
                      The duration of the process depends on the number of videos. 
                      This can take a long time.</h5>
                  </div>
                  <div v-else class="text-center">
                    <h3 class="mb-2">Metadata fixed!</h3>
                  </div>
                  <v-alert v-if="errorFixVideos.length>0" type="error" :icon="false" text dense outlined class="error-fix mt-4"> 
                    Video file read error:<br>
                    <div v-for="(video,i) in errorFixVideos" :key="i" v-html="`${i+1}) ${video}<br>`"></div>
                  </v-alert>
                </v-card-text>
              </vuescroll> 
              <v-card-actions>
                <v-spacer/>
                <v-btn @click="dialogFixVideos=false" :disabled="fixingVideos"
                  color="primary" class="ma-4">OK</v-btn>
                <v-spacer/>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="headline mb-1">
                  Total videos: {{$store.getters.videosTotal}}
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  {{$store.state.quantityRecentVideos}} recently added videos
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div class="recent-videos-grid"> 
              <v-hover v-for="video in recentVideos" :key="video.id">
                <template v-slot:default="{ hover }">
                  <v-img :src="getVideoThumbUrl(video.id)" 
                    @click="playVideo(video.path)" aspect-ratio="1"
                  >
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
              <v-btn class="ma-2" color="secondary" to="/videos/:default?tabId=default">Open Videos</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="headline mb-1">
                  Total performers: {{$store.getters.performersTotal}}
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  Top {{$store.state.quantityRecentVideos}} best performers by rating
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div class="top-performers-grid"> 
              <v-hover v-for="perf in topPerformers" :key="perf.id">
                <template v-slot:default="{ hover }">
                  <v-img :src="getPerformerImg(perf.id)" aspect-ratio="1"
                    @click="openPerformerPage(perf.id)" position="top"
                  >
                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute color="secondary">
                        <v-btn x-small height="auto" width="auto" class="pa-1" outlined>
                          {{perf.name}}
                        </v-btn>
                      </v-overlay>
                    </v-fade-transition>
                  </v-img>
                </template>
              </v-hover>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2" color="secondary" to="/performers/:default?tabId=default">Open Performers</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="headline mb-1">
                  Total tags: {{$store.getters.tagsTotal}}
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  Top most used tags in videos
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            
            <v-card-text>
              <apexchart type="pie" height="320" :options="chartOptionsTags" :series="seriesTags"/>
            </v-card-text>
            
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2" color="secondary" to="/tags/:default?tabId=default">Open tags</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="headline mb-1">
                  Total websites: {{$store.getters.websitesTotal}}
                </v-list-item-title>
                <v-list-item-subtitle class="caption">
                  Top websites by number of videos
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-card-text>
              <apexchart type="pie" height="320" :options="chartOptionsWebsites" :series="seriesWebsites"/>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2" color="secondary" to="/websites/:default?tabId=default">Open websites</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card hover to="/settings">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="">
                  Add new videos, change theme colors and more
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2" color="secondary" to="/settings">Open settings</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="$store.getters.videosTotal==0">
        <h2>First of all add videos in settings</h2>
        <v-btn class="ma-2" color="secondary" to="/settings">Open settings</v-btn>
      </div>
    </v-container>

    <div v-show="$store.getters.navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>

<script>
const path = require('path')
const fs = require('fs')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import VueApexCharts from 'vue-apexcharts'
import scanMeta from '@/components/pages/settings/VideoMetaFix'

export default {
  name: 'HomePage',
  components: {
    vuescroll,
    apexchart: VueApexCharts,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: ()=>({
    dialogFixVideos: false,
    fixingVideos: false,
    errorFixVideos: [],
    seriesTags: [],
    seriesWebsites: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    logoPath() {
      return path.join(__static, '/icons/icon.png')
    },
    recentVideos() {
      let qnt = this.$store.state.quantityRecentVideos
      return this.$store.getters.videos
        .orderBy('date', ['desc'])
        .take(qnt)
        .value()
    },
    topPerformers() {
      let qnt = this.$store.state.quantityRecentVideos
      return this.$store.getters.performers
        .orderBy('rating', ['desc'])
        .take(qnt)
        .value()
    },
    topTags() {
      return this.$store.getters.tags.orderBy(['videos'], ['desc']).value().slice(0,9)
    },
    chartOptionsTags(){
      let chartOptions = {
        labels: [], // push here name of tag
        colors: [], // push here colors of tag
        stroke: {
          width: 1
        },
        legend: {
          labels: {
            colors: '#909090',
          },
          itemMargin: {
              horizontal: 5,
              vertical: 5
          },
          position: 'left',
          fontSize: '14px',
        }
      }
      for (const tag of this.topTags) {
        this.seriesTags.push(tag.videos)
        chartOptions.labels.push(tag.name)
        if (tag.color) {
          chartOptions.colors.push(tag.color)
        } else chartOptions.colors.push('#9b9b9b')
      }
      return chartOptions
    },
    topWebsites() {
      return this.$store.getters.websites.orderBy(['videos'], ['desc']).value().slice(0,9)
    },
    chartOptionsWebsites(){
      let chartOptions = {
        labels: [], // push here name of website
        colors: [], // push here colors of website
        stroke: {
          width: 1
        },
        legend: {
          labels: {
            colors: '#909090',
          },
          itemMargin: {
              horizontal: 5,
              vertical: 5
          },
          position: 'left',
          fontSize: '14px',
        }
      }
      for (const website of this.topWebsites) {
        this.seriesWebsites.push(website.videos)
        chartOptions.labels.push(website.name)
        if (website.color) {
          chartOptions.colors.push(website.color)
        } else chartOptions.colors.push('#9b9b9b')
      }
      return chartOptions
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    fixVideos() {
      this.dialogFixVideos = true
      this.fixingVideos = true
      setTimeout(()=>{
        const videos = this.$store.getters.videos.filter(v=>(v.resolution===undefined)).map('path').value()
        const vm = this
        async function scanVideoResolution(videos) {
          for (const video of videos) {
            let resolution = await scanMeta(video)
            if (resolution) {
              if (resolution==='error') {
                vm.errorFixVideos.unshift(video)
              } else {
                vm.$store.getters.videos.find({path: video}).assign({
                  height: undefined,
                  bitrate: undefined,
                  resolution: resolution
                }).write()
                console.log('video fixed!')
              }
            }
          }
        }
        scanVideoResolution(videos).then(()=>{
          vm.fixingVideos = false
        })
      }, 100)
    },
    getVideoThumbUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return this.checkVideoImageExist(imgPath)+'?lastmod='+Date.now()
    },
    getVideoUrl(videoId) {
      let videoPath = path.join(this.pathToUserData, `/media/previews/${videoId}.mp4`)
      return this.checkVideoExist(videoPath)+'?lastmod='+Date.now()
    },
    checkVideoImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    playVideo(pathToVideo) {
      if (!fs.existsSync(pathToVideo)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = pathToVideo
        return
      }
      shell.openItem(pathToVideo)
    },
    getPerformerImg(id) {
      let imgAvaPath = this.getPerformerImgUrl(id + '_avatar.jpg')
      let imgMainPath = this.getPerformerImgUrl(id + '_main.jpg')
      return this.checkAvatarImageExist(imgAvaPath, imgMainPath)
    },
    getPerformerImgUrl(img) {
      return  path.join(this.pathToUserData, `/media/performers/${img}`)
    },
    checkAvatarImageExist(imgAvaPath, imgMainPath) {
      if (fs.existsSync(imgAvaPath)) {
        return imgAvaPath
      } else if (fs.existsSync(imgMainPath)) {
        return imgMainPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      }
    },
    openPerformerPage(id) {
      this.$router.push(`/performer/:${id}?tabId=default`)
    },
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
  grid-template-columns: repeat(auto-fill, minmax(12%, 20%));
  .v-image {
    cursor: pointer;
  }
}
.top-performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15%, 20%));
  .v-image {
    cursor: pointer;
  }
  .v-btn {
    max-width: 90%;
    min-width: 0 !important;
  }
  .v-btn__content {
    white-space: normal;
    max-width: 100%;
    font-size: 8px;
  }
}
</style>