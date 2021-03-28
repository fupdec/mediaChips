<template>
  <v-dialog v-model="$store.state.Playlists.dialogEditPlaylist" scrollable persistent width="1200">
    <v-card>
      <v-card-title class="edit-card-title py-2">
        <div class="pl-4">
          <div class="font-weight-light headline body-1">Editing the playlist</div>
          <div class="font-weight-bold headline">{{playlist.name}} 
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon right @click="copyPlaylistNameToClipboard"
                  size="16" v-on="on" color="grey">mdi-content-copy</v-icon>
              </template>
              <span>Copy name to clipboard</span>
            </v-tooltip>
          </div> 
        </div>
        <v-spacer></v-spacer>
        <div>
          <v-btn outlined dark class="mr-6" @click="close">Cancel</v-btn>
          <v-btn 
            :disabled="!valid" color="primary" @click="savePlaylistInfo"
          ><v-icon left>mdi-content-save-outline</v-icon>Save</v-btn>
        </div>
      </v-card-title>

      <vuescroll>
        <v-card-text>
          <v-container fluid class="py-0">
            <v-row>
              <v-col cols="12" class="py-0 d-flex justify-space-between">
                <v-chip label outlined class="mr-4">
                  <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
                </v-chip>
                <v-chip label outlined>
                  <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
                </v-chip>
              </v-col>
              <v-col cols="12" sm="9" align="center" justify="center">
                <div>Playlist name</div>
                <div v-show="isPlaylistWatchLater" class="overline pt-4">Name is not editable</div>
                <v-form v-show="!isPlaylistWatchLater" ref="form" v-model="valid">
                  <div class="editable-text-field">
                    <v-tooltip bottom v-if="isPlaylistNameEditEnabled">
                      <template v-slot:activator="{ on }">
                        <v-icon left @click="isPlaylistNameEditEnabled=!isPlaylistNameEditEnabled" 
                          v-on="on">mdi-close</v-icon>
                      </template>
                      <span>Keep the old name</span>
                    </v-tooltip>
                    <v-tooltip bottom v-else>
                      <template v-slot:activator="{ on }">
                        <v-icon left @click="isPlaylistNameEditEnabled=!isPlaylistNameEditEnabled" 
                          v-on="on">mdi-pencil</v-icon>
                      </template>
                      <span>Edit name</span>
                    </v-tooltip>
                    <v-text-field v-model="playlistName" :disabled="!isPlaylistNameEditEnabled"
                      :rules="[getNameRules]" validate-on-blur class="rename-playlist-field" 
                      hint='The name may include letters, numbers, symbols: \/%"<>{}[]'/>
                  </div>
                </v-form>
              </v-col>
              <v-col cols="12" sm="3" align="center" justify="center">
                <div>Favorite</div>
                <v-btn @click="favorite=!favorite" x-large icon class="mt-3">
                  <v-icon v-if="favorite" color="pink">mdi-heart</v-icon>
                  <v-icon v-else color="grey">mdi-heart-outline</v-icon>
                </v-btn>
              </v-col>
              <v-col cols="12" class="pt-0">
                <div class="overline text-center mb-4">Videos</div>
                <draggable v-model="videosList" v-bind="dragOptions" @start="drag=true" @end="drag=false">
                  <transition-group type="transition" :name="!drag ? 'flip-tabs' : null" class="thumbs-grid">
                    <v-card v-for="(video, i) in videosList" :key="video.id" >
                      <v-badge class="position" color="primary" :content="i+1"/>
                      <v-btn @mouseup="remove(video.id)" color="#ff2323" class="delete"
                         dark fab x-small width="24" height="24" title="Remove">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                      <v-img :src="getImgUrl(video.id)" :aspect-ratio="16/9"/>
                      <v-card-title class="py-1 px-2">{{getFileName(video.path)}}
                      </v-card-title>
                    </v-card>
                  </transition-group>
                </draggable>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>

<script>
const { clipboard } = require('electron')
const fs = require("fs")
const path = require("path")

