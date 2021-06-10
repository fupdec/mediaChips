<template>
  <div>
    <v-dialog v-model="$store.state.Meta.dialogEditMetaCard" scrollable persistent max-width="980" width="70vw">
      <v-card>
        <v-toolbar color="primary">
          <span class="headline">Editing of {{meta.settings.nameSingular.toLowerCase()}} 
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <b v-on="click" @click="copyNameToClipboard" style="cursor:pointer;" title="Copy name to clipboard">{{card.meta.name}}</b>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </span>
          <v-spacer></v-spacer>
          <v-btn @click="close" class="mx-4" outlined> <v-icon left>mdi-close</v-icon> Close</v-btn>
          <v-btn @click="save" outlined> <v-icon left>mdi-content-save</v-icon> Save</v-btn>
        </v-toolbar>
        <div class="d-flex justify-space-between pa-4">
          <v-btn v-if="meta.settings.scraper" @click="dialogScraper=true" small rounded color="secondary"> 
            <v-icon left>mdi-magnify</v-icon> Scrap data </v-btn>
          <v-spacer v-if="meta.settings.scraper"></v-spacer>
          <v-chip label outlined small> <v-icon left small>mdi-calendar-plus</v-icon> Added: {{dateAdded}} </v-chip>
          <span class="caption mx-4">id: {{card.id}}</span>
          <v-chip label outlined small> <v-icon left small>mdi-calendar-edit</v-icon> Last edit: {{dateEdit}} </v-chip>
        </div>
        <vuescroll>
          <v-card-text>
            <v-form v-model="valid" ref="form" @submit.prevent>
              <v-container fluid>
                <v-row>
                  <v-col cols="12" lg="6" class="pt-0 remove-details-margin">
                    <v-text-field v-model="name" :rules="[nameRules]" label="Name" 
                      :prepend-inner-icon="showIcons?`mdi-${getMeta('name').settings.icon}`:''"/>
                  </v-col>
                  <v-col v-if="meta.settings.synonyms" cols="12" lg="6" class="pt-0 remove-details-margin">
                    <v-text-field v-model="synonyms" label="Synonyms"
                      :prepend-inner-icon="showIcons?`mdi-${getMeta('synonyms').settings.icon}`:''"/>
                  </v-col>
                  <v-col v-if="meta.settings.country" cols="12" lg="6" class="pt-0">
                    <v-autocomplete v-model="country" :items="countries" multiple 
                      item-text="name" item-value="name" label="Country" 
                      class="nation-chips hidden-close nation-select" hide-selected
                      :menu-props="{contentClass:'list-with-preview'}"
                      :prepend-inner-icon="showIcons?`mdi-${getMeta('country').settings.icon}`:''">
                      <template v-slot:selection="data">
                        <v-chip @click="data.select" @click:close="removeCountry(data.item)"
                          v-bind="data.attrs" class="my-1" outlined close small
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

                  <v-col v-for="(m,i) in metaInCard" :key="i+key" cols="12" lg="6" class="pt-0">
                    <v-autocomplete v-if="m.type=='complex'" :items="getCards(m.id)" 
                      @input="setVal($event,m.id)" :value="values[m.id]"
                      multiple hide-selected 
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
                      :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                      clearable @click:clear="setVal('', m.id)"
                      :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>

                    <v-text-field v-if="m.type=='simple'&&(getMeta(m.id).dataType==='number')" 
                      @input="setVal($event,m.id)" :value="values[m.id]" type="number"
                      :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                      :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>

                    <v-autocomplete v-if="m.type=='simple'&&getMeta(m.id).dataType==='array'" 
                      :items="getMeta(m.id).settings.items" item-value="id" item-text="name"
                      @input="setVal($event,m.id)" :value="values[m.id]" multiple
                      :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                      :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''" 
                      append-outer-icon="mdi-plus" @click:append-outer="openDialogAddNewItem(m.id)"/>
                    
                    <v-switch v-if="m.type=='simple'&&getMeta(m.id).dataType==='boolean'" 
                      :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint" persistent-hint
                      @change="setVal($event,m.id)" :value="values[m.id]"
                      :prepend-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>
                      
                    <v-text-field v-if="m.type=='simple'&&getMeta(m.id).dataType==='date'" 
                      :value="values[m.id]" @click="calendarId=m.id,calendar=true" 
                      :label="getMeta(m.id).settings.name" :hint="getMeta(m.id).settings.hint"
                      clearable @click:clear="setVal('', m.id)" readonly persistent-hint
                      :prepend-inner-icon="showIcons?`mdi-${getMeta(m.id).settings.icon}`:''"/>

                  </v-col>
                  <v-col v-if="meta.settings.color" cols="12" lg="6">
                    <v-btn @click="dialogColor=true" :color="color" block rounded class="mt-3">Pick another color for card</v-btn>
                  </v-col>
                  <v-col v-if="meta.settings.bookmark" cols="12" lg="6">
                    <v-textarea v-model="bookmark" hide-details clearable auto-grow outlined label="Bookmark" 
                      :prepend-icon="showIcons?`mdi-${getMeta('bookmark').settings.icon}`:''"/>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
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
      <v-color-picker v-model="color" hide-mode-switch/>
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
          <v-btn @click="saveListView" outlined> <v-icon left>mdi-content-save</v-icon> save </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
        </v-card-text>
      </v-card>
    </v-dialog>

    <Scraper v-if="dialogScraper" :dialog="dialogScraper" :name="card.meta.name" :values="valuesForScraper"
      @closeScraper="dialogScraper=false" @getValues="getScraperValues($event)" @updateKey="key=Date.now()"/>
  </div>
