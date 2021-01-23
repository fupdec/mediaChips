<script>
import VideoCard from '@/components/pages/videos/VideoCard.vue'
import FilterVideos from '@/mixins/FilterVideos'
import VideoPreviewGrid from '@/components/elements/VideoPreviewGrid'

const fs = require("fs")
const path = require("path")

export default {
  components: {
    VideoCard
  },
  mixins: [FilterVideos],
  beforeDestroy() {
    this.isProcessBreak = true
  },
  data: () => ({
    videosPerPagePreset: [20,40,60,80,100,150,200,300],
    isProcessRun: false,
    isProcessBreak: false,
    numberOfCreatedGrid: 0,
  }),
  computed: {
    getNumberOfPagesLimit() {
      return this.$store.state.Settings.numberOfPagesLimit
    },
    pages(){
      return this.$store.getters.videosPages
    },
    videosOnPage() {
      return this.$store.getters.videosOnPage
    },
    videosPerPage: {
      get() {
        return this.$store.state.Settings.videosPerPage
      },
      set(number) {
        this.$store.dispatch('changeVideosPerPage', number)
      },
    },
    videosPagesSum: {
      get() {
        return this.$store.getters.videosPagesSum
      },
      set(number) {
        this.$store.dispatch('changeVideosPageTotal', number)
      },
    },
    videosCurrentPage: {
      get() {
        return this.$store.getters.videosCurrentPage
      },
      set(number) {
        this.$store.state.Videos.filters.page = number
        this.updateFiltersOfVideosTab()
        this.$store.dispatch('changeVideosPageCurrent', number)
      },
    },
  },
  methods: {
    async processArray(videos) {
      // console.log('Start to creating grids')
      this.isProcessRun = true
      const vm = this
      for (let index = 0; index < videos.length; index++) {
        if (this.isProcessBreak) break
        const video = videos[index]
        if (fs.existsSync(video.path)) {
          const gridPath = path.join(vm.$store.getters.getPathToUserData, `/media/previews/${video.id}.jpg`)
          if (!fs.existsSync(gridPath)) {
            await vm.createVideoGrid(video.path, video.id)
          }
        }
      }

      // re render cards if grid added
      if (this.numberOfCreatedGrid) this.$store.state.Videos.updateCard = Date.now()
      this.numberOfCreatedGrid = 0
      this.isProcessRun = false
      // console.log('End of creating grids')
    },
    async createVideoGrid(inputVideoPath, videoId) {
      let opts = {
        input: inputVideoPath,
        output: path.join(this.$store.getters.getPathToUserData, `/media/previews/${videoId}.jpg`),
        width: 180,
        cols: 3,
        rows: 3
      }

      let p = new VideoPreviewGrid(opts)
      const result = await p.generate()
      if (result) ++this.numberOfCreatedGrid
    },
  },
  watch: {
    videosOnPage() {
      this.$store.commit('updateSelectedVideos', [])
      if (this.isProcessRun) return
      if (this.$store.state.Settings.videoPreviewGridEnabled) {
        this.processArray(this.$store.getters.videosOnPage)
      }
    },
  },
}
</script>