<template>
  <v-dialog v-if="dialog" :value="dialog" @input="closeDialog" scrollable max-width="800">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Setting up meta for data scraper</div>
        <v-spacer></v-spacer>
        <v-btn @click="save" outlined><v-icon left>mdi-content-save</v-icon> save </v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text class="text-center">
        <v-alert dense text outlined type="info">Drag the meta to the scraper field to assign</v-alert>
        <v-row class="mt-4">
          <v-col cols="6" class="py-0">
            <div class="overline">Meta in cards</div>
            <div v-if="metaForScraper.length" class="d-flex flex-wrap">
              <drag v-for="(m, i) in metaForScraper" :key="i"
                :transfer-data="m" :effect-allowed="['move']" drop-effect="move"
                @dragstart="dragging=m.dataType||'array'" @dragend="dragging=null">
                <v-chip class="ma-1">
                  <v-icon left>mdi-{{m.settings.icon}}</v-icon> {{m.settings.name}}
                  <span class="caption text--secondary pl-2">
                    <span v-if="m.type=='complex'">array</span>
                    <span v-else>{{m.dataType}}</span>
                  </span>
                </v-chip>
              </drag>
            </div>
            <div v-else class="body-1 text--secondary py-10">No more meta added</div>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="6" class="py-0">
            <div class="overline">Scraper fields</div>
            <drop v-for="(field,i) in scraperFields" :key="i" class="data-field" 
              :class="{allowed:dragging===field.type, assigned:field.assigned}" 
              @dragover="handleDragover(field, ...arguments)" @drop="handleDrop(i, ...arguments)">
              <div v-if="field.assigned" class="d-flex justify-space-between align-center">
                <span class="body-1">{{field.name}}</span>
                <v-chip @click="remove(i)" small label class="px-2">
                  <v-icon left>mdi-{{getMeta(field.assigned).settings.icon}}</v-icon> 
                  <span>{{getMeta(field.assigned).settings.name}}</span>
                  <span class="caption text--secondary pl-2">{{field.type}}</span>
                </v-chip>
              </div>
              <div v-else class="d-flex justify-space-between align-center px-1">
                <span class="text--secondary body-1 mr-2">{{field.name}}</span>
                <span class="text--secondary caption">{{field.type}}</span>
              </div>
            </drop>
          </v-col>
        </v-row>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>

<script>
import vuescroll from 'vuescroll'
import { Drag, Drop } from 'vue-drag-drop'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  props: {
    dialog: Boolean,
    metaInCards: Array,
  },
  name: "DialogEditScraperFields",
  components: { vuescroll, Drag, Drop },
  mixins: [MetaGetters], 
  beforeMount() {
    this.updateMetaForScraper()
    this.scraperFields = _.cloneDeep(this.defaultScraperFields)
  },
  mounted () {
    this.$nextTick(function () {
      this.parseMetaInCardForFields()
    })
  },
  data: () => ({
    dragging: null,
    metaForScraper: [],
    scraperFields: [],
    defaultScraperFields: [
      {name: 'birthday', type: 'date'},
      {name: 'career_start', type: 'number'}, // TODO change it to one word
      {name: 'career_end', type: 'number'}, // TODO change it to one word
      {name: 'ethnicity', type: 'array'},
      {name: 'eyes', type: 'array'},
      {name: 'hair', type: 'array'},
      {name: 'height', type: 'number'},
      {name: 'weight', type: 'number'},
      {name: 'bra', type: 'number'},
      {name: 'waist', type: 'number'},
      {name: 'hip', type: 'number'},
      {name: 'cups', type: 'array'},
      {name: 'boobs', type: 'array'},
      {name: 'category', type: 'array'},
      {name: 'tatoo', type: 'string'},
    ],
  }),
  computed: {
  },
  methods: {
    parseMetaInCardForFields() {
      let meta = this.metaInCards, fields = this.scraperFields
      for (let i = 0; i < fields.length; i++) {
        const index = _.findIndex(meta, j=>j.scraperField===fields[i].name)
        if (index > -1) this.scraperFields[i].assigned = meta[index].id
      }
      this.updateMetaForScraper()
    },
    handleDragover(field, meta, event) {
      if (field.assigned) event.dataTransfer.dropEffect = 'none'
      else if (meta.type == 'complex' && field.type !== 'array') event.dataTransfer.dropEffect = 'none'
      else if (meta.type == 'simple' && field.type !== meta.dataType) event.dataTransfer.dropEffect = 'none'
    },
    handleDrop(fieldIndex, meta) {
      this.scraperFields[fieldIndex].assigned = meta.id
      this.updateMetaForScraper()
      this.dragging = null
    },
    updateMetaForScraper() { 
      let assignedFields = this.scraperFields.filter(i=>i.assigned!==undefined).map(i=>i.assigned)
      let metaForScraper = _.filter(this.metaInCards, i=>i.dataField===undefined)
      metaForScraper = _.filter(metaForScraper, i=>!assignedFields.includes(i.id))
      this.metaForScraper = metaForScraper.map(i=>this.getMeta(i.id))
    },
    remove(index) { 
      this.scraperFields[index].assigned = undefined
      this.updateMetaForScraper()
    },
    closeDialog() { this.$emit('closeDialog') },
    save() { this.$emit('closeDialog', this.scraperFields) },
  },
}
</script>


<style lang="scss">
.data-field {
  border: 1px dashed #777;
  border-radius: 5px;
  width: 100%;
  margin-bottom: 5px;
  transition: .3s all;
  &.allowed {
		background-color: rgba(37, 179, 37, 0.3);
	}
  &.assigned {
    padding-left: 5px;
		background-color: rgba(37, 179, 37, 0.6);
	}
  .v-chip {
    transition: .3s all;
    &:hover {
      background-color: #eb5e5e;
    }
  }
}
</style>