import vuescroll from 'vuescroll'
import draggable from 'vuedraggable'

export default {
  name: "DialogEditPlaylist",
  components: {
    vuescroll,
    draggable,
	},
  mounted () {
    this.$nextTick(function () {
      this.favorite = this.playlist.favorite
      this.playlistName = this.playlist.name
      this.videosList = _.cloneDeep(this.videos)
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    isPlaylistNameEditEnabled: false,
    playlistName: '',
    favorite: null,
    valid: false,
    drag: false,
    dragOptions: {
      animation: 300,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
    videosList: [],
  }),
  computed: {
    playlist() {
      let ids = this.$store.getters.getSelectedPlaylists
      let playlists = this.$store.getters.playlists
      if (this.$route.path.includes('/playlist/:')) {
        let playlistId = this.$router.currentRoute.params.id.substring(1)
        return playlists.find({ id: playlistId }).value()
      } else if (ids.length>0) {
        return playlists.find({id:ids[0]}).value()
      } else {
        return playlists.find('id').value()
      }
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    dateAdded() {
      let date = new Date(this.playlist.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.playlist.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    videos() {
      let videos = this.$store.getters.videos.filter(v=>(this.playlist.videos.includes(v.id))).value()
      return _.sortBy(videos, (video) => {
        let index = _.indexOf(this.playlist.videos, video.id)
        return (index === -1) ? this.playlist.videos.length : index;
      })
    },
    isPlaylistWatchLater() {
      return this.playlist.name === 'Watch later'
    },
  },
  methods: {
    close() {
      this.$store.state.Playlists.dialogEditPlaylist = false
    },
    validate() {
      this.$refs.form.validate()
    },
    getNameRules(name) {
      let duplicate = this.$store.getters.playlists.find({name:name}).value()
      if (name.length > 100) {
        return 'Name must be less than 100 characters'
      } else if (name.length < 2 && name.length > 0) {
        return 'Name must be more than 1 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.id!==this.playlist.id) {
        return 'Playlist with that name already exists'
      } else {
        return true
      }
    },
    savePlaylistInfo() {
      this.validate()
      if (this.playlistName) {
        this.playlistName = this.playlistName.trim()
        this.playlistName = this.playlistName.replace(/[\\\/\%"<>{}\[\]]/g, '')
      }

      this.$store.getters.playlists
        .find({ id: this.playlist.id })
        .assign({
          name: this.playlistName,
          favorite: this.favorite,
          edit: Date.now(),
          videos: _.cloneDeep(this.videosList.map(video=>(video.id))),
        }).write()
      this.$store.state.Playlists.dialogEditPlaylist = false
      this.$store.commit('updatePlaylists')
      this.$store.dispatch('filterPlaylists', true)
    },
    copyPlaylistNameToClipboard() {
      let playlistName = this.playlist.name
      clipboard.writeText(playlistName)
    },
    getImgUrl(videoId) {
      let imgPath = path.join(this.pathToUserData, `/media/thumbs/${videoId}.jpg`)
      return 'file://' + this.checkImageExist(imgPath)
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        this.errorThumb = true
        return path.join(this.pathToUserData, '/img/templates/thumb.jpg')
      }
    },
    getFileName(videoPath) {
      return path.parse(videoPath).name
    },
    remove(videoId) {
      this.videosList = _.filter(this.videosList, video=>(video.id!==videoId))
    },
  },
}
</script>

<style lang="less">
.thumbs-grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  .position {
    position: absolute;
    left: 0;
    top: 8px;
    z-index: 1;
  }
  .delete {
    position: absolute;
    right: 5px;
    bottom: 5px;
    z-index: 1;
  }
  .v-image {
    border-radius: 4px 4px 0 0;
  } 
  .v-card__title {
    font-size: 10px;
    line-height: 1.3;
  }
}
.edit-playlist-dialog-title {
  display: flex;
  flex-wrap: wrap;
}
.edit-playlist-dialog-title .headline {
  margin-right: 50px;
}
</style>