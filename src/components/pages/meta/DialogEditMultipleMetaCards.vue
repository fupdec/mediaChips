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
                <v-icon v-html="`mdi-plus-circle-outline`" dark small left/>  will be added to the existing one (only for arrays) </span>
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
                <v-col v-for="(m,i) in metaInCard" :key="i+key" cols="12" class="d-flex align-center pt-0">
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
                    <v-tooltip v-else top>
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on" v-html="`mdi-cancel`" size="18"/>
                      </template>
                      <span>No action</span>
                    </v-tooltip>
                  </v-btn>

                  <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                    @input="setVal($event,m.id)" :value="values[m.id]"
                    multiple hide-selected :disabled="edits[m.id]===0"
                    :label="getMeta(m.id).settings.name" item-value="id"
                    :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"
                    append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewCard(m.id)"
                    append-icon="mdi-chevron-down" @click:append="dialogListView=true"
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
    
    <!-- TODO add color editing like for single meta -->

    <v-dialog v-if="dialogAddNewCard" v-model="dialogAddNewCard" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">New {{getMeta(metaIdForNewCard).settings.nameSingular.toLowerCase()}}</span>
          <v-spacer></v-spacer>
          <v-btn @click="addNewCard" outlined> <v-icon left>mdi-plus</v-icon> Add </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-form v-model="validNewCard" ref="formNewCard" class="flex-grow-1" @submit.prevent>
            <v-text-field v-model="nameForNewCard" :rules="[nameRules]" label="Name"/>
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
    
    <v-dialog v-model="dialogListView" width="500">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">List view</span>
          <v-spacer></v-spacer>
          <v-btn @click="saveListView" outlined> <v-icon left>mdi-check</v-icon> ok </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          Congratulations, you've found the missing feature! <br>
          Customizing and sorting the list will be available in the next version of the application.
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import NameRules from '@/mixins/NameRules'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: "DialogEditMultipleMetaCards",
  components: {
    vuescroll,
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
    values: {},
    edits: {},
    calendar: false,
    calendarId: null,
    key: Date.now(),
    panels: false,
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
      let metaInCard = this.meta.settings.metaInCard
      for (let i = 0; i < metaInCard.length; i++) {
        const id = metaInCard[i].id
        const type = metaInCard[i].type
        this.edits[id] = 0
        if (type=='complex') { this.values[id] = []; continue }
        const simpleMetaType = this.getMeta(id).dataType
        if (simpleMetaType=='array') this.values[id] = []
        else if (simpleMetaType=='boolean') this.values[id] = false
        else if (simpleMetaType=='number') this.values[id] = 0
        else this.values[id] = ''
      }
    },
    removeItem(item, id) { 
      const index = this.values[id].indexOf(item)
      if (index > -1) this.values[id].splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    setVal(value, id) { this.values[id] = value },
    close() { this.$store.state.Meta.dialogEditMetaCard = false },
    save() {
      this.selectedMeta.map(id => {
        let arr = _.pickBy(this.values, (v,k)=>{return this.edits[k]!==0})
        let old = this.$store.getters.metaCards.find({id:id}).get('meta').value()
        for (let metaId in arr) {
          if (this.edits[metaId]===2) arr[metaId] = _.union(old[metaId] || [], arr[metaId])
        }
        console.log(arr)
        this.$store.getters.metaCards.find({id:id}).assign({edit: Date.now()}).get('meta').assign(arr).write()
      })
// TODO add sorting for arrays
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
      // 0 - disabled, 1 - replace, 2 - add (for arrays)
      let type
      if (meta.type === 'complex') type = 'array'
      else type = this.getMeta(meta.id).dataType
      if (this.edits[meta.id]===1 && type!=='array') this.edits[meta.id] = 0
      else if (this.edits[meta.id]===2 && type==='array') this.edits[meta.id] = 0
      else this.edits[meta.id] = ++this.edits[meta.id]
      this.key = Date.now()
    },
  },
};
</script>