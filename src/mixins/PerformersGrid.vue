<script>
import PerformerCard from '@/components/pages/performers/PerformerCard.vue'

export default {
  components: {
    PerformerCard
  },
  data: () => ({
    alphabet: [
      'a','b','c','d','e','f','g','h','i','j','k','l','m','n',
      'o','p','q','r','s','t','u','v','w','x','y','z'
    ],
    performersPerPagePreset: [20,40,60,80,100,150,200,300],
  }),
  computed: {
    getNumberOfPagesLimit() {
      return this.$store.getters.getNumberOfPagesLimit
    },
    chars: {
      get () {
        return this.$store.state.Performers.filters.firstChar
      },
      set (value) {
        let key = 'firstChar'
        this.$store.commit('updateFiltersOfPerformers', {key, value})
        this.$store.dispatch('filterPerformers')
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
        return this.$store.getters.performersPerPage
      },
      set (quantity) {
        this.$store.dispatch('changePerformersPerPage', quantity)
      },
    },
    performersPagesSum: {
      get () {
        return this.$store.getters.performersPagesSum
      },
      set (quantity) {
        this.$store.dispatch('changePerformersPageTotal', quantity)
      },
    },
    performersCurrentPage: {
      get () {
        return this.$store.getters.performersCurrentPage
      },
      set (quantity) {
        this.$store.dispatch('changePerformersPageCurrent', quantity)
      },
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.performerCardSize}`
    },
  },
  methods: {
    clearChars() {
      let key = 'firstChar'
      let value = []
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.$store.dispatch('filterPerformers')
    },
    changeItemsPerPage(){
      this.$store.dispatch('changePerformersPerPage', this.performersPerPage)
    },
  },
}
</script>