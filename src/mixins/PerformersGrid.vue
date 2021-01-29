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
        return this.$store.state.Performers.firstChar
      },
      set (value) {
        this.$store.state.Performers.firstChar = value
        this.$store.dispatch('filterPerformers')
        this.updateFiltersOfPerformersTab()
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
        return this.$store.getters.performersPagesSum
      },
      set (number) {
        this.$store.dispatch('changePerformersPageTotal', number)
      },
    },
    performersCurrentPage: {
      get () {
        return this.$store.getters.performersCurrentPage
      },
      set (number) {
        this.$store.state.Performers.filters.page = number
        this.updateFiltersOfPerformersTab()
        this.$store.dispatch('changePerformersPageCurrent', number)
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
      this.$store.state.Performers.firstChar = []
      this.$store.dispatch('filterPerformers')
      this.updateFiltersOfPerformersTab()
    },
  },
}
</script>