<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-home-outline</v-icon> Home </div>

    <v-dialog v-model="dialogMigration" scrollable fullscreen persistent no-click-animation>
      <v-card>
        <v-card-text class="pt-10">
          <div class="mb-4">
            <h1 class="mb-4">New meta system</h1>
            Meta is data that you can add to videos and other meta cards.<br>
            There are two types of meta: <b>complex</b> and <b>simple</b>.<br>
            <b>Complex </b>meta have their own page. Which have meta cards. All this can be flexibly configured to suit your needs.<br>
            <b>Simple </b>meta has neither page nor cards. But you can also customize them. For now, you can add: string, number, array, boolean, and date. <br>
            <h3 class="mt-6">New features with meta:</h3><br>
            <li>Editing multiple cards.</li>
            <li>Customizing visiblity of all meta in card.</li>
            <li>Any color for meta card.</li>
            <li>Different types of visual for chips.</li>
            <li>Markers in built-in player with any of complex meta.</li>
            <li>Parsing data for videos by any of complex meta.</li>
            <li>Custom name. icon, hint for textfield.</li>
            <li>Transfering simple meta with type "array" to complex meta.</li>
            <li>Show/hide in navigation menu.</li>
            <li>Nested view (not completed yet).</li>

            <h3 class="mt-6">A small part of features are not yet available. Will be available in the next release:</h3><br>
            <li>The website page as it used to be. But you can also open the website page and see all the videos associated with it. Now it looks the same as the performer page did before.</li>
            <li>Tag meter for performers. Needs rethinking.</li>
            <li>Child websites. There will be a complete system of child and parent websites with an infinite number of levels.</li>
            <li>Opening URL links of the website.</li>
            <li>Copy name of card to clipboard from context menu.</li>
            <li>Managing data for videos from context menu (copy/paste tags, performers, websites).</li>
            <li>Sort list with items in editing dialog.</li>
            <li>Disable chip colors for cards.</li>
            <li>Compact view of cards.</li>
            <li>Home page statistics.</li>
            <li>Career status for performers.</li>
            <li>Chips with fast filtration by tags and websites on performer page.</li>
          </div>

          <v-alert type="warning" text outlined>Starting from version 0.9.0 of the application, 
            all information that the user fills in for the video will use the new meta system. <br>
            To transfer your information and continue using the application,
            migrate to the new meta system. <br>
            If you want to use all the old features, please wait for the next release. 
            Or install an older version of the application (0.8.2).</v-alert>
            
          <v-btn @click="migrateToMeta=true" class="mb-4" color="warning" block x-large rounded>
            <v-icon left>mdi-firework</v-icon> Start migration to the New meta system</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-container class="text-center">
      <v-row>
        <v-col v-if="$store.getters.videosTotal==0" cols="12">
          <img alt="AMDB" width="200" height="200" :src="logoPath">
          <h2 class="my-8">Welcome to Adult Video Database application!</h2>
      
          <div v-if="metaNumber==0&&!isContentExists" cols="12">
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

      <v-row v-if="$store.getters.videosTotal>0">
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
              <v-btn class="ma-2 pr-4" color="secondary" to="/videos/:default?tabId=default" draggable="false" outlined rounded>
                <v-icon left>mdi-video</v-icon> Open Videos</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- <v-col cols="12">
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
        </v-col> -->

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

    <MigrateToMeta v-if="migrateToMeta" :dialog="migrateToMeta" @finish="migrateToMeta=false"/>
    <CreateAllMeta v-if="createAllMeta" :dialog="createAllMeta" @finish="closeDialogCreateAllMeta"/>

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
    MigrateToMeta: () => import("@/components/pages/meta/MigrateToMeta.vue"),
    CreateAllMeta: () => import("@/components/pages/meta/CreateAllMeta.vue"),
  },
  mixins: [LabelFunctions], 
  mounted() {
    this.$nextTick(function () {
      if (!this.isMigratedToMeta&&this.isContentExists) this.dialogMigration = true
    })
  },
  data: ()=>({
    seriesTags: [],
    seriesWebsites: [],
    isScrollToTopVisible: false,
    migrateToMeta: false,
    createAllMeta: false,
    isAllMetaCreated: false,
    dialogMigration: false,
  }),
  computed: {
    settings() { return this.$store.getters.settings.value() },
    previewsNumber() { return this.$store.state.quantityRecentVideos },
    recentVideos() { return this.$store.getters.videos.orderBy('date', ['desc']).take(this.previewsNumber).value() },
    topPerformers() { return this.$store.getters.performers.orderBy('rating', ['desc']).take(this.previewsNumber).value() },
    topViewedPerformers() { return this.$store.getters.performers.orderBy('name', ['asc']).orderBy('views', ['desc']).take(this.previewsNumber).value() },
    topTags() { return this.$store.getters.tags.orderBy(['videos'], ['desc']).value().slice(0,9) },
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
        if (tag.color) chartOptions.colors.push(tag.color)
        else chartOptions.colors.push('#9b9b9b')
      }
      return chartOptions
    },
    topWebsites() { return this.$store.getters.websites.orderBy(['videos'], ['desc']).value().slice(0,9) },
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
    pathToUserData() { return this.$store.getters.getPathToUserData },
    logoPath() { return path.join('file://', __static, '/icons/icon.png') },
    isMigratedToMeta() { 
      let metaVersion = '0.9.0'
      let currentVersion = this.$store.state.Settings.databaseVersion || '0.8.2'
      if (currentVersion==='0.9.0') this.$store.dispatch('updateSettingsState', {key:'databaseVersion', value:'0.9.2'})
      metaVersion = metaVersion.split('.').map( s => s.padStart(10) ).join('.')
      currentVersion = currentVersion.split('.').map( s => s.padStart(10) ).join('.')
      return currentVersion >= metaVersion
    },
    isContentExists() { return this.videosNumber>0 || this.performersNumber>0 || this.tagsNumber>0 || this.websitesNumber>0 },
    videosNumber() { return this.$store.getters.videos.value().length },
    performersNumber() { return this.$store.getters.performers.value().length },
    tagsNumber() { return this.$store.getters.tags.value().length },
    websitesNumber() { return this.$store.getters.websites.value().length },
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
    // getPerformerImg(id) {
    //   let imgAvaPath = this.getPerformerImgUrl(id + '_avatar.jpg')
    //   let imgMainPath = this.getPerformerImgUrl(id + '_main.jpg')
    //   return 'file://' + this.checkAvatarImageExist(imgAvaPath, imgMainPath)
    // },
    // getPerformerImgUrl(img) {
    //   return path.join(this.pathToUserData, `/media/performers/${img}`)
    // },
    // checkAvatarImageExist(imgAvaPath, imgMainPath) {
    //   if (fs.existsSync(imgAvaPath)) return imgAvaPath
    //   else if (fs.existsSync(imgMainPath)) return imgMainPath
    //   else return path.join(this.pathToUserData, '/img/templates/performer.png')
    // },
    // openPerformerPage(id) { this.$router.push(`/performer/:${id}?tabId=default`) },
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