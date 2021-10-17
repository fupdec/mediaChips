<template>
  <v-dialog v-model="dialog" scrollable fullscreen persistent>
    <v-card class="py-10">
      <v-toolbar color="primary">
        <span class="headline">Tree of {{meta.settings.name}} (experimental)</span>
        <v-spacer></v-spacer>
        <v-btn @click="close" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> Close </v-btn>
        <v-btn @click="save" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text>
          <v-alert type="info" text dense dismissible>Drag one {{meta.settings.nameSingular.toLowerCase()}} onto another to place it one level below or above.</v-alert>
          <div class="d-flex flex-wrap flex-column nested">
            <NestedMetaCard :nested="nestedMetaCards"/>
          </div>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>

<script>
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters.vue'
import NestedMetaCard from '@/components/pages/meta/NestedMetaCard.vue'

export default {
  name: "DialogNestedMetaCards",
  components: { vuescroll, NestedMetaCard },
  mixins: [MetaGetters],
  beforeMount() {
    this.initNestedMetaCards()
  }, 
  mounted () {
    this.$nextTick(function () {
      this.dialog = true
    })
  },
  data: () => ({
    dialog: false,
    nestedMetaCards: [],
  }),
  computed: {
  },
  methods: {
    initNestedMetaCards() {
      let old = this.meta.state.nested
      if (old) { this.nestedMetaCards = old; return }
      let metaCards = this.$store.getters.metaCards.filter({metaId:this.meta.id})
      metaCards = metaCards.orderBy(i=>(i.meta.name.toLowerCase()), ['asc']).value() 
      this.nestedMetaCards = metaCards.map(i => { return { id: i.id, nested: [] } }) 
    },
    close() {
      this.dialog = false
      setTimeout(() => { this.$emit('close') }, 500)
    },
    save() {
      console.log( this.nestedMetaCards )   
    },
  },
}
</script>


<style lang="scss">
.drag-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding-left: 0 !important;
  padding-right: 20px;
  border-radius: 5px;
  border: 1px dashed;
  transition: 0.3s all;
  list-style-type: none;
  background: repeating-linear-gradient(45deg,#80808077,#80808077 10px,#8080803d 10px,#8080803d 20px);
  li {
    border-radius: 5px;
    overflow: hidden;
    margin: 3px;
    display: flex;
  }
  .card-name {
    display: flex;
    align-items: center;
    background-color: rgba(139, 139, 139, 0.3);
    border-radius: 5px;
    padding: 0 5px;
  }
}
.nested {
  & > .drag-area  {
    background:none;
    padding: 0;
    margin: 0;
    border: none;
  }
}
</style>