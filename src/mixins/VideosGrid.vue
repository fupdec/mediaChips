<script>
import VideoCard from '@/components/pages/videos/VideoCard.vue'
import FilterVideos from '@/mixins/FilterVideos'

export default {
  components: {
    VideoCard
  },
  mixins: [FilterVideos],
  data: () => ({
    videosPerPagePreset: [20,40,60,80,100,150,200,300],
  }),
  computed: {
    getNumberOfPagesLimit() {
      return this.$store.getters.getNumberOfPagesLimit
    },
    pages: {
      get() {
        return this.$store.getters.videosPages
      },
      set(value) {
      },
    },
    videosOnPage() {
      return this.$store.getters.videosOnPage
    },
    videosPerPage: {
      get() {
        return this.$store.getters.videosPerPage
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
  },
}
</script>