</template>

<script>
const { clipboard } = require('electron')
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import NameRules from '@/mixins/NameRules'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import MetaGetters from '@/mixins/MetaGetters'
import Scraper from '@/components/pages/meta/Scraper.vue'
import CountryFlag from 'vue-country-flag'
import Countries from '@/mixins/Countries'

export default {
  name: "DialogEditSingleMetaCard",
  components: {
    vuescroll,
    Scraper,
    CountryFlag,
	},
  beforeMount () {
    this.name = this.card.meta.name || ''
    this.color = this.card.meta.color || '#777777'
    this.synonyms = this.card.meta.synonyms===undefined? '' : this.card.meta.synonyms.join(', ')
    this.country = this.card.meta.country || []
    this.bookmark = this.card.meta.bookmark || ''
    this.parseMetaInCard()
  },
  mixins: [ShowImageFunction, NameRules, MetaGetters, Countries,], 
  mounted () {
    this.$nextTick(function () {
      setTimeout(() => { this.panels = true }, 1000)
    })
  },
  data: () => ({
    valid: false,
    values: {},
    calendar: false,
    calendarId: null,
    name: '',
    synonyms: '',
    country: [],
    dialogColor: false,
    color: '#777777',
    bookmark: '',
    dialogScraper: false,
    tooltipCopyName: false,
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
    metaCardId() { return this.$route.query.cardId },
    oldValues() { return this.$store.getters.metaCards.find({id:this.card.id}).get('meta').cloneDeep().value() },
    card() {
      let metaCards = this.$store.getters.metaCards.filter({metaId:this.metaId})
      if (this.metaCardId) return metaCards.find({id:this.metaCardId}).value()
      let ids = this.$store.state.Meta.selectedMeta
      return metaCards.find({id:ids[0]}).value()
    },
    dateAdded() {
      let date = new Date(this.card.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.card.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    valuesForScraper() {
      let values = _.cloneDeep(this.values)
      values.name = this.name
      if (this.meta.settings.synonyms) values.synonyms = this.synonyms
      return values
    },
    showIcons() { return this.$store.state.Settings.showIconsOfMetaInEditingDialog },
  },
  methods: {
    parseMetaInCard() {
      let metaInCard = this.meta.settings.metaInCard
      for (let i = 0; i < metaInCard.length; i++) {
        const id = metaInCard[i].id
        const type = metaInCard[i].type
        if (type=='complex') { this.values[id] = _.cloneDeep(this.card.meta[id]) || []; continue }
        const simpleMetaType = this.getMeta(id).dataType
        let defaultValue = ''
        if (simpleMetaType=='array') defaultValue = []
        if (simpleMetaType=='boolean') defaultValue = false
        if (simpleMetaType=='number') defaultValue = 0
        this.values[id] = _.cloneDeep(this.card.meta[id]) || defaultValue
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
    removeItem(item, id) { 
      const index = this.values[id].indexOf(item)
      if (index > -1) this.values[id].splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeCountry(item) { 
      const index = this.country.indexOf(item.name)
      if (index > -1) this.country.splice(index, 1)
    },
    setVal(value, id) { this.values[id] = value },
    close() { this.$store.state.Meta.dialogEditMetaCard = false },
    save() {
      this.$refs.form.validate()
      if (!this.valid) return

      let presetValues = { name: this.name }
      if (this.meta.settings.synonyms) presetValues.synonyms = this.parseStringToArray(this.synonyms)
      if (this.meta.settings.color) presetValues.color = this.color
      if (this.meta.settings.country) presetValues.country = this.country
      if (this.meta.settings.bookmark) presetValues.bookmark = this.bookmark

      let newValues = {...this.oldValues, ...presetValues, ...this.values}
      this.$store.getters.metaCards.find({id:this.card.id}).assign({edit: Date.now()}).get('meta').assign(newValues).write()
      this.$store.state.Meta.dialogEditMetaCard = false 
      this.$store.commit('updateMetaCards', [this.card.id])
    },
    getScraperValues(values) { 
      this.dialogScraper = false
      let specificMeta = ['name']
      if (this.meta.settings.synonyms) specificMeta.push('synonyms')
      if (this.meta.settings.country) specificMeta.push('country')
      for (const key in values) {
        if (specificMeta.includes(key)) { this[key] = values[key]; continue }
        let metaItem = _.find(this.meta.settings.metaInCard, i=>i.scraperField===key)
        if (!metaItem) continue // if not assigned
        let meta = this.getMeta(metaItem.id)
        if (meta.type === 'simple') {
          if (meta.dataType === 'array') {
            let arr = values[key].map(name => _.find(meta.settings.items, {name}).id)
            this.values[meta.id] = arr
          } else if (meta.dataType === 'number') this.values[meta.id] = Number(values[key])
          else this.values[meta.id] = values[key]
        } else if (meta.type === 'complex') {
          let metaCards = this.$store.getters.metaCards
          let arr = values[key].map(name => metaCards.find(card=>card.meta.name===name).value().id)
          this.values[meta.id] = arr
        }
      }
      console.log(this.values)
    },
    copyNameToClipboard() {
      this.tooltipCopyName = true
      clipboard.writeText(this.card.meta.name)
      setTimeout(() => { this.tooltipCopyName = false }, 3000)
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
    saveListView() {
    },
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

      let filtersDefault = this.$store.state.Settings.typingFiltersDefault 

      if (filtersDefault) {
        let index = card.name.toLowerCase().indexOf(query)
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
  },
};
</script>