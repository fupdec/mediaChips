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
              <v-btn class="ma-2" color="secondary" to="/videos/:default?tabId=default" draggable="false">Open Videos</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12">
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
            <div class="top-performers-grid" @mousedown="stopSmoothScroll($event)"> 
              <v-hover v-for="perf in topPerformers" :key="perf.id">
                <template v-slot:default="{ hover }">
                  <v-img :src="getPerformerImg(perf.id)" aspect-ratio="1"
                    @click="openPerformerPage(perf.id)" position="top"
                    @click.middle="addNewTabPerformer(perf.name)"
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
            <div v-if="$store.getters.settings.get('appNewVersionUpdatePerformerViews').value()">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-subtitle class="caption">
                    Top {{$store.state.quantityRecentVideos}} most viewed performers
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <div class="top-performers-grid views" @mousedown="stopSmoothScroll($event)"> 
                <v-hover v-for="perf in topViewedPerformers" :key="perf.id">
                  <template v-slot:default="{ hover }">
                    <v-img :src="getPerformerImg(perf.id)" aspect-ratio="1"
                      @click="openPerformerPage(perf.id)" position="top"
                      @click.middle="addNewTabPerformer(perf.name)"
                    >
                      <v-fade-transition>
                        <v-overlay v-if="hover" absolute color="secondary">
                          <v-btn x-small height="auto" width="auto" class="pa-1" outlined>
                            {{perf.name}}
                          </v-btn>
                        </v-overlay>
                      </v-fade-transition>
                      <div class="views-wrapper">
                        <span><v-icon size="12" class="mr-1">mdi-eye-outline</v-icon>{{perf.views}}</span>
                      </div>
                    </v-img>
                  </template>
                </v-hover>
              </div>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn class="ma-2" color="secondary" to="/performers/:default?tabId=default" draggable="false">Open Performers</v-btn>
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
              <v-btn class="ma-2" color="secondary" to="/tags/:default?tabId=default" draggable="false">Open tags</v-btn>
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
              <v-btn class="ma-2" color="secondary" to="/websites/:default?tabId=default" draggable="false">Open websites</v-btn>
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
              <v-btn class="ma-2" color="secondary" to="/settings" draggable="false">Open settings</v-btn>
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

    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>

<script>
const path = require('path')
const fs = require('fs')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import VueApexCharts from 'vue-apexcharts'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'

export default {
  name: 'HomePage',
  components: {
    vuescroll,
    apexchart: VueApexCharts,
  },
  mixins: [LabelFunctions], 
  mounted() {
    this.$nextTick(function () {
      if (!this.$store.getters.settings.get('appNewVersionUpdatePerformerViews').value()) {
        this.$store.getters.performers.each(p => p.views = 0).write()
        this.$store.getters.settings.set('appNewVersionUpdatePerformerViews', true).write()
      } // remove this in the next version (0.7.3), added in v0.7.2

      if (!this.$store.getters.settings.get('appNewVersionUpdateWebsitesAltNames').value()) {
        this.$store.getters.websites.each(i => {i.views = 0; i.altNames = []}).write()
        this.$store.getters.videos.each(i => {i.views = 0; i.viewed = undefined}).write()
        this.$store.getters.settings.set('appNewVersionUpdateWebsitesAltNames', true).write()
      } // remove this in the next version (0.7.4), added in v0.7.3
    })
  },
  data: ()=>({
    dialogRestartApp: false,
    dialogFixVideos: false,
    fixingVideos: false,
    errorFixVideos: [],
    seriesTags: [],
    seriesWebsites: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    settings() {
      return this.$store.getters.settings.value()
    },
    logoPath() {
      return 'file://' + path.join(__static, '/icons/icon.png')
    },
    previewsNumber() {
      return this.$store.state.quantityRecentVideos
    },
    recentVideos() {
      return this.$store.getters.videos.orderBy('date', ['desc']).take(this.previewsNumber).value()
    },
    topPerformers() {
      return this.$store.getters.performers.orderBy('rating', ['desc']).take(this.previewsNumber).value()
    },
    topViewedPerformers() {
      return this.$store.getters.performers.orderBy('name', ['asc']).orderBy('views', ['desc']).take(this.previewsNumber).value()
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
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    playVideo(video) {
      if (!fs.existsSync(video.path)) {
        this.$store.state.Videos.dialogErrorPlayVideo = true
        this.$store.state.Videos.errorPlayVideoPath = video.path
        return
      }
      if (this.$store.state.Settings.playerType === '0') {
        let data = {
          videos: this.recentVideos,
          id: video.id,  
        }
        ipcRenderer.send('openPlayer', data)
      } else shell.openPath(video.path)
    },
    getPerformerImg(id) {
      let imgAvaPath = this.getPerformerImgUrl(id + '_avatar.jpg')
      let imgMainPath = this.getPerformerImgUrl(id + '_main.jpg')
      return 'file://' + this.checkAvatarImageExist(imgAvaPath, imgMainPath)
    },
    getPerformerImgUrl(img) {
      return path.join(this.pathToUserData, `/media/performers/${img}`)
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
  grid-template-columns: repeat(auto-fill, minmax(10%, 10%));
  .v-image {
    cursor: pointer;
  }
}
.top-performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10%, 10%));
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
  .theme--light {
    .views-wrapper {
      span {
        background-color: rgba(255, 255, 255, 0.6);
      }
    }
  }
  .views-wrapper {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    span {
      background-color: rgba(17, 17, 17, 0.5);
      padding-left: 3px;
      padding-right: 3px;
      border-radius: 0 3px 0 0;
      display: flex;
      font-size: 12px;
      font-weight: bold;
    }
  }
}
</style>