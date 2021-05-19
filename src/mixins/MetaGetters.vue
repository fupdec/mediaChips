<script>
export default {
  computed: {
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    metaInCard() { return this.meta.settings.metaInCard },
  },
  methods: {
    getColor(metaId, cardId) {
      if (this.getMeta(metaId).settings.chipColor) {
        if (this.getCard(cardId) === undefined) return '#777'
        else return this.getCard(cardId).meta.color || '#777'
      } else return ''
    },
    getMeta(id) {
      return this.$store.getters.meta.find({id}).value()
    },
    getCard(cardId) { return this.$store.getters.metaCards.find({id:cardId}).value() },
    getCards(metaId) { return this.$store.getters.metaCards.filter({metaId}).value() },
    getArrayValuesForCard(metaId) { 
      let array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId).settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.join(', ') 
    },
    getArrayValuesForCard(metaId) { 
      let array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId).settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.join(', ') 
    },
  },
}
</script>