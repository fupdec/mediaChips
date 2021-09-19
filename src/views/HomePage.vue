<template>
  <vuescroll>
    <div class="headline text-h3 d-flex align-center justify-center py-6">
      <v-icon x-large left>mdi-home-outline</v-icon> Home </div>

    <v-container class="text-center">
      <v-row v-if="videosNumber==0">
        <v-col cols="12">
          <img alt="mediaChips" width="200" height="200" :src="logoPath">
          <h2 class="my-8">Welcome to mediaChips application!</h2>
      
          <div v-if="metaNumber==0" cols="12">
            <div class="mb-4"> First, create a meta for your videos. 
              You can view and customize the meta in the settings. </div>
            <v-btn @click="createAllMeta=true" :disabled="isAllMetaCreated" class="mb-4" color="primary" x-large rounded block>
              <v-icon left>mdi-auto-fix</v-icon> Create all meta </v-btn>
          </div>
      
          <div v-if="isAllMetaCreated&&showAdultContent" cols="12">
            <div class="mb-4"> If you plan on using the app for adult content, then this feature will come in handy. </div>
            <v-btn @click="dialogAddMetaCardsTemplate=true" class="mb-4" color="primary" x-large rounded block>
              <v-icon left>mdi-plus</v-icon> Add most popular tags, performers, websites </v-btn>
          </div>

          <div class="mb-4 mt-10">Then add videos from your computer by selecting folders.</div>
          <v-btn @click="$store.state.Settings.dialogScanVideos=true" color="primary" class="mb-6" x-large rounded block>
            <v-icon left>mdi-plus</v-icon> Add videos </v-btn>
        </v-col>
        <DialogAddMetaCardsTemplate v-if="dialogAddMetaCardsTemplate" :dialog="dialogAddMetaCardsTemplate" @finish="dialogAddMetaCardsTemplate=false"/>
      </v-row>

      <v-row v-if="videosNumber>0">
        <v-col cols="12" class="py-0 text-right">
          <v-btn @click="customization=!customization" class="mb-2" rounded color="primary"> 
            <v-icon left>mdi-cog</v-icon> {{customization?'Finish Customization':'Customize widgets'}} </v-btn>
        </v-col>

        <v-col v-if="isAllWidgetsHidden" cols="12">
          <v-alert type="info" outlined text class="ma-0">
            All widgets are hidden. Set up at least one of the widgets to show for a more attractive look
          </v-alert>
        </v-col>

        <v-col v-if="customization" cols="12">
          <v-card outlined>
            <v-card-actions>
              <div>Graph with number of videos added and edited per days</div>
              <v-spacer></v-spacer>
              <v-switch v-model="widgets.graphVideos" @change="updateWidget($event, 'graphVideos')" inset hide-details class="ma-2 pt-0"
                :append-icon="`mdi-${widgets.graphVideos?'eye':'eye-off'}`"/>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col v-if="customization||widgets.graphVideos" cols="12">
          <v-card outlined>
            <v-toolbar color="secondary">
              <div class="headline">Number of videos added and edited per days</div>
              <v-spacer></v-spacer>
              <v-btn @click="initVideosStat(daysBefore)" outlined>All time</v-btn>
              <v-btn @click="initVideosStat(30)" outlined class="ml-4">Last Month</v-btn>
              <v-btn @click="initVideosStat(7)" outlined class="ml-4">Last Week</v-btn>
            </v-toolbar>
            <apexchart type="area" height="250" class="pt-2" :options="chartOptions" :series="series"/>
          </v-card>   
        </v-col>
      
        <v-col v-if="customization" cols="12">
          <v-card outlined>
            <v-card-actions>
              <div>Total values of all videos</div>
              <v-spacer></v-spacer>
              <v-switch v-model="widgets.numberVideos" @change="updateWidget($event, 'graphVideos')" inset hide-details class="ma-2 pt-0"
                :append-icon="`mdi-${widgets.numberVideos?'eye':'eye-off'}`"/>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col v-if="customization||widgets.numberVideos" cols="12">
          <div class="d-flex flex-wrap justify-space-around">
            <v-card outlined class="pa-2">
              <v-icon>mdi-database</v-icon> Total Number of Videos:
              <b v-text="$store.getters.videosTotal"/>
            </v-card>
            <v-card outlined class="pa-2">
              <v-icon>mdi-harddisk</v-icon> Total File Size:
              <b v-text="$store.getters.videosTotalSize"/>
            </v-card>
            <v-card outlined class="pa-2">
              <v-icon>mdi-clock</v-icon> Total Duration:
              <b v-text="$store.getters.videosTotalDuration"/>
            </v-card>
          </div>
        </v-col>

        <v-col v-if="customization" cols="12">
          <v-card outlined>
            <v-card-actions>
              <div>Recently added videos</div>
              <v-spacer></v-spacer>
              <v-switch v-model="widgets.recentVideos" @change="updateWidget($event, 'graphVideos')" inset hide-details class="ma-2 pt-0"
                :append-icon="`mdi-${widgets.recentVideos?'eye':'eye-off'}`"/>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col v-if="customization||widgets.recentVideos" cols="12">
          <v-card outlined>
            <v-toolbar color="secondary">
              <div class="headline">{{numberRecentVideos}} recently added videos</div>
              <v-spacer></v-spacer>
              <v-btn to="/videos/:default?tabId=default" draggable="false" outlined>
                <v-icon left>mdi-video</v-icon> Show All Videos</v-btn>
            </v-toolbar>
            <div class="previews-grid" @mousedown="stopSmoothScroll($event)"> 
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
          </v-card>
        </v-col>

        <v-col v-if="customization" cols="12">
          <v-card outlined>
            <v-card-actions>
              <div>Top 10 most viewed meta cards</div>
              <v-spacer></v-spacer>
              <v-switch v-model="widgets.topViewedMetaCards" @change="updateWidget($event, 'graphVideos')" inset hide-details class="ma-2 pt-0"
                :append-icon="`mdi-${widgets.topViewedMetaCards?'eye':'eye-off'}`"/>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col v-if="customization||widgets.topViewedMetaCards" cols="12">
          <v-card v-for="m in complexMetaAssignedToVideo" :key="m.id" outlined class="mb-6">
            <v-toolbar color="secondary">
              <div class="headline"> Top 10 Most Viewed {{getMeta(m.id).settings.name}} </div>
              <v-spacer></v-spacer>
              <v-btn :to="`/meta/?metaId=${m.id}&tabId=default`" draggable="false" outlined>
                <v-icon left>mdi-{{getMeta(m.id).settings.icon}}</v-icon> Show All {{getMeta(m.id).settings.name}}</v-btn>
            </v-toolbar>
            <div class="previews-grid">
              <v-card v-for="mc in getTopMetaCards(m.id)" :key="mc.id" outlined hover
                @mousedown="stopSmoothScroll($event)"
                @click="openMetaCardPage(m.id,mc.id)" 
                @click.middle="addNewTabMetaCard(m.id,mc.id,mc.meta.name)">
                <div class="pa-1">
                  <v-avatar width="100" height="100" class="profile-avatar">
                    <img :src="getImgMetaCard(m.id,mc.id)">
                  </v-avatar>
                </div>
                <div class="caption px-1">{{mc.meta.name}} <b>{{mc.views||0}}</b></div>
              </v-card>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-btn @click="customization=!customization" class="mb-4" x-large block rounded color="primary"> 
            <v-icon left>mdi-cog</v-icon> {{customization?'Finish Customization':'Customize widgets'}} </v-btn>
        </v-col>
      </v-row>

      <div v-if="$store.state.Settings.videosTotal==0">
        <h2>First of all add videos in settings</h2>
        <v-btn class="ma-2" color="secondary" to="/settings" draggable="false">Open settings</v-btn>
      </div>
    </v-container>

    <CreateAllMeta v-if="createAllMeta" :dialog="createAllMeta" @finish="finishCreationAllMeta" @close="createAllMeta=false"/>

    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
  </vuescroll>
