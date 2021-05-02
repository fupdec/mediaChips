<template>
  <v-lazy :width="cardSize">
    <v-card @mousedown="stopSmoothScroll($event)" height="100%"
      :data-id="metaCard.id" class="meta-card" outlined hover :key="cardKey"
      v-ripple="{ class: 'accent--text' }">
      <v-icon>mdi-card</v-icon>
      <div>{{metaCard.meta.name}}</div>
    </v-card>
  </v-lazy>
</template>


<script>

export default {
  name: "MetaCard",
  props: {
    metaCard: Object,
  },
  mounted() {
    this.$nextTick(function () {
      this.cardKey = this.metaCard.id
    })
  },
  data: () => ({
    cardKey: '',
  }),
  computed: {
    metaId() {
      return this.$route.query.metaId
    },
    meta() {
      return this.$store.getters.meta.find({id: this.metaId}).value()
    },
    cardSize() {
      return `calc(${100 / this.meta.settings.cardSize}% - 20px)`
    },
    updateCardIds() {
      return this.$store.state.Meta.updateCardIds
    },
  },
  methods: {
    stopSmoothScroll(event) {
      if (event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
  },
  watch: {
    updateCardIds(newValue) {
      if (newValue.length === 0) this.cardKey = this.metaCard.id + Date.now()
      if (newValue.includes(this.metaCard.id)) this.cardKey = this.metaCard.id + Date.now() 
    },
  },
}
</script>