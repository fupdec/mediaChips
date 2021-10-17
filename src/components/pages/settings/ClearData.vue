<template>   
  <div class="d-inline-flex">
    <v-btn @click="openDialogConfirmClearing" class="ma-2" rounded :color="dataType=='data'?'error':'primary'">
      <v-icon left>mdi-delete</v-icon> {{btnText}} </v-btn>
    <v-dialog v-if="dialogConfirmClearData" v-model="dialogConfirmClearData" max-width="520" persistent>
      <v-card>
        <v-toolbar color="error">
          <div class="headline">Are you sure?</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogConfirmClearData=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="clearDB(dataType, dataName)" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div class="red--text">
            This will <span class="text-uppercase">delete all {{dataName}}</span> from the database!
            <br>Make a backup before deleting.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogResult" max-width="300">
      <v-card>
        <p class="headline text-center pt-6">{{dataName}} cleared!</p>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="ma-4" outlined @click="dialogResult=false">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-if="dialogConfirmClearImages" v-model="dialogConfirmClearImages" max-width="520" persistent>
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Are you sure?</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogConfirmClearImages=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="clearDB(dataType, dataName)" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="info" class="py-4">mdi-information-outline</v-icon>
          <div>This will delete all generated {{dataName}} images of videos. <br> They will be automatically recreated when needed.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const fs = require('fs-extra')
const path = require("path")
const rimraf = require("rimraf")
const { ipcRenderer } = require('electron')

import SpecificMeta from '@/components/elements/SpecificMeta'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'ClearData',
  props: {
    dataType: String,
    dataName: String,
    btnText: String,
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogConfirmClearData: false,
    dialogConfirmClearImages: false,
    dialogResult: false,
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    clearDB(dataType, dataName) {
      if (dataName=='videos' && dataType=='data') this.clearVideosDb()
      else if (dataName=='meta' && dataType=='data') this.clearMetaDb()
      else if (dataName=='saved filters' && dataType=='data') this.clearSavedFiltersDb()
      else if (dataName=='markers' && dataType=='data') this.clearMarkersDb()
      else if (['timelines','grids','markers'].includes(dataName) && dataType=='images') this.clearImages(dataName)
      if (dataType=='data') this.$store.commit('addLog', { type: 'info', text: `All ${dataName} was cleared 🗑️` })
      else if (dataType=='images') this.$store.commit('addLog', { type: 'info', text: `All ${dataName} images was cleared 🗑️` })
      this.dialogConfirmClearData = false
      this.dialogResult = true
    },
    clearVideosDb() {
      this.clearMarkersDb() // clear markers
      this.$store.getters.videosDatabase.set('videos', []).write()
      this.$store.getters.playlists.each(i => i.videos = []).write()
      this.clearFiles(path.join(this.pathToUserData, '/media/thumbs/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/grids/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/timelines/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      this.$store.getters.savedFilters.set('videos', []).write() // delete saved filters
      this.$store.dispatch('updateSavedFilters') // update saved filters
      ipcRenderer.send('updatePlayerDb', 'videos') // update markers in player window
      ipcRenderer.send('closePlayer') // stop playing video in separated window
      this.$store.commit('updateVideos', [])
      this.$store.getters.settings.get('tabs').remove(i=>i.link.includes('videos')).write() // close tabs
      this.$store.commit('updateSettingsState', 'tabs') // update tabs
    },
    clearMetaDb() {
      this.$store.getters.markers.filter(i=>i.type!=='favorite'&&i.type!=='bookmark').each(marker=>{
          marker.type = 'bookmark'
          let markerName = this.getCard(marker.name)
          if (markerName) marker.name = markerName.meta.name
          else marker.name = ''
        }).write() // delete type for markers
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
      this.$store.getters.tabsDb.filter(tab => tab.link.includes('/meta')) // close tabs with meta type
        .each(tab => this.$store.dispatch('closeTab', tab.id)).value()
      this.$store.getters.dbMeta.set('meta', [...SpecificMeta]).set('cards', []).write() // clear meta db
      let metaInVideos = this.$store.getters.settings.get('metaAssignedToVideos').map('id').value()
      for (let id of metaInVideos) {
        this.$store.getters.settings.get('videoFilters').remove({by:id}).write() // remove from video filters
        this.$store.getters.videos.each(v=>{delete v[id]}).write() // remove from all videos
        this.$store.getters.settings.get('tabs').each(tab=>{
          tab.filters = _.filter(tab.filters, i=>i.by!==id)
        }).write() // remove from tab's filters
      }
      this.$store.dispatch('updateSettingsState', {key:'metaAssignedToVideos',value:[]}) // update assigned to video
      this.$store.dispatch('updateSettingsState', {key:'videoVisibility',value:{}}) // update visibile meta in video
      this.clearFiles(path.join(this.pathToUserData, '/media/meta/'))
      let metaIds = this.$store.getters.meta.filter({type:'complex'}).map('id').value()
      for (let id in metaIds) this.$store.getters.savedFilters.unset(metaIds[id]).write() // delete from saved filters
      this.$store.dispatch('updateSavedFilters')
      ipcRenderer.send('updatePlayerDb', 'meta') // update db in player window
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update db in player window
      this.$store.commit('updateComplexMetaListFromDb')
      this.$store.commit('updateSimpleMetaListFromDb')
    },
    clearSavedFiltersDb() {
      let complexMeta = this.$store.getters.meta.filter({type:'complex'}).value()
      let savedFilters = { videos: [], playlists: [] }
      for (let m of complexMeta) savedFilters[m.id] = []
      this.$store.getters.savedFiltersDatabase.set('savedFilters', savedFilters).write()
      this.$store.dispatch('updateSavedFilters')
    },
    clearMarkersDb() {
      this.$store.getters.markersDatabase.set('markers', []).write()
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
    },
    clearFiles(directory) {
      rimraf(directory, () => { if (!fs.existsSync(directory)) fs.mkdirSync(directory) }) // remove folder with images
    },
    openDialogConfirmClearing() {
      if (this.dataType=='data') this.dialogConfirmClearData = true
      else if (this.dataType=='images') this.dialogConfirmClearImages = true
    },
    clearImages(type) {
      this.clearFiles(path.join(this.pathToUserData, `/media/${type}/`))
      this.dialogConfirmClearImages = false
      this.dialogResult = true
    },
  },
}
</script>