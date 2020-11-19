<template>   
  <div class="clear-db-btn">
    <v-btn @click.stop="dialogConfirmClearAllFiles = true" class="ma-2" depressed dark color="red">
      <v-icon left>mdi-delete-alert</v-icon>{{nameDB}}
    </v-btn>
    <v-dialog v-model="dialogConfirmClearAllFiles" max-width="520">
      <v-card>
        <v-card-title class="headline">Are you sure?</v-card-title>
        <v-card-text class="text-center">
          <v-icon size="60" color="red">mdi-alert</v-icon> 
        </v-card-text>
        <v-card-text class="text-center">
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
      if (db === "videos") {
        this.$store.getters.videosDataBase
          .set('videos', [])
          .write()
        this.clearFiles(path.join(this.pathToUserData, '/media/thumbs/'))
        this.clearFiles(path.join(this.pathToUserData, '/media/previews/'))
        this.$store.commit('updateVideos')
        // TODO: make reactive update after clear
        this.$store.dispatch('setNotification', {
          type: 'info',
          text: 'Videos was cleared'
        })
      }
      if (db === "performers") {
        this.$store.getters.performersDataBase
          .set('performers', [])
          .write()
        this.$store.getters.videos
          .each((videos) => videos.performers = [])
          .write()
        this.clearFiles(path.join(this.pathToUserData, '/media/performers/'))
        this.$store.commit('updatePerformers')
        this.$store.dispatch('setNotification', {
          type: 'info',
          text: 'Performers was cleared'
        })
      }
      if (db === "tags") {
        this.$store.getters.tagsDataBase
          .set('tags', [])
          .write()
        this.$store.getters.videos
          .each((video) => video.tags = [])
          .write()
        this.$store.getters.performers
          .each((performer) => performer.tags = [])
          .write()
        this.clearFiles(path.join(this.pathToUserData, '/media/tags/'))
        this.$store.commit('updateTags')
        this.$store.dispatch('setNotification', {
          type: 'info',
          text: 'Tags was cleared'
        })
      }
      if (db === "websites") {
        this.$store.getters.websitesDataBase
          .set('websites', [])
          .write()
        this.$store.getters.videos
          .each((video) => video.website = '')
          .write()
        this.clearFiles(path.join(this.pathToUserData, '/media/websites/'))
        this.$store.commit('updateWebsites')
        this.$store.dispatch('setNotification', {
          type: 'info',
          text: 'Websites was cleared'
        })
      }
      if (db === "bookmarks") {
        this.$store.getters.bookmarksDataBase
          .set('bookmarks', {
            videos: [],
            performers: [],
            tags: [],
            websites: [],
            markers: [],
          })
          .write()
        this.$store.getters.videos
          .each((video) => video.bookmark = false)
          .write()
        this.$store.getters.performers
          .each((performer) => performer.bookmark = false)
          .write()
        this.$store.getters.tags
          .each((tag) => tag.bookmark = false)
          .write()
        this.$store.getters.websites
          .each((website) => website.bookmark = false)
          .write()
        this.$store.dispatch('setNotification', {
          type: 'info',
          text: 'Bookmarks was cleared'
        })
      }
      this.dialogConfirmClearAllFiles = false
      this.dialogDatabaseCleared = true
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