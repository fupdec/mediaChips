<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogEditMetaCard" scrollable persistent max-width="800" width="70vw">
      <v-card>
        <v-card-title class="px-4 py-2">
          <span>Editing of {{meta.settings.nameSingular.toLowerCase()}} "{{card.meta.name}}"</span>
          <v-spacer></v-spacer>
          <v-btn @click="close" class="mx-4" color="red"> <v-icon left>mdi-close</v-icon> Close</v-btn>
          <v-btn @click="save" color="green"> <v-icon left>mdi-content-save</v-icon> Save</v-btn>
        </v-card-title>
        <v-divider class="mb-2"></v-divider>
        <div class="d-flex justify-space-between px-4">
          <v-chip label outlined small class="mr-4"> <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}} </v-chip>
          <v-chip label outlined small> <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}} </v-chip>
        </div>
        <vuescroll>
          <v-card-text>
            <v-container fluid>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="name" outlined label="Name" hide-details dense/>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="synonyms" outlined label="Synonyms" hide-details dense/>
                </v-col>
                <v-col v-for="(m,i) in metaInCard" :key="i" cols="12" sm="6">
                  <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                    @input="setVal($event,m.id)" :value="values[m.id]"
                    outlined multiple hide-selected hide-details dense
                    :label="getMeta(m.id,m.type).settings.name" item-value="id"
                  >
                    <template v-slot:selection="data">
                      <v-chip v-bind="data.attrs" 
                        @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                        @mouseleave.stop="$store.state.hoveredImage=false">
                        <span>{{ data.item.meta.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <span>{{data.item.meta.name}}</span>
                    </template>
                  </v-autocomplete>

                  <v-text-field v-if="m.type=='simple'&&(getMeta(m.id,m.type).type==='string'||getMeta(m.id,m.type).type==='number')" 
                    @input="setVal($event,m.id)" :value="values[m.id]" outlined
                    :label="getMeta(m.id,m.type).settings.name" hide-details dense
                    clearable @click:clear="setVal('', m.id)"/>

                  <v-autocomplete v-if="m.type=='simple'&&getMeta(m.id,m.type).type==='array'" 
                    :items="getMeta(m.id,m.type).settings.items" item-value="id" item-text="name"
                    @input="setVal($event,m.id)" :value="values[m.id]" multiple hide-details
                    :label="getMeta(m.id,m.type).settings.name" outlined dense/>
                  
                  <v-switch v-if="m.type=='simple'&&getMeta(m.id,m.type).type==='boolean'" 
                    inset :label="getMeta(m.id,m.type).settings.name" hide-details 
                    @change="setVal($event,m.id)" :value="values[m.id]" class="ma-0"/>
                    
                  <v-text-field v-if="m.type=='simple'&&getMeta(m.id,m.type).type==='date'" 
                    :value="values[m.id]" @click="pickerId=m.id,picker=true" outlined dense
                    :label="getMeta(m.id,m.type).settings.name" hint='YYYY-MM-DD' hide-details
                    clearable @click:clear="setVal('', m.id)" readonly persistent-hint/>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
      <div @click="close" class="left-close-panel">
        <div class="content">
          <v-icon color="red" size="15vw">mdi-close</v-icon>
          <span class="red--text">Close</span>
        </div>
      </div>
      <div @click="save" class="right-close-panel">
        <div class="content">
          <v-icon color="green" size="15vw">mdi-check</v-icon>
          <span class="green--text">Save</span>
        </div>
      </div>
    </v-dialog>

    <v-dialog v-model="picker" width="300px">
      <v-date-picker @change="setVal($event, pickerId), picker=false"
        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
        :value="values[pickerId]" no-title color="primary" full-width/>
    </v-dialog>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: "DialogEditMetaCard",
  components: {
    vuescroll,
	},
  beforeMount () {
    this.parseMetaInCard()
  },
  mixins: [ShowImageFunction], 
  mounted () {
    this.$nextTick(function () {
      this.name = this.card.meta.name || ''
      this.synonyms = this.card.meta.synonyms===undefined? '' : this.card.meta.synonyms.join(', ')
    })
  },
  data: () => ({
    isSelectedSingle: null,
    values: {},
    picker: false,
    pickerId: null,
    name: '',
    synonyms: '',
  }),
  computed: {
    metaId() { return this.$route.query.metaId },
    meta() { return this.$store.getters.meta.find({id: this.metaId}).value() },
    metaInCard() { return this.meta.settings.metaInCard },
    oldValues() { return this.$store.getters.metaCards.get(this.metaId).find({id:this.card.id}).get('meta').cloneDeep().value() },
    card() {
      let ids = this.$store.state.Meta.selectedMeta
      ids.length > 1 ? this.isSelectedSingle=false : this.isSelectedSingle=true 
      let metaCards = this.$store.getters.metaCards.get(this.metaId)
      if (this.$route.path.includes('/meta/:') && this.$router.currentRoute.params.id) {
        if (this.$router.currentRoute.params.id.substring(1)) {
          return metaCards.find({id:this.$router.currentRoute.params.id.substring(1)}).value()
        }
      } else if (this.isSelectedSingle) {
        return metaCards.find({id:ids[0]}).value()
      } else return metaCards.filter(i=>ids.includes(i.id)).value()
    },
    dateAdded() {
      let date = new Date(this.card.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.card.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
  methods: {
    getMeta(id, type) {
      if (type == 'complex') return this.$store.getters.meta.find({id}).value()
      else return this.$store.getters.simpleMeta.find({id}).value()
    },
    // TODO rules for name and synonyms
    parseMetaInCard() {
      let metaInCard = this.meta.settings.metaInCard
      for (let i = 0; i < metaInCard.length; i++) {
        const id = metaInCard[i].id
        const type = metaInCard[i].type
        if (type=='complex') { this.values[id] = this.card.meta[id] || []; continue }
        const simpleMetaType = this.getMeta(id,type).type
        let defaultValue = ''
        if (simpleMetaType=='array') defaultValue = []
        if (simpleMetaType=='boolean') defaultValue = false
        this.values[id] = this.card.meta[id] || defaultValue
      }
    },
    removeTrash(string) {
      string = string.trim()
      string = string.replace(/[\\\/\%"<>{}\[\]]/g, '')
      string = string.replace(/ +(?= )/g,'') // remove multiple spaces
      return string
    },
    parseStringToArray(string) {
      string = this.removeTrash(string)
      string = string.split(/[,;]/)
      string = string.filter((el)=>(el != '' && el != ' '))
      string = string.map(s => s.trim())
      return string
    },
    getCards(metaId) { return this.$store.getters.metaCards.get(metaId).value() },
    setVal(value, id) { this.values[id] = value },
    close() { this.$store.state.Meta.dialogEditMetaCard = false },
    save() {
      let presetValues = {
        name: this.name,
        synonyms: this.parseStringToArray(this.synonyms),
      }
      let newValues = {...presetValues, ...this.oldValues, ...this.values}
      this.$store.getters.metaCards.get(this.metaId).find({id:this.card.id}).assign({edit: Date.now()}).get('meta').assign(newValues).write()
      this.$store.state.Meta.dialogEditMetaCard = false 
    },
  },
};
</script>