<template>
  <div>
    <v-card outlined class="py-2 mb-10">
      <div class="text-center">
        <span class="overline">Meta Assigned to Videos</span>
      </div>
      <v-list v-if="metaAssignedToVideos.length" dense class="list-zebra">
        <draggable v-model="metaAssignedToVideos" v-bind="dragOptions" @start="drag=true" @end="drag=false">
          <transition-group type="transition">
            <v-list-item v-for="(meta, i) in metaAssignedToVideos" :key="i" class="pr-1 pl-2">
              <div class="d-flex justify-space-between align-center" style="width:100%">
                <span>
                  <v-icon left>mdi-{{getMeta(meta.id).settings.icon}}</v-icon>
                  <span>{{getMeta(meta.id).settings.name}}</span>
                  <span class="text--secondary px-2">({{meta.type}})</span>
                  <span class="caption text--secondary px-2">id: {{meta.id}}</span>
                  <span v-if="meta.type=='simple'" class="caption text--secondary px-2">type: {{getMeta(meta.id).dataType}}</span>
                  <span v-if="meta.scraperField" class="caption text--secondary">scraper: {{meta.scraperField}}</span>
                </span>
                <span>
                  <v-btn @click="openDialogDeleteMetaFromCard(i)" color="red" icon><v-icon>mdi-close</v-icon></v-btn>
                </span>
              </div>
            </v-list-item>
          </transition-group>
        </draggable>
      </v-list>
      <div v-else class="d-flex justify-space-between align-center flex-column">
        <v-icon size="40" class="my-2">mdi-shape-outline</v-icon>
        <div class="d-flex align-center mb-2">It's so empty ... </div>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialogAddMetaToCard=true" rounded class="pr-4" color="primary">
          <v-icon left>mdi-plus</v-icon> <span> Assign meta</span>
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
    
    <v-dialog v-if="dialogAddMetaToCard" v-model="dialogAddMetaToCard" scrollable max-width="450">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Assign Meta to Videos</div>
          <v-spacer></v-spacer>
          <v-btn @click="addMetaToCard" outlined><v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="px-4">
            <v-autocomplete v-model="selectedMetaForCard" label="Meta name" :items="metaForCard"
              :rules="[value => !!value || 'Meta is required']" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="text--secondary ml-2">({{data.item.type}})</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
                <span class="text--secondary ml-2">({{data.item.type}})</span>
              </template>
            </v-autocomplete>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteMetaFromCard" :value="dialogDeleteMetaFromCard" persistent max-width="450">
      <v-card>
        <v-toolbar color="error">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteMetaFromCard=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteMetaFromCard" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>Remove meta 
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{getMeta(metaAssignedToVideos[selectedMetaIndex].id).settings.icon}}</v-icon>
              <b>{{getMeta(metaAssignedToVideos[selectedMetaIndex].id).settings.name}}</b>
            </v-chip> from videos?
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'
import draggable from 'vuedraggable'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'MetaAssignedToVideos',
  components: { vuescroll, draggable },
  mixins: [MetaGetters], 
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogAddMetaToCard: false,
    dialogDeleteMetaFromCard: false,
    selectedMetaForCard: null,
    drag: false,
    dragOptions: {
      animation: 200,
      group: "description",
      disabled: false,
      ghostClass: "ghost"
    },
    selectedMetaIndex: 0,
  }),
  computed: {
    metaAssignedToVideos: {
      get() { return this.$store.state.Settings.metaAssignedToVideos },
      set(value) { this.$store.dispatch('updateSettingsState', {key:'metaAssignedToVideos', value}) },
    },
    metaForCard() {
      let metaInCardIds = this.metaAssignedToVideos.map(i=>i.id)
      let freeMetaList = this.$store.getters.meta.filter(i=>!metaInCardIds.includes(i.id))
      freeMetaList = freeMetaList.filter(i=>i.type!=='specific')
      return freeMetaList.cloneDeep().value()
    },
  },
  methods: {
    addMetaToCard() {
      if (this.selectedMetaForCard == null || this.selectedMetaForCard.length == 0) return // check if empty
      if (_.filter(this.metaAssignedToVideos, {id:this.selectedMetaForCard}).length > 0) return // check for dups
      let meta = _.find(this.metaForCard, {id: this.selectedMetaForCard})
      let metaForAdding = { id: meta.id, type: meta.type } 
      this.metaAssignedToVideos.push(metaForAdding)
      this.dialogAddMetaToCard = false
    },
    openDialogDeleteMetaFromCard(i) { 
      this.selectedMetaIndex = i
      this.dialogDeleteMetaFromCard = true
    },
    deleteMetaFromCard() {
      let metaId = this.metaAssignedToVideos[this.selectedMetaIndex].id
      this.$store.getters.videos.filter(v=>v[metaId]!==undefined).each(v=>{v[metaId]=undefined}).write() 
      this.metaAssignedToVideos.splice(this.selectedMetaIndex, 1)
      this.dialogDeleteMetaFromCard = false
    },
    filterMeta(metaObj, queryText) { return metaObj.settings.name.toLowerCase().includes(queryText.toLowerCase()) },
  },
}
</script>