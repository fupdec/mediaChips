<script>
import VideoCard from '@/components/pages/videos/VideoCard.vue'
import VideoPreviewGrid from '@/components/elements/VideoPreviewGrid.vue'
import VideoPreviewTimeline from '@/components/elements/VideoPreviewTimeline.vue'

const fs = require("fs")
const path = require("path")
const shortid = require('shortid')

export default {
  components: {
    VideoCard
  },
  beforeDestroy() {
    this.isGenerationBreak = true
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    videosPerPagePreset: [20,40,60,80,100,150,200,300],
    isGenerationGridsRun: false,
    isGenerationTimelinesRun: false,
    isGenerationBreak: false,
    timeout: null,
    numberOfCreatedGrid: 0,
    dropzone: false,
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
    backgroundProcesses: {
      get() { return this.$store.state.backgroundProcesses },
      set(val) { this.$store.state.backgroundProcesses = val },
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
    view() { return this.$store.state.Settings.videoView || 0 },
  },
  methods: {
    async createGrids(videos) {
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Generating grids images', icon: 'apps', }
      this.$store.commit('addBackgroundProcess', bp)
      this.isGenerationGridsRun = true
      const gridsPath = path.join(this.pathToUserData, `/media/grids/`) 
      if (!fs.existsSync(gridsPath)) fs.mkdirSync(gridsPath)
      const vm = this
      for (let i = 0; i < videos.length; i++) {
        this.$store.commit('updateTextBackgroundProcess', {id:bpId, text:`Generating grids images ${i+1} of ${videos.length}`})
        if (this.isGenerationBreak) break
        const video = videos[i]
        if (!fs.existsSync(video.path)) continue
        const gridPath = path.join(vm.pathToUserData, `/media/grids/${video.id}.jpg`)
        if (!fs.existsSync(gridPath)) await vm.createVideoGrid(video.path, video.id, video.duration)
      }

      if (this.numberOfCreatedGrid) this.$store.commit('updateVideos') // re render cards if grid added
      this.numberOfCreatedGrid = 0
      this.isGenerationGridsRun = false
      this.$store.commit('removeBackgroundProcess', bpId)
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
      let bpId = shortid.generate()
      let bp = { id: bpId, text: 'Generating timelines images', icon: 'view-carousel', }
      this.$store.commit('addBackgroundProcess', bp)
      this.isGenerationTimelinesRun = true
      const timelinesPath = path.join(this.pathToUserData, `/media/timelines/`) 
      if (!fs.existsSync(timelinesPath)) fs.mkdirSync(timelinesPath)
      const vm = this
      for (let i = 0; i < videos.length; i++) {
        this.$store.commit('updateTextBackgroundProcess', {id:bpId, text:`Generating timelines images ${i+1} of ${videos.length}`})
        if (this.isGenerationBreak) break
        const video = videos[i]
        if (!fs.existsSync(video.path)) continue
        const frame = path.join(vm.pathToUserData, `/media/timelines/${video.id}_5.jpg`)
        if (!fs.existsSync(frame)) await vm.createVideoTimeline(video)
        if (this.view==1) this.$store.commit('updateVideos', [video.id])
      }
      this.isGenerationTimelinesRun = false
      this.$store.commit('removeBackgroundProcess', bpId)
    },
    async createVideoTimeline(video) {
      let opts = {
        video: video,
        pathToUserData: this.pathToUserData,
      }

      let timeline = new VideoPreviewTimeline(opts)
      await timeline.generate()
    },
    generateImages() {
      clearInterval(this.timeout)
      this.isGenerationBreak = true
      this.timeout = setTimeout(() => {
        this.isGenerationBreak = false
        if (!this.isGenerationGridsRun) {
          if (this.$store.state.Settings.videoPreviewStatic=='grid') this.createGrids(this.$store.getters.videosOnPage)
        }
        if (!this.isGenerationTimelinesRun) {
          if (this.$store.state.Settings.videoPreviewHover=='timeline') this.createTimelines(this.$store.getters.videosOnPage)
        }
      }, 3000)
    },
    clearSelection() {
      this.$store.state.Videos.selection.clearSelection()
      let selected = this.$store.state.Videos.selection.select('.video-card')
      for (let i of selected) i.classList.remove('selected')
      this.$store.commit('updateSelectedVideos', [])
    },
    showDrop() { if (this.dropzone==false) this.dropzone = true },
    catchDrop(e) {
      this.dropzone = false

      let files = e.dataTransfer.files
      let folders = []
      let videos = []
      for (let f of files) {
        if (!f.type && f.size%4096 == 0) { // is a folder?
          folders.push(f.path)
        } else {
          if ( f.type.match(/.+?(?=\/)/)[0] == 'video' ) videos.push(f.path)
        }
      }

      if (folders.length == 0 && videos.length == 0) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `No videos found in the dropped files`
        })
      } else {
        this.$store.state.scan.folders = folders
        this.$store.state.scan.files = videos
        this.$store.state.scan.stage = 2
        this.$store.state.Settings.dialogScanVideos = true
      }
    },
  },
  watch: {
    videosOnPage() {
      this.clearSelection()
      this.generateImages()
    },
    videosPerPage() {
      this.clearSelection()
      this.generateImages()
    },
    videosCurrentPage() {
      this.clearSelection()
      this.generateImages()
    },
  },
}
</script>


<style lang="scss" scoped>
.dropzone {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 100px;
  opacity: 0.9;
  .text {
    pointer-events: none;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 8px dashed;
    font-size: 2em;
  }
}
</style>