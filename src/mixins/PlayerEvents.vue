<script>
const { ipcRenderer } = require('electron')
const fs = require("fs")
const path = require('path')

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
      ipcRenderer.on('addMarker', (event, marker, markerTag, video) => {
        this.addMarker(marker, markerTag, video)
      })
      ipcRenderer.on('removeMarker', (event, markerForRemove, video) => {
        this.removeMarker(markerForRemove, video)
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
    addMarker(marker, markerTag, videoId) {
      let video = this.$store.getters.videos.find({id: videoId}).value()
      this.$store.getters.markers.push(marker).write()
      if (marker.type.toLowerCase() == 'tag') {
        if (!video.tags.includes(markerTag)) {
          video.tags.push(markerTag)
          video.tags.sort()
          this.$store.getters.videos.find({ id: video.id }).assign({ 
            tags: video.tags,
          }).write()
          this.$store.commit('updateVideos')
        }
      }
    },
    removeMarker(markerForRemove) {
      this.$store.getters.markers.remove({'id':markerForRemove.id}).write()
      // remove image of marker
      let imgPath = path.join(this.$store.getters.getPathToUserData, `/media/markers/${markerForRemove.id}.jpg`)
      fs.unlink(imgPath, (err) => {
        if (err) {
          console.log(`failed to delete image of marker "${markerForRemove.id}", "${markerForRemove.name}". ${err}`);
        } else {
          console.log(`successfully deleted image of marker "${markerForRemove.id}", "${markerForRemove.name}"`);                                
        }
      })
    },
  },
}
</script>