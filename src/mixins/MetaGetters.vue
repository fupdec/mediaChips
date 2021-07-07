<script>
export default {
  computed: {
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).cloneDeep().value() },
    metaInCard() { return this.meta.settings.metaInCard },
    tabId() { return this.$route.query.tabId },
    tab() {
      if (this.tabId === 'default') return undefined
      else return this.$store.getters.tabsDb.find({id: this.tabId}).cloneDeep().value()
    },
  },
  data: () => ({
    specificMeta: ['name','synonyms','favorite','rating'],
  }),
  methods: {
    getColor(metaId, cardId) {
      if (this.getMeta(metaId).settings.color) {
        if (this.getCard(cardId) === undefined) return '#777'
        else return this.getCard(cardId).meta.color || '#777'
      } else return ''
    },
    getMeta(id) { return this.$store.getters.meta.find({id}).cloneDeep().value() },
    getCard(cardId) { return this.$store.getters.metaCards.find({id:cardId}).cloneDeep().value() },
    getCards(metaId) {
      function sortCardsBy(item, sortBy) {
        if (sortBy === 'name') return item.meta.name.toLowerCase() || ''
        else if (['date','edit'].includes(sortBy)) return item[listView.sortBy] || 0
        else return item.meta[listView.sortBy] || false
      }
      let cards = this.$store.getters.metaCards.filter({metaId})
      let listView = this.getMeta(metaId).state.listView || { sortBy: 'name', sortDir: 'asc', }
      cards = cards.orderBy(i=>i.meta.name.toLowerCase() || '',['asc'])
      cards = cards.orderBy(i=>sortCardsBy(i,listView.sortBy),[listView.sortDir])
      return cards.cloneDeep().value() 
    },
    getArrayValuesForCard(metaId, cardType) { 
      let array
      if (cardType === 'video') array = this.video[metaId]
      else array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId).settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.sort().join(', ') 
    },
  },
}
</script>