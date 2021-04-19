<script>
const { ipcRenderer } = require('electron')
const fs = require("fs")
const path = require('path')
const shortid = require('shortid')

export default {
  mounted () {
    this.$nextTick(function () {
      // requests from other windows
      ipcRenderer.on('getDb', (event, dbType) => {
        let database = this.$store.getters[dbType].value()
        ipcRenderer.send('getDbAnswer', database)
      })
      ipcRenderer.on('watchLater', (event, videoId) => {
        this.watchLater(videoId)
      })
      ipcRenderer.on('addMarker', (event, marker, video) => {
        this.addMarker(marker, video)
      })
      ipcRenderer.on('removeMarker', (event, markerForRemove, video) => {
        this.removeMarker(markerForRemove, video)
      })
      ipcRenderer.on('addNewTag', (event, tag) => {
        this.addNewTag(tag)
      })
      ipcRenderer.on('addNewPerformer', (event, performer) => {
        this.addNewPerformer(performer)
      })
    })
  },
  computed: {
  },
  methods: {
    watchLater(videoId) {
      let playlist = this.$store.getters.playlists.find({name:'Watch later'}).value()
      if (playlist.videos.includes(videoId)) {
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          videos: playlist.videos.filter(video=>(video !== videoId)),
          edit: Date.now(),
        }).write()
      } else {
        let videosFromPlaylist = playlist.videos
        videosFromPlaylist.push(videoId)
        this.$store.getters.playlists.find({name:'Watch later'}).assign({
          videos: videosFromPlaylist,
          edit: Date.now(),
        }).write()
      }
    },
    addMarker(marker, videoId) {
      let video = _.cloneDeep(this.$store.getters.videos.find({id: videoId}).value())
      this.$store.getters.markers.push(marker).write()
      if (marker.type.toLowerCase() == 'tag') {
        if (!video.tags.includes(marker.name)) {
          video.tags.push(marker.name)
          video.tags.sort()
          this.$store.getters.videos.find({ id: video.id }).assign({ 
            tags: video.tags,
            edit: Date.now(),
          }).write()
          this.$store.commit('updateVideos', [video.id])
        }
      } else if (marker.type == 'performer') {
        if (!video.performers.includes(marker.name)) {
          video.performers.push(marker.name)
          video.performers.sort()
          this.$store.getters.videos.find({ id: video.id }).assign({ 
            performers: video.performers,
            edit: Date.now(),
          }).write()
          this.$store.commit('updateVideos', [video.id])
        }
      }
    },
    removeMarker(markerForRemove) {
      this.$store.dispatch('deleteMarker' , markerForRemove)
    },
    addNewTag(tagName) {
      this.$store.dispatch('addTag', { id: shortid.generate(), name: tagName })
      ipcRenderer.send('updatePlayerDb', 'tags') // update tag in player window
    },
    addNewPerformer(performerName) {
      this.$store.dispatch('addPerformer', { id: shortid.generate(), name: performerName })
      ipcRenderer.send('updatePlayerDb', 'performers') // update performers in player window
    },
  },
}
</script>