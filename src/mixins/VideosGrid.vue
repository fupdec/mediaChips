<script>
import VideoCard from '@/components/pages/videos/VideoCard.vue'
import VideoPreviewGrid from '@/components/elements/VideoPreviewGrid'
import VideoPreviewTimeline from '@/components/elements/VideoPreviewTimeline'

const fs = require("fs")
const path = require("path")

export default {
  components: {
    VideoCard
  },
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
    getNumberOfPagesLimit() {return this.$store.state.Settings.numberOfPagesLimit},
    pages(){return this.$store.getters.videosPages},
    videosOnPage() {return this.$store.getters.videosOnPage},
    videosPerPage: {
      get() {return this.$store.state.Settings.videosPerPage},
      set(number) {this.$store.dispatch('changeVideosPerPage', number)},
    },
    videosPagesSum: {
      get() {return this.$store.state.Videos.pageTotal},
      set(number) {this.$store.state.Videos.pageTotal = number},
    },
    videosCurrentPage: {
      get() {return this.$store.state.Settings.videoPage},
      set(number) {
        this.$store.state.Settings.videoPage = number
        this.$store.dispatch('saveFiltersOfVideos')
      },
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    async createGrids(videos) {
      ++this.$store.state.backgroundProcesses
      this.isProcessRun = true
      const gridsPath = path.join(this.pathToUserData, `/media/grids/`) 
      if (!fs.existsSync(gridsPath)) fs.mkdirSync(gridsPath)
      const vm = this
      for (let i = 0; i < videos.length; i++) {
        if (this.isProcessBreak) break
        const video = videos[i]
        if (!fs.existsSync(video.path)) continue
        const gridPath = path.join(vm.pathToUserData, `/media/grids/${video.id}.jpg`)
        if (!fs.existsSync(gridPath)) await vm.createVideoGrid(video.path, video.id, video.duration)
      }

      if (this.numberOfCreatedGrid) this.$store.commit('updateVideos') // re render cards if grid added
      this.numberOfCreatedGrid = 0
      this.isProcessRun = false
      --this.$store.state.backgroundProcesses
      // TODO stop process on page changed or items per page changed
    },
    async createVideoGrid(inputVideoPath, videoId, videoDuration) {
      let opts = {
        input: inputVideoPath,
        output: path.join(this.pathToUserData, `/media/grids/${videoId}.jpg`),
        width: 180,
        cols: 3,
        rows: 3,
        duration: videoDuration,
      }

      let p = new VideoPreviewGrid(opts)
      const result = await p.generate()
      if (result) ++this.numberOfCreatedGrid
    },
    async createTimelines(videos) {
      ++this.$store.state.backgroundProcesses
      this.isProcessRun = true
      const timelinesPath = path.join(this.pathToUserData, `/media/timelines/`) 
      if (!fs.existsSync(timelinesPath)) fs.mkdirSync(timelinesPath)
      const vm = this
      for (let video of videos) {
        if (this.isProcessBreak) break
        if (!fs.existsSync(video.path)) continue
        const frame = path.join(vm.pathToUserData, `/media/timelines/${video.id}_5.jpg`)
        if (!fs.existsSync(frame)) await vm.createVideoTimeline(video)
      }
      this.isProcessRun = false
      --this.$store.state.backgroundProcesses
      // TODO stop process on page changed or items per page changed
    },
    async createVideoTimeline(video) {
      let opts = {
        video: video,
        pathToUserData: this.pathToUserData,
      }

      let timeline = new VideoPreviewTimeline(opts)
      await timeline.generate()
    },
  },
  watch: {
    videosOnPage() {
      this.$store.commit('updateSelectedVideos', [])
      if (this.isProcessRun) return
      if (this.$store.state.Settings.videoPreviewStatic=='grid') this.createGrids(this.$store.getters.videosOnPage)
      if (this.$store.state.Settings.videoPreviewHover=='timeline') this.createTimelines(this.$store.getters.videosOnPage)
    },
  },
}
</script>