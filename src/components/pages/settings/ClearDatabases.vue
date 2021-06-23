<template>   
  <div class="d-inline-flex">
    <v-btn @click.stop="dialogConfirmClearAllFiles = true" class="ma-2" rounded color="error">
      <v-icon left>mdi-delete-alert</v-icon> {{nameDB}} </v-btn>
    <v-dialog v-model="dialogConfirmClearAllFiles" max-width="520">
      <v-card>
        <v-toolbar color="error">
          <div class="headline">Are you sure?</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogConfirmClearAllFiles=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="clearDB(nameDB)" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div class="red--text">
            This will <span class="text-uppercase">delete all {{nameDB}}</span> from the database!
            <br>Before deleting, make a backup and if you are ready then press 
            the <br><span class="text-uppercase">red button</span>. 
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogDatabaseCleared" max-width="300">
      <v-card>
        <p class="headline text-center pt-6">Database cleared</p>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="ma-4" outlined @click="dialogDatabaseCleared=false">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
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
  name: 'ClearDatabases',
  props: {
    typeOfDB: String
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
      this.nameDB = this.typeOfDB
    })
  },
  data: () => ({
    dialogConfirmClearAllFiles: false,
    dialogDatabaseCleared: false,
    nameDB: null,
  }),
  computed: {
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
  },
  methods: {
    // TODO clear thumbs for markers and timeline. remake timline with 5%,15%,25%,35%,45%,55%,65%,75%,85%,95%,
    clearDB(db) {
      switch (db) {
        case 'videos': this.clearVideosDb(); break
        case 'meta': this.clearMetaDb(); break
        case 'saved filters': this.clearSavedFiltersDb(); break
        case 'markers': this.clearMarkersDb(); break
      }
      this.$store.commit('addLog', { type: 'info', text: `${db} was cleared` })
      this.dialogConfirmClearAllFiles = false
      this.dialogDatabaseCleared = true
    },
    clearVideosDb() {
      this.$store.getters.videosDatabase.set('videos', []).write()
      this.$store.getters.markersDatabase.set('markers', []).write() // clear markers
      this.$store.getters.performers.each(i => { i.videos = 0, i.videoTags = [], i.websites = [] }).write()
      this.$store.getters.tags.each(i => { i.videos = 0, i.performers = [], i.websites = [] }).write()
      this.$store.getters.websites.each(i => { i.videos = 0, i.performers = [], i.videoTags = [] }).write()
      this.$store.getters.playlists.each(i => i.videos = []).write()
      this.clearFiles(path.join(this.pathToUserData, '/media/thumbs/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/previews/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      ipcRenderer.send('updatePlayerDb', 'videos') // update markers in player window
      ipcRenderer.send('closePlayer') // stop playing video in separated window
      this.$store.commit('updateVideos')
    },
    clearMetaDb() {
      // delete type for markers
      let markers = this.$store.getters.markers.filter(marker => marker.type!=='favorite'&&marker.type!=='bookmark')
      if (markers.value().length) {
        markers.each(marker => {
          marker.type = 'bookmark'
          let markerName = this.getCard(marker.name)
          if (markerName) marker.name = markerName.meta.name
          else marker.name = ''
        }).write()
      }
      this.$store.getters.tabsDb.filter(tab => tab.link.includes('/meta')) // close tabs with meta type
        .each(tab => this.$store.dispatch('closeTab', tab.id)).value()
      this.$store.getters.dbMeta.set('meta', [...SpecificMeta]).set('cards', []).write() // clear meta db
      this.$store.commit('getMetaListFromDb') // update menu
      this.$store.dispatch('updateSettingsState', {key:'metaAssignedToVideos',value:[]}) // update assigned to video
      this.$store.dispatch('updateSettingsState', {key:'videoVisibility',value:{}}) // update visibile meta in video
      this.clearFiles(path.join(this.pathToUserData, '/media/meta/'))
      ipcRenderer.send('updatePlayerDb', 'meta') // update db in player window
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update db in player window
      // TODO update in saved filters, videos and other...
    },
    clearSavedFiltersDb() {
      this.$store.getters.filtersDatabase.set('savedFilters', { videos: [], playlists: [], }).write()
    },
    clearMarkersDb() {
      this.$store.getters.markersDatabase.set('markers', []).write()
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
    },
    clearFiles(directory) {
      rimraf(directory, () => { if (!fs.existsSync(directory)) fs.mkdirSync(directory) }) // remove folder with images
    },
  },
}
</script>