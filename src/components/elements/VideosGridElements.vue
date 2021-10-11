<template>
	<div>
		<v-dialog v-model="$store.state.Videos.dialogDeleteVideo" scrollable persistent max-width="800">
      <v-card>
        <v-toolbar color="error">
          <div class="headline"> Are you sure? </div>
          <v-spacer></v-spacer>
          <v-checkbox v-model="$store.state.Videos.deleteFile" class="mx-4" color=" " hide-details label="Also delete files"/>
          <v-btn @click="$store.state.Videos.dialogDeleteVideo=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteVideos" outlined> <v-icon left>mdi-check</v-icon>Yes</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>
              You want to delete video<span v-if="selectedVideosLength>1">s
              ({{selectedVideosLength}})</span>:
            </div> {{selectedVideos(true)}}
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    
		<v-dialog v-model="$store.state.Videos.dialogErrorPlayVideo" max-width="600">
      <v-card>
        <v-toolbar color="error">
          <div class="headline"> Error play video </div>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.Videos.dialogErrorPlayVideo=false" outlined> <v-icon left>mdi-close</v-icon> close </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-circle-outline</v-icon>
          <div class="red--text">The file on this path does not exist: <br>{{$store.state.Videos.errorPlayVideoPath}}</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <div v-if="$store.state.Videos.dialogEditVideoInfo">
      <DialogEditSingleVideoInfo v-if="isSelectedSingleVideo"/>
      <DialogEditMultipleVideosInfo v-if="selectedVideosLength>1"/>
    </div>

    <v-dialog v-model="$store.state.Videos.dialogAddToPlaylist" max-width="420">
      <v-card class="add-playlist">
        <v-toolbar color="primary">
          <div class="headline">Add to Playlist</div>
          <v-spacer></v-spacer>
          <v-btn @click="addToPlaylist" :disabled="typeof this.selectedPlaylist!=='number'" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text v-if="playlists.length">
            <v-list dense>
              <v-list-item-group color="primary" v-model="selectedPlaylist">
                <v-list-item v-for="(item, i) in playlists" :key="i">
                  <span>{{item.name}}</span>
                  <span>{{item.videos.length}}</span>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-text v-else class="text-center">No playlist</v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
	</div>
</template>


<script>
const path = require('path')

import Selection from "@simonwep/selection-js"
import vuescroll from 'vuescroll'

export default {
  name: 'VideosGridElements',
  components: {
    vuescroll,
    DialogEditSingleVideoInfo: () => import('@/components/pages/videos/DialogEditSingleVideoInfo.vue'),
    DialogEditMultipleVideosInfo: () => import('@/components/pages/videos/DialogEditMultipleVideosInfo.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initSelection()
    })
  },
  destroyed() {
    this.$store.state.Videos.selection.destroy()
  },
  data: () => ({
    selectedPlaylist: null,
  }),
  computed: {
    selectedVideosLength() { return this.$store.getters.getSelectedVideos.length },
    selectedVideosPaths() {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        let paths = ids.map(i => (vids.find({id:i}).value().path))
        return paths.join(', ')
      } else return ''
    },
    isSelectedSingleVideo() { return this.$store.getters.getSelectedVideos.length == 1 },
    playlists() { return this.$store.getters.playlists.filter(list=>(list.name!='Watch later')).value() },
  },
  methods: {
		initSelection() {
			this.$store.state.Videos.selection = new Selection({
        boundaries: ['.items-selection'],
        selectables: ['.select-item'],
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.select-item')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.select-item')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        // Remove class if the user isn't pressing the shift or control or ⌘ keys
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) el.classList.remove('selected') // Unselect all elements
          this.$store.state.Videos.selection.clearSelection() // Clear previous selection
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        // Add a custom class to the elements that where selected.
        for (const el of added) el.classList.add('selected')
        // Remove the class from elements that where removed
        // since the last selection
        for (const el of removed) el.classList.remove('selected')
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.select-item')
        if (event.button==0 && targetEl) this.$store.state.Videos.selection.select(targetEl)
        this.$store.state.Videos.selection.keepSelection()
        this.getSelectedVideos(store.stored)
      })
    },
		selectedVideos(list) {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        let paths = ids.map(i => {
          let filePath = vids.find({id:i}).value().path
          return path.parse(filePath).name
        })
        if (list) {
          return paths.map((v,i) => (`${i+1}) ${v}`)).join('\r\n')
        } else {
          return paths.join(', ')
        }
      } else return ''
    },
    getSelectedVideos(selectedVideos){
      let ids = selectedVideos.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedVideos', ids)
    },
		getTextFromSelectedVideos(textType) {
      let ids = this.$store.getters.getSelectedVideos
      let vids = this.$store.getters.videos
      if (ids.length!==0) {
        let all = []
        for (let i=0; i<ids.length; i++) {
          let items = vids.find({id:ids[i]}).value()[textType]
          all = _.union(all, items)
        }
        return all.join(', ')
      } else return ''
      // TODO add option for select join delimiter for copied text
    },
    deleteVideos() {
      this.$store.dispatch('deleteVideos')
      this.$store.state.Videos.dialogDeleteVideo = false
    },
    addToPlaylist() {
      let id = this.playlists[this.selectedPlaylist].id
      let playlist = this.$store.getters.playlists.find({id}).cloneDeep().value()
      let videosFromPlaylist = playlist.videos

      this.$store.getters.getSelectedVideos.map(videoId => {
        if (!videosFromPlaylist.includes(videoId)) { // if the video is not in the playlist 
          videosFromPlaylist.push(videoId)
        }
      })
      this.$store.getters.playlists.find({id}).assign({
        videos: videosFromPlaylist,
        edit: Date.now(),
      }).write()
      this.$store.state.Videos.dialogAddToPlaylist = false
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.warning-note {
  font-size:0.55rem;
  line-height: 1;
}
.add-playlist {
  .v-list-item {
    display: flex;
    justify-content: space-between;
    &:after {
      display: none;
    }
  }
}
</style>