<script>
const { ipcRenderer } = require('electron')
const shortid = require('shortid')

import MetaGetters from '@/mixins/MetaGetters.vue'

export default {
  mixins: [MetaGetters],
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
      ipcRenderer.on('addNewMetaCard', (event, metaCardName, metaId) => {
        this.addNewMetaCard(metaCardName, metaId)
      })
      ipcRenderer.on('videoWatched', (event, videoId) => {
        this.videoWatched(videoId)
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
      if (marker.type !== 'favorite' && marker.type !== 'bookmark') {
        if (video[marker.type]!==undefined && video[marker.type].includes(marker.name)) return
        if (video[marker.type]===undefined) video[marker.type] = []
        video[marker.type].push(marker.name)
        video[marker.type] = video[marker.type].sort((a,b)=>{
          a = this.getCard(a).meta.name
          b = this.getCard(b).meta.name
          return a.localeCompare(b)
        })
        this.$store.getters.videos.find({ id: video.id }).assign({ 
          [marker.type]: video[marker.type],
          edit: Date.now(),
        }).write()
        this.$store.commit('updateVideos', [video.id])
      }
    },
    removeMarker(markerForRemove) {
      this.$store.dispatch('deleteMarker' , markerForRemove)
    },
    addNewMetaCard(metaCardName, metaId) {
      this.$store.dispatch('addMetaCard', { 
        id: shortid.generate(),
        metaId: metaId,
        meta: { name: metaCardName },
      })
      ipcRenderer.send('updatePlayerDb', 'metaCards') // update meta in player window
    },
    videoWatched(videoId) {
      let video = this.$store.getters.videos.find({id: videoId})
      if (!video.value()) return 
      video.assign({
        views: (video.value().views||0)+1,
        viewed: Date.now(),
      }).write()
    },
  },
}
</script>