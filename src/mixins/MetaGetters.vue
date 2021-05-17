<script>
export default {
  computed: {
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    metaInCard() { return this.meta.settings.metaInCard },
  },
  methods: {
    getColor(metaId, cardId) {
      if (this.getMeta(metaId, 'complex').settings.chipColor) {
        if (this.getCard(metaId,cardId) === undefined) return '#777'
        else return this.getCard(metaId,cardId).meta.color || '#777'
      } else return ''
    },
    getMeta(id, type) {
      if (type == 'complex') return this.$store.getters.meta.find({id}).value()
      else return this.$store.getters.simpleMeta.find({id}).value()
    },
    getCard(metaId, cardId) { return this.$store.getters.metaCards.get(metaId).find({id:cardId}).value() },
    getCards(metaId) { return this.$store.getters.metaCards.get(metaId).value() },
    getArrayValuesForCard(metaId) { 
      let array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId,'simple').settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.join(', ') 
    },
    getArrayValuesForCard(metaId) { 
      let array = this.card.meta[metaId]
      if (array === undefined) return ''
      let items = this.getMeta(metaId,'simple').settings.items
      let values = array.map(itemId=>(_.find(items, {id: itemId}).name))
      return values.join(', ') 
    },
  },
}
</script>