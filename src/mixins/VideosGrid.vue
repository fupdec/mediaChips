<script>
import VideoCard from '@/components/pages/videos/VideoCard.vue'

export default {
  components: {
    VideoCard
  },
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
      set(quantity) {
        this.$store.dispatch('changeVideosPerPage', quantity)
      },
    },
    videosPagesSum: {
      get() {
        return this.$store.getters.videosPagesSum
      },
      set(quantity) {
        this.$store.dispatch('changeVideosPageTotal', quantity)
      },
    },
    videosCurrentPage: {
      get() {
        return this.$store.getters.videosCurrentPage
      },
      set(quantity) {
        this.$store.dispatch('changeVideosPageCurrent', quantity)
      },
    },
  },
  methods: {
    changeItemsPerPage() {
      this.$store.dispatch('changeVideosPerPage', this.videosPerPage)
    },
  },
}
</script>