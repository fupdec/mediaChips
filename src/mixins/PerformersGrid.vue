<script>
import PerformerCard from '@/components/pages/performers/PerformerCard.vue'
import FilterPerformers from '@/mixins/FilterPerformers'

export default {
  components: {
    PerformerCard
  },
  mixins: [FilterPerformers],
  data: () => ({
    alphabet: [
      'a','b','c','d','e','f','g','h','i','j','k','l','m','n',
      'o','p','q','r','s','t','u','v','w','x','y','z'
    ],
    performersPerPagePreset: [20,40,60,80,100,150,200,300],
  }),
  computed: {
    getNumberOfPagesLimit() {
      return this.$store.state.Settings.numberOfPagesLimit
    },
    chars: {
      get () {
        return this.$store.state.Settings.performerFirstChar
      },
      set (value) {
        this.$store.state.Settings.performerFirstChar = value
        this.$store.dispatch('filterPerformers')
        // this.$store.dispatch('saveFiltersOfPerformers', this.$route)
      },
    },
    pages: {
      get () {
        return this.$store.getters.performersPages
      },
      set (value) {
      },
    },
    performersOnPage() {
      return this.$store.getters.performersOnPage
    },
    performersPerPage: {
      get () {
        return this.$store.state.Settings.performersPerPage
      },
      set (number) {
        this.$store.dispatch('changePerformersPerPage', number)
      },
    },
    performersPagesSum: {
      get () {
        return this.$store.state.Performers.pageTotal
      },
      set (number) {
        this.$store.state.Performers.pageTotal = number
      },
    },
    performersCurrentPage: {
      get () {
        return this.$store.state.Settings.performerPage
      },
      set (number) {
        this.$store.state.Settings.performerPage = number
        this.$store.dispatch('saveFiltersOfPerformers')
      },
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.performerCardSize}`
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    clearChars() {
      this.$store.state.Settings.performerFirstChar = []
      this.$store.dispatch('filterPerformers')
    },
  },
}
</script>