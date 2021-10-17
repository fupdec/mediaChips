<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogEditMetaCard" scrollable persistent max-width="700" width="70vw">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">
            <span>Edit multiple {{meta.settings.name.toLowerCase()}} info </span>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on">mdi-help-circle-outline</v-icon>
              </template>
              <span>The entered information will be processed in accordance <br>with the selected icon on the left of the field:<br>
                <v-icon v-html="`mdi-cancel`" dark small left/> will remain the same <br>
                <v-icon v-html="`mdi-reload-alert`" dark small left/> will be replaced (leave blank field to remove information) <br>
                <v-icon v-html="`mdi-plus-circle-outline`" dark small left/> will be added to the existing one (only for arrays) <br>
                <v-icon v-html="`mdi-close-circle-outline`" dark small left/> will be removed to the existing one (only for arrays) </span>
            </v-tooltip>
          </span>
          <v-spacer></v-spacer>
          <v-btn @click="close" class="mx-4" outlined> <v-icon left>mdi-close</v-icon> Close</v-btn>
          <v-btn @click="save" outlined> <v-icon left>mdi-content-save</v-icon> Save</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="pl-2">
            <v-container fluid>
              <v-row>
                <v-col v-for="(m,i) in modifiedMetaInCards" :key="i+key" cols="12" class="d-flex align-center pt-0">
                  <v-btn @click="toggleEditMode(m)" small icon class="mr-2"> 
                    <v-tooltip v-if="edits[m.id]===1" top>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" v-html="`mdi-reload-alert`" size="20" color="red"/>
                      </template>
                      <span>Replace</span>
                    </v-tooltip>
                    <v-tooltip v-else-if="edits[m.id]===2" top>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" v-html="`mdi-plus-circle-outline`" size="20" color="green"/>
                      </template>
                      <span>Add</span>
                    </v-tooltip>
                    <v-tooltip v-else-if="edits[m.id]===3" top>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" v-html="`mdi-close-circle-outline`" size="20" color="red"/>
                      </template>
                      <span>Remove</span>
                    </v-tooltip>
                    <v-tooltip v-else top>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" v-html="`mdi-cancel`" size="18"/>
                      </template>
                      <span>No action</span>
                    </v-tooltip>
                  </v-btn>

                  <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                    @input="setVal($event,m.id)" :value="values[m.id]" :ref="m.id"
                    multiple hide-selected :disabled="edits[m.id]===0"
                    :label="getMeta(m.id).settings.name" item-value="id"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                    append-outer-icon="mdi-plus" append-icon="mdi-chevron-down" 
                    @click:append-outer="openDialogAddNewCard(m.id)"
                    @click:append="listViewMeta=getMeta(m.id),dialogListView=true"
                    :menu-props="{contentClass:'list-with-preview'}" class="hidden-close"
                    :filter="filterCards" :hint="getMeta(m.id).settings.hint" persistent-hint
                  >
                    <template v-slot:selection="data">
                      <v-chip v-bind="data.attrs" class="my-1 px-2" small
                        @click="data.select" :input-value="data.selected"
                        @click:close="removeItem(data.item.id,m.id)" close
                        :color="getColor(m.id,data.item.id)" 
                        :label="getMeta(m.id).settings.chipLabel"
                        :outlined="getMeta(m.id).settings.chipOutlined"
                        @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                        @mouseleave.stop="$store.state.hoveredImage=false">
                        <span>{{ data.item.meta.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <div class="list-item" 
                        @mouseover.stop="showImage($event, data.item.id, 'meta', m.id)" 
                        @mouseleave.stop="$store.state.hoveredImage=false"
                      > 
                        <span v-if="getMeta(m.id).settings.favorite">
                          <v-icon :color="data.item.meta.favorite? 'pink':''" left size="14">mdi-heart</v-icon>
                        </span>
                        <span v-if="getMeta(m.id).settings.color">
                          <v-icon :color="data.item.meta.color || ''" left small>
                            mdi-{{getMeta(m.id).settings.icon}}</v-icon>
                        </span>
                        <span>{{data.item.meta.name}}</span>
                        <span v-if="getMeta(m.id).settings.synonyms" class="aliases">
                          {{getCard(data.item.id).meta.synonyms===undefined? '' : getCard(data.item.id).meta.synonyms.join(', ').slice(0,50)}}
                        </span>
                      </div>
                    </template>
                  </v-autocomplete>

                  <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='string')" 
                    @input="setVal($event,m.id)" :value="values[m.id]"
                    :label="getMeta(m.id).settings.name" 
                    clearable @click:clear="setVal('', m.id)" :disabled="edits[m.id]===0"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                    :hint="getMeta(m.id).settings.hint" persistent-hint/>

                  <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='number')" 
                    @input="setVal($event,m.id)" :value="values[m.id]" type="number"
                    :label="getMeta(m.id).settings.name" :disabled="edits[m.id]===0"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                    :hint="getMeta(m.id).settings.hint" persistent-hint/>

                  <v-autocomplete v-if="m.type=='simple'&&getMeta(m.id).dataType==='array'" 
                    :items="getMeta(m.id).settings.items" item-value="id" item-text="name"
                    @input="setVal($event,m.id)" :value="values[m.id]" multiple
                    :label="getMeta(m.id).settings.name" :disabled="edits[m.id]===0"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''" 
                    append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewItem(m.id)"
                    :hint="getMeta(m.id).settings.hint" persistent-hint/>
                  
                  <v-switch v-if="m.type=='simple'&&getMeta(m.id).dataType==='boolean'" 
                    :label="getMeta(m.id).settings.name" :disabled="edits[m.id]===0"
                    @change="setVal($event,m.id)" :value="values[m.id]"
                    :prepend-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                    :hint="getMeta(m.id).settings.hint" persistent-hint/>
                    
                  <v-text-field v-if="m.type=='simple'&&getMeta(m.id).dataType==='date'" 
                    :value="values[m.id]" @click="calendarId=m.id,calendar=true" :disabled="edits[m.id]===0"
                    :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint"
                    clearable @click:clear="setVal('', m.id)" readonly persistent-hint
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>
                      
                  <div v-if="m.type=='simple'&&getMeta(m.id).dataType==='rating'" class="d-flex flex-column">
                    <div class="text--secondary caption">{{getMeta(m.id).settings.name}}</div>
                    <div class="d-flex">
                      <v-icon v-html="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''" left/>
                      <v-rating :value="values[m.id]" @input="setVal($event,m.id)" :length="getMeta(m.id).settings.ratingMax" hover 
                        :full-icon="`mdi-${getMeta(m.id).settings.ratingIcon}`" :empty-icon="`mdi-${getMeta(m.id).settings.ratingIconEmpty||getMeta(m.id).settings.ratingIcon}`" 
                        :color="getMeta(m.id).settings.ratingColor" background-color="grey" class="meta-rating" clearable :readonly="edits[m.id]===0"
                        :half-increments="getMeta(m.id).settings.ratingHalf" :half-icon="`mdi-${getMeta(m.id).settings.ratingIconHalf||getMeta(m.id).settings.ratingIcon}`"/>
                    </div>
                    <div class="text--secondary caption">{{getMeta(m.id).settings.hint}}</div>
                  </div>
                  
                  <v-btn v-if="m.id==='color'" @click="dialogColor=true" :disabled="edits[m.id]===0" :color="colorPicker" rounded>
                    <v-icon left>mdi-palette</v-icon> color for all cards</v-btn>

                  <v-autocomplete v-if="m.id==='country'" :items="countries" multiple 
                    @input="setVal($event,m.id)" :value="values[m.id]" ref="country"
                    item-text="name" item-value="name" label="Country" 
                    class="hidden-close" hide-selected :disabled="edits[m.id]===0"
                    :menu-props="{contentClass:'list-with-preview'}" :filter="filterCountry"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta('country').settings.icon}`:''">
                    <template v-slot:selection="data">
                      <v-chip @click="data.select" @click:close="removeCountry(data.item)"
                        v-bind="data.attrs" class="my-1 px-2" outlined close small label
                        :input-value="data.selected" close-icon="mdi-close"> 
                        <country-flag :country='data.item.code' size='normal'/> 
                        <span class="pl-2">{{ data.item.name }}</span>
                      </v-chip>
                    </template>
                    <template v-slot:item="data">
                      <country-flag :country='data.item.code' size='normal'/>
                      <span class="pl-2">{{data.item.name}}</span>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col v-if="metaInCard.length==0" cols="12" class="d-flex align-center justify-center flex-column">
                  <v-icon size="40" class="my-2">mdi-shape-outline</v-icon>
                  <div>No meta assigned to the {{meta.settings.name.toLowerCase()}}. Please assign them in the settings.</div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
      <div v-if="panels" @click="close" class="left-close-panel">
        <div class="content">
          <v-icon color="red" size="15vw">mdi-close</v-icon>
          <span class="red--text">Close</span>
        </div>
      </div>
      <div v-if="panels" @click="save" class="right-close-panel">
        <div class="content">
          <v-icon color="green" size="15vw">mdi-check</v-icon>
          <span class="green--text">Save</span>
        </div>
      </div>
    </v-dialog>

    <v-dialog v-model="calendar" width="300px">
      <v-date-picker @change="setVal($event, calendarId), calendar=false"
        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
        :value="values[calendarId]" no-title color="primary" full-width/>
    </v-dialog>
    
    <v-dialog v-model="dialogColor" width="300"> 
      <v-card>
        <v-color-picker @update:color="changeColor($event)" :value="colorPicker"/> 
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogAddNewCard" v-model="dialogAddNewCard" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New {{getMeta(metaIdForNewCard).settings.nameSingular.toLowerCase()}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewCard" ref="formNewCard" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewCard" :rules="[nameRules]" label="Name" autofocus/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <v-dialog v-if="dialogAddNewItem" v-model="dialogAddNewItem" width="700">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New item for meta <b>{{getMeta(metaIdForNewItem).settings.name}}</b></span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewItem" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewItem" ref="formNewItem" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewItem" :rules="[nameRules]" label="Name"/>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <DialogListView v-if="dialogListView" :meta="listViewMeta" @close="dialogListView=false" />
  </div>
</template>

<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import NameRules from '@/mixins/NameRules.vue'
import ShowImageFunction from '@/mixins/ShowImageFunction.vue'
import MetaGetters from '@/mixins/MetaGetters.vue'
import CountryFlag from 'vue-country-flag'
import Countries from '@/components/elements/Countries.js'

export default {
  name: "DialogEditMultipleMetaCards",
  components: {
    vuescroll,
    CountryFlag,
    DialogListView: () => import('@/components/pages/meta/DialogListView.vue'),
	},
  beforeMount () {
    this.parseMetaInCard()
  },
  mixins: [ShowImageFunction, NameRules, MetaGetters,], 
  mounted () {
    this.$nextTick(function () {
      setTimeout(() => { this.panels = true }, 1000)
    })
  },
  data: () => ({
    modifiedMetaInCards: [],
    values: {},
    edits: {},
    calendar: false,
    calendarId: null,
    key: Date.now(),
    panels: false,
    listViewMeta: null,
    dialogColor: false,
    colorPicker: '#777777',
    countries: Countries,
    // add new items 
    dialogAddNewCard: false,
    metaIdForNewCard: null,
    nameForNewCard: '',
    validNewCard: false,
    dialogAddNewItem: false,
    metaIdForNewItem: null,
    nameForNewItem: '',
    validNewItem: false,
    dialogListView: false,
  }),
  computed: {
    selectedMeta() { return this.$store.state.Meta.selectedMeta },
    showIcons() { return this.$store.state.Settings.showIconsOfMetaInEditingDialog },
  },
  methods: {
    parseMetaInCard() {
      this.modifiedMetaInCards = _.cloneDeep(this.meta.settings.metaInCard)
      if (this.meta.settings.color) this.modifiedMetaInCards.push({id:'color', type:'specific'})
      if (this.meta.settings.country) this.modifiedMetaInCards.push({id:'country', type:'specific'})
      for (let i = 0; i < this.modifiedMetaInCards.length; i++) {
        const id = this.modifiedMetaInCards[i].id
        const type = this.modifiedMetaInCards[i].type
        this.edits[id] = 0
        if (type=='complex') { this.values[id] = []; continue }
        if (type=='specific') { 
          if (id=='color') this.values[id] = '#777777' 
          else if (id=='country') this.values[id] = [] 
          continue 
        }
        const simpleMetaType = this.getMeta(id).dataType
        if (simpleMetaType=='array') this.values[id] = []
        else if (simpleMetaType=='boolean') this.values[id] = false
        else if (simpleMetaType=='number'||simpleMetaType=='rating') this.values[id] = 0
        else this.values[id] = ''
      }
    },
    removeItem(item, id) { 
      const index = this.values[id].indexOf(item)
      if (index > -1) this.values[id].splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    setVal(value, metaId) { 
      let meta = this.getMeta(metaId)
      if (meta) {
        if (meta.type === 'complex') {
          value.sort((a,b)=>{
            a = this.getCard(a).meta.name
            b = this.getCard(b).meta.name
            return a.localeCompare(b)
          })
        }
        if (meta.type==='complex'||metaId==='country') {
          this.$refs[metaId][0].lazySearch = null
        }
      }
      this.values[metaId] = value 
    },
    close() { this.$store.state.Meta.dialogEditMetaCard = false },
    save() {
      this.selectedMeta.map(id => {
        let arr = _.pickBy(this.values, (v,k)=>{return this.edits[k]!==0})
        let old = this.$store.getters.metaCards.find({id:id}).get('meta').value()
        for (let metaId in arr) {
          let oldArr = old[metaId] || []
          if (this.edits[metaId]===2) arr[metaId] = _.union(oldArr, arr[metaId])
          if (this.edits[metaId]===3) arr[metaId] = oldArr.filter(i=>arr[metaId].indexOf(i)===-1)
          // sort
          let meta = this.getMeta(metaId)
          if (meta&&meta.type==='simple'&&meta.dataType==='array') arr[metaId].sort((a,b)=>{
            a = _.find(meta.settings.items, i=>i.id===a).name
            b = _.find(meta.settings.items, i=>i.id===b).name
            return a.localeCompare(b)
          }) 
          else if (meta&&meta.type==='complex') arr[metaId].sort((a,b)=>{
            a = this.getCard(a).meta.name
            b = this.getCard(b).meta.name
            return a.localeCompare(b)
          })
          else if (metaId==='country') arr[metaId].sort((a,b)=>a.localeCompare(b))
        }
        this.$store.getters.metaCards.find({id:id}).assign({edit: Date.now()}).get('meta').assign(arr).write()
      })
      this.$store.commit('updateMetaCards', this.selectedMeta)
      this.$store.state.Meta.dialogEditMetaCard = false 
    },
    openDialogAddNewCard(metaId) {
      this.dialogAddNewCard = true
      this.metaIdForNewCard = metaId
    },
    addNewCard() {
      this.$refs.formNewCard.validate()
      if (!this.validNewCard) return
      this.$store.dispatch('addMetaCard', { 
        id: shortid.generate(),
        metaId: this.metaIdForNewCard,
        meta: { name: this.nameForNewCard },
      })
      this.dialogAddNewCard = false
      this.nameForNewCard = ''
    },
    openDialogAddNewItem(metaId) {
      this.dialogAddNewItem = true
      this.metaIdForNewItem = metaId
    },
    addNewItem() {
      this.$refs.formNewItem.validate()
      if (!this.validNewItem) return
      this.$store.getters.meta.find({id:this.metaIdForNewItem}).get('settings.items')
        .push({ id:shortid.generate(), name: this.nameForNewItem }).write()
      this.key = Date.now()
      this.dialogAddNewItem = false
      this.nameForNewItem = ''
    },
    saveListView() { this.dialogListView = false },
    filterCards(cardObject, queryText, itemText) {
      let card = _.cloneDeep(cardObject)
      let query = queryText.toLowerCase()

      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      if (this.$store.state.Settings.typingFiltersDefault) {
        let index = card.meta.name.toLowerCase().indexOf(query)
        if (index > -1) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            let indexSub = card.meta.synonyms[i].toLowerCase().indexOf(query)
            if (indexSub > -1) return true
          }
          return false
        }
      } else {
        if (foundByChars(card.meta.name, query)) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            return foundByChars(card.meta.synonyms[i], query)
          }
          return false
        }
      }
    },
    toggleEditMode(meta) {
      // 0 - disabled, 1 - replace, 2 - add (for arrays), 3 - remove (for arrays)
      let type
      if (meta.type === 'complex') type = 'array'
      else type = this.getMeta(meta.id).dataType
      ++this.edits[meta.id]
      if (this.edits[meta.id]>1 && (type!=='array'&&meta.id!=='country')) this.edits[meta.id] = 0
      else if (this.edits[meta.id]>3 && (type==='array'||meta.id=='country')) this.edits[meta.id] = 0
      this.key = Date.now()
    },
    changeColor(e) { 
      this.colorPicker = e.hex
      this.values['color'] = e.hex
    },
    filterCountry(cardObject, queryText, itemText) {
      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      let filtersDefault = this.$store.state.Settings.typingFiltersDefault 
      let text = itemText.toLowerCase()
      let query = queryText.toLowerCase()

      if (filtersDefault) return text.indexOf(query) > -1
      else return foundByChars(text, query)
    },
    removeCountry(item) { 
      const index = this.values.country.indexOf(item.name)
      if (index > -1) this.values.country.splice(index, 1)
    },
  },
};
</script>