</template>

<script>
const path = require('path')
const fs = require('fs')
const shell = require('electron').shell

import vuescroll from 'vuescroll'
import LabelFunctions from '@/mixins/LabelFunctions'
import { ipcRenderer } from 'electron'
import MetaGetters from '@/mixins/MetaGetters'
import VueApexCharts from 'vue-apexcharts'

export default {
  name: 'HomePage',
  components: {
    vuescroll,
    apexchart: VueApexCharts,
    CreateAllMeta: () => import("@/components/pages/meta/CreateAllMeta.vue"),
    DialogAddMetaCardsTemplate: () => import("@/components/pages/meta/DialogAddMetaCardsTemplate.vue"),
  },
  mixins: [LabelFunctions, MetaGetters], 
  beforeMount() {
    this.initWidgets()
    this.initVideosStat(7)
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: ()=>({
    isScrollToTopVisible: false,
    createAllMeta: false,
    isAllMetaCreated: false,
    // stats
    numberRecentVideos: 20,
    customization: false,
    series: [],
    chartOptions: {},
    dialogAddMetaCardsTemplate: false,
  }),
  computed: {
    settings() { return this.$store.getters.settings.value() },
    recentVideos() { return this.$store.getters.videos.orderBy('date', ['desc']).take(this.numberRecentVideos).value() },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    logoPath() { return path.join('file://', __static, '/icons/icon.png') },
    videosNumber() { return this.$store.getters.videos.value().length },
    metaNumber() { return this.$store.getters.meta.filter(i=>i.type!=='specific').value().length },
    complexMetaAssignedToVideo() { return this.$store.getters.settings.get('metaAssignedToVideos').filter({type:'complex'}).value() },
    daysBefore() { 
      let v = this.$store.getters.videos.orderBy(i=>i.date, ['asc']).take(1).value()
      if (v.length) return Math.floor((Date.now() - v[0].date)/(60*60*1000*24))
      else return 7
    },
    darkMode() { return this.$store.state.Settings.darkMode },
    widgets: {
      get() { return this.$store.state.Settings.widgets },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'widgets', value}) },
    },
    isAllWidgetsHidden() {
      let allHidden = true
      for (let widget in this.widgets) if (this.widgets[widget]===true) allHidden = false
      return allHidden 
    },
    showAdultContent() { return this.$store.state.Settings.showAdultContent },
  },
  methods: {
    initVideosStat(days) {
      let today = new Date()
      let numAdded = []
      let numEdited = []
      let dates = []
      for (let i = 0; i < days; i++) {
        let ms = new Date().setDate(today.getDate()-i)
        let start = new Date(ms)
        let end = new Date(ms)
        start.setHours(0,0,0,0)
        dates.push(start.getTime() - start.getTimezoneOffset() * 60 * 1000)
        start = start.getTime()
        end.setHours(23,59,59,999)
        end = end.getTime()
        let added = this.$store.getters.videos.filter(v=>v.date>=start&&v.date<=end).value()
        let edited = this.$store.getters.videos.filter(v=>v.edit>=start&&v.edit<=end).value()
        numAdded.push(added.length)
        numEdited.push(edited.length)
      }
      
      this.series = [{name:'Added',data:numAdded},{name:'Edited',data:numEdited}]
      this.chartOptions = {
        theme: { mode: this.darkMode ? "dark" : "light"},
        colors:['#00d838', '#1e79e9'],
        dataLabels: { enabled: false },
        xaxis: { type: 'datetime', categories: dates },
      }
    },
    initWidgets() {
      let defaultWidgets = {
        graphVideos: true,
        numberVideos: true,
        recentVideos: true,
        topViewedMetaCards: true,
      }
      this.widgets = {...defaultWidgets, ...this.widgets}
    },
    updateWidget(value, widgetName) { this.widgets = {...this.widgets, ...{[widgetName]: value}} },
    stopSmoothScroll(event) {
      if(event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getTopMetaCards(metaId) { return this.$store.getters.metaCards.filter({metaId}).orderBy(i=>i.views||0, ['desc']).take(10).value() },
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
    finishCreationAllMeta() {
      this.createAllMeta = false
      this.isAllMetaCreated = true
    },
    getImgMetaCard(metaId, cardId) {
      let imgPath = path.join(this.pathToUserData, '/media/meta/', `${metaId}/${cardId}_avatar.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      imgPath = path.join(this.pathToUserData, '/media/meta/', `${metaId}/${cardId}_main.jpg`)
      if (fs.existsSync(imgPath)) return 'file://' + imgPath
      else return 'file://' + path.join(__static, '/img/default.jpg')
    },
    openMetaCardPage(metaId, metaCardId) { this.$router.push(`/metacard/?metaId=${metaId}&cardId=${metaCardId}&tabId=default`) },
    addNewTabMetaCard(metaId, metaCardId, metaCardName) {
      let tabId = metaCardId
      let tabName = metaCardName
      let meta = this.getMeta(metaId)

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with ${meta.settings.nameSingular.toLowerCase()} "${tabName}" already exists`
        })
        return
      }

      let tab = {
        name: tabName,
        link: `/metacard/?metaId=${meta.id}&cardId=${tabId}&tabId=${tabId}`,
        id: tabId,
        icon: meta.settings.icon
      }
      this.$store.dispatch('addNewTab', tab)
    },
    openLink(link) { shell.openExternal(link) },
  },
  watch: {
    darkMode() { setTimeout(() => { this.initVideosStat(7) }, 3000) },
  }
}
</script>

<style lang="less">
.error-fix {
  font-size: 10px;
  user-select: text;
}
.previews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10%, 10%));
  .v-image {
    cursor: pointer;
  }
  .profile-avatar {
    img {
      height: auto;
      border-radius: 0;
      position: absolute;
      top: 0;
    }
    position: relative;
  }
}
</style>