<template>   
  <div class="clear-db-btn">
    <v-btn @click.stop="dialogConfirmClearAllFiles = true" class="ma-2" depressed dark color="red">
      <v-icon left>mdi-delete-alert</v-icon>{{nameDB}}
    </v-btn>
    <v-dialog v-model="dialogConfirmClearAllFiles" max-width="520">
      <v-card>
        <v-card-title class="headline red--text">Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete-alert</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="text-center mt-6">
          <v-icon size="60" color="red">mdi-alert</v-icon> 
        </v-card-text>
        <v-card-text class="text-center red--text">
          This will <span class="text-uppercase">delete all {{nameDB}}</span> from the database!
          <br>Before deleting, make a backup and if you are ready then press 
          the <br><span class="text-uppercase">red button</span>. 
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogConfirmClearAllFiles=false" class="ma-4"> Cancel </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="clearDB(nameDB)" color="error" class="ma-4">
            <v-icon size="20" left>mdi-alert-circle-outline</v-icon>Delete</v-btn>
        </v-card-actions>
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
const { ipcRenderer } = require('electron')

export default {
  name: 'ClearDatabases',
  props: {
    typeOfDB: String
  },
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
    clearDB(db) {
      switch (db) {
        case 'videos': this.clearVideosDb()
          break
        case 'performers': this.clearPerformersDb()
          break
        case 'tags': this.clearTagsDb()
          break
        case 'websites': this.clearWebsitesDb()
          break
        case 'bookmarks': this.clearBookmarksDb()
          break
        case 'saved filters': this.clearSavedFiltersDb()
          break
        case 'markers': this.clearMarkersDb()
          break
      }
      this.$store.dispatch('setNotification', {
        type: 'info',
        text: `${db} was cleared`
      })
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
      this.$store.getters.bookmarks.set('videos', []).write() // clear bookmarks
      this.clearFiles(path.join(this.pathToUserData, '/media/thumbs/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/previews/'))
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      ipcRenderer.send('updatePlayerDb', 'videos') // update markers in player window
      ipcRenderer.send('closePlayer') // stop playing video in separated window
      this.$store.commit('updateVideos')
    },
    clearPerformersDb() {
      this.$store.getters.performersDatabase.set('performers', []).write()
      this.$store.getters.videos.each(i => i.performers = []).write()
      this.$store.getters.tags.each(i => i.performers = []).write()
      this.$store.getters.websites.each(i => i.performers = []).write()
      this.$store.getters.bookmarks.set('performers', []).write() // clear bookmarks
      // change type for markers
      let markers = this.$store.getters.markers.filter(marker => marker.type == 'performer')
      if (markers.value().length) markers.each(marker => marker.type = 'bookmark').write()
      this.clearFiles(path.join(this.pathToUserData, '/media/performers/'))
      // close tabs with performer type
      this.$store.getters.tabsDb.filter(tab => tab.link.includes('performer'))
        .each(tab => this.$store.dispatch('closeTab', tab.id)).value()
      ipcRenderer.send('updatePlayerDb', 'performers') // update markers in player window
      this.$store.commit('updatePerformers')
    },
    clearTagsDb() {
      this.$store.getters.tagsDatabase.set('tags', []).write()
      this.$store.getters.videos.each(i => i.tags = []).write()
      this.$store.getters.performers.each(i => {i.tags = [], i.videoTags = []}).write()
      this.$store.getters.websites.each(i => i.videoTags = []).write()
      this.$store.getters.bookmarks.set('tags', []).write() // clear bookmarks
      this.clearFiles(path.join(this.pathToUserData, '/media/tags/'))
      // change type for markers
      let markers = this.$store.getters.markers.filter(marker => marker.type == 'tag')
      if (markers.value().length) markers.each(marker => marker.type = 'bookmark').write()
      ipcRenderer.send('updatePlayerDb', 'tags') // update tags in player window
      this.$store.commit('updateTags')
    },
    clearWebsitesDb() {
      this.$store.getters.websitesDatabase.set('websites', []).write()
      this.$store.getters.videos.each(i => i.websites = []).write()
      this.$store.getters.performers.each(i => i.websites = []).write()
      this.$store.getters.bookmarks.set('websites', []).write() // clear bookmarks
      this.clearFiles(path.join(this.pathToUserData, '/media/websites/'))
      // close tabs with website type
      this.$store.getters.tabsDb.filter(tab => tab.link.includes('website'))
        .each(tab => this.$store.dispatch('closeTab', tab.id)).value()
      this.$store.commit('updateWebsites')
    },
    clearBookmarksDb() {
      this.$store.getters.bookmarksDatabase
        .set('bookmarks', {
          videos: [],
          performers: [],
          tags: [],
          websites: []
        }).write()
      this.$store.getters.videos.each(i => i.bookmark = false).write()
      this.$store.getters.performers.each(i => i.bookmark = false).write()
      this.$store.getters.tags.each(i => i.bookmark = false).write()
      this.$store.getters.websites.each(i => i.bookmark = false).write()
    },
    clearSavedFiltersDb() {
      this.$store.getters.filtersDatabase
        .set('savedFilters', {
          videos: [],
          performers: [],
          tags: [],
          websites: [],
          playlists: [],
        }).write()
    },
    clearMarkersDb() {
      this.$store.getters.markersDatabase.set('markers', []).write()
      this.clearFiles(path.join(this.pathToUserData, '/media/markers/'))
      ipcRenderer.send('updatePlayerDb', 'markers') // update markers in player window
    },
    clearFiles(directory) {
      fs.readdir(directory, (err, files) => {
        if (err) throw err

        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err
          })
        }
      })
    },
  },
}
</script>

<style lang="less" scoped>
.clear-db-btn {
  display: inline-flex;
}
</style>