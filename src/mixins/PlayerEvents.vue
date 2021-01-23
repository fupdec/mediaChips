<script>
const { ipcRenderer } = require('electron')

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
    addMarker(marker, markerTag, video) {
      this.$store.getters.markers.push(marker).write()
      if (marker.type == 'tag') {
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
    removeMarker(markerForRemove, video) {
      if (markerForRemove.type == 'Tag') {
        if (video.tags.includes(markerForRemove.name)) {
          // check if no more markers with type "Tag" and with the same name
          let isLastMarker = this.$store.getters.markers.filter(marker=>
            (marker.type=='Tag'&&marker.name==markerForRemove.name)).value().length == 1
          if (isLastMarker) {
            video.tags = video.tags.filter(t => t!==markerForRemove.name)
            this.$store.getters.videos.find({ id: video.id })
              .assign({ tags: video.tags }).write()
            this.$store.commit('updateVideos')
          }
        }
      }
      // TODO: fix delete tag from video if no more markers with this tag
      let markerId = markerForRemove.id
      this.$store.getters.markers.remove({'id':markerId}).write()
    },
  },
}
</script>