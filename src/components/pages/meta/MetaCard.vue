<template>
  <v-lazy :width="cardSize">
    <v-card @mousedown="stopSmoothScroll($event)" height="100%"
      :data-id="metaCard.id" class="meta-card" outlined hover :key="cardKey"
      v-ripple="{ class: 'accent--text' }">
      <v-icon>mdi-card</v-icon>
      <div>{{metaCard.meta.name}}</div>
      <div v-for="(m,i) in metaInCard" :key="i">
        <v-icon>mdi-{{getMeta(m.id,m.type).settings.icon}}</v-icon>
      </div>

      <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" color="secondary" fab x-small class="btn-edit">
        <v-icon>mdi-pencil</v-icon> </v-btn>
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
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    cardSize() { return `calc(${100 / this.meta.settings.cardSize}% - 20px)` },
    updateCardIds() { return this.$store.state.Meta.updateCardIds },
    metaInCard() { return this.meta.settings.metaInCard },
  },
  methods: {
    stopSmoothScroll(event) {
      if (event.button != 1) return
      event.preventDefault()
      event.stopPropagation()
    },
    getMeta(id, type) {
      if (type == 'complex') return this.$store.getters.meta.find({id}).value()
      else return this.$store.getters.simpleMeta.find({id}).value()
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