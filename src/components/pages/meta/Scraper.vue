<template>
  <div>
    <v-dialog :value="dialog" @input="closeDialog" scrollable max-width="1200px">
      <v-card class="pb-4">
        <v-toolbar color="primary">
          <div class="headline">
            Scrape data for
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <b v-on="click" @click="copyNameToClipboard" style="cursor:pointer;" title="Copy name to clipboard">{{name}}</b>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          <v-spacer></v-spacer>
          <v-btn outlined @click="closeDialog"><v-icon left>mdi-close</v-icon>Close</v-btn>
        </v-toolbar>
        <v-card-actions>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="queryString" hide-details dense outlined
                  placeholder="Performer name or alias" :disabled="searchInProgress"
                  @click:append-outer="pasteQueryString" 
                  append-outer-icon="mdi-clipboard-text-outline"/>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn @click="findMeta('iafd')" :loading="searchInProgress"
                  color="secondary" block :disabled="searchInProgress"
                > <v-icon left>mdi-magnify</v-icon> iafd.com </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn @click="findMeta('freeonce')" :loading="searchInProgress"
                  color="secondary" block :disabled="searchInProgress"
                > <v-icon left>mdi-magnify</v-icon> freeones.com </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-actions>
        <vuescroll>
          <v-card-text class="py-0">
            <v-container fluid class="py-0">
              <v-row>
                <v-col v-if="notFound" cols="12" class="text-center" v-once>
                  <v-icon x-large>mdi-magnify-close</v-icon> <h2 class="mt-4">Nothing found</h2>
                </v-col>
                <v-col v-if="searchInProgress" cols="12">
                  <v-row>
                    <v-col v-for="(c, i) in [1,2,3,4,5,6]" :key="i" cols="2"><v-skeleton-loader type="card"/></v-col>
                  </v-row>
                </v-col>
                <v-col v-else cols="12">
                  <v-row>
                    <v-col cols="4" xs="4" sm="3" md="2" v-for="(f, i) in found" :key="i">
                      <v-hover>
                        <template v-slot:default="{ hover }">
                          <v-card height="100%" outlined>
                            <v-img :src="f.img" :aspect-ratio="1" position="center top" 
                              style="background-color:#777;"
                            > <country-flag :country='findCountryCode(f.country)' size='normal'/>
                            </v-img>
                            <v-card-text>
                              <div class="body-2">{{f.name}}</div>
                              <v-divider v-if="f.synonyms" class="my-2"></v-divider>
                              <div class="caption" style="line-height:1;">{{f.synonyms}}</div>
                            </v-card-text>
                            <v-fade-transition>
                              <v-overlay v-if="hover" absolute color="secondary">
                                <v-btn v-if="resultFromFreeones" @click="getInfo(f.link, 'freeonce', f.name)" color="primary" :loading="searchInProgress">
                                  <v-icon left>mdi-information-variant</v-icon> Get info </v-btn>
                                <v-btn v-else @click="getInfo(f.link, 'iafd', f.name)" color="primary" :loading="searchInProgress">
                                  <v-icon left>mdi-information-variant</v-icon> Get info </v-btn>
                              </v-overlay>
                            </v-fade-transition>
                          </v-card>
                        </template>
                      </v-hover>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogTransferInfo" scrollable max-width="960">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Transfer information</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogTransferInfo=false" outlined><v-icon left>mdi-close</v-icon>Cancel</v-btn>
          <v-btn @click="applyTransfered" class="mx-4" outlined><v-icon left>mdi-transfer</v-icon>Apply transfered</v-btn>
          <v-btn @click="applyFounded" outlined><v-icon left>mdi-magnify</v-icon>Apply found</v-btn>
        </v-toolbar>
        <v-card-actions>
          <v-btn @click="initCurrentValues" small rounded color="secondary" class="mt-4 pr-4">
            <v-icon left>mdi-restore</v-icon> Restore all </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="transferAll" small rounded color="secondary" class="mt-4 pr-4">
            <v-icon left>mdi-transfer-left</v-icon> Transfer all </v-btn>
        </v-card-actions>
        <vuescroll>
          <v-card-text>
            <v-simple-table dense class="transfer-table">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-center pl-8" style="width:20%">Meta</th>
                    <th class="text-center" style="width:10%">Parameter</th>
                    <th class="text-center pr-8" style="width:35%">Current</th>
                    <th class="text-center" style="width:35%">Found</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key, i) in transfer.found" :key="i+transferedKey">
                    <td v-if="getMetaByField(key)" class="text-center pl-8">
                      <v-btn @click="restore(key)" icon small class="restore-btn" color="secondary"> <v-icon>mdi-restore</v-icon> </v-btn> 
                      <v-icon size="20">mdi-{{ getMeta(getMetaByField(key).id).settings.icon }}</v-icon>
                      {{ getMeta(getMetaByField(key).id).settings.name }}
                    </td>
                    <td v-else class="text-center pl-8 red--text">Not assigned</td>
                    
                    <td class="text-center">{{ key }}</td>
                    
                    <td v-if="getMetaByField(key)" class="text-center pr-8">
                      <span>{{ transfer.current[key] }}</span> 
                      <v-btn @click="transferValue(key, value)" icon small class="transfer-btn" color="secondary">
                        <v-icon>mdi-transfer-left</v-icon>
                      </v-btn>
                    </td>
                    <td v-else class="text-center red--text pr-8">Not available</td>
                    
                    <td class="text-center">{{ value }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogNonexistent" scrollable persistent max-width="600">
      <v-card>
        <v-toolbar color="warning">
          <div class="headline">Add new items?</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNonexistent=false" class="mx-4" outlined><v-icon left>mdi-close</v-icon>No</v-btn>
          <v-btn @click="addNewItems" outlined><v-icon left>mdi-check</v-icon>Yes</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text>
            <v-alert type="warning" text dense outlined>The following items have not been found in the database. <br> Do you want to add them?</v-alert>
            <div v-for="(vals, type, j) in nonexistent" :key="j">
              <div v-if="nonexistent[type].length">
                <div class="body-1 my-2">For {{type}} meta:</div>
                <v-divider class="mb-2"></v-divider>
                <div v-for="(valObj, indexObj) in nonexistent[type]" :key="indexObj">
                  <div v-for="(items, metaId, j) in valObj" :key="j" class="d-flex align-center justify-space-between"> 
                    <div>
                      <v-icon left>mdi-{{getMeta(metaId).settings.icon}}</v-icon>
                      <span>{{getMeta(metaId).settings.name}}</span><br>
                    </div>
                    <div><v-chip v-for="(item, itemIndex) in items" :key="itemIndex" class="ma-1">{{item}}</v-chip></div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const shortid = require('shortid')
const { clipboard } = require('electron')

import vuescroll from 'vuescroll'
import CountryFlag from 'vue-country-flag'
import Scrapers from '@/mixins/Scrapers'
import Countries from '@/components/elements/Countries'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  props: {
    dialog: Boolean,
    name: String,
    values: Object,
  },
  name: "Scraper",
  components: { vuescroll, CountryFlag },
  mixins: [Scrapers, MetaGetters], 
  beforeMount() {
    this.queryString = this.name
    if (this.meta.settings.synonyms) this.specificMeta.push('synonyms')
    if (this.meta.settings.country) this.specificMeta.push('country')
  },
  mounted () {
    this.$nextTick(function () {
      this.initCurrentValues()
    })
  },
  data: () => ({
    queryString: '',
    searchInProgress: false,
    notFound: false,
    resultFromFreeones: false,
    found: [],
    tooltipCopyName: false,
    dialogTransferInfo: false,
    transfer: {
      current: {},
      found: {},
    },
    transferedKey: Date.now(),
    specificMeta: ['name'],
    dialogNonexistent: false,
    nonexistent: { simple: [], complex: [] }
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    initCurrentValues() {
      for (const key in this.transfer.found) {
        if (this.specificMeta.includes(key)) { this.transfer.current[key] = this.values[key]; continue }
        let metaItem = this.getMetaByField(key)
        if (!metaItem) continue
        this.getMetaNamesAndUpdateCurrent(key)
      }
      this.transferedKey = Date.now()
    },
    restore(key) {
      this.getMetaNamesAndUpdateCurrent(key)
      this.transferedKey = Date.now()
    },
    getMetaNamesAndUpdateCurrent(key) { 
      let metaItem = this.getMetaByField(key)
      let meta = this.getMeta(metaItem.id)
      let values = this.values[metaItem.id]
      if (meta.type === 'simple') {
        if (meta.dataType === 'array') {
          let arr = values.map(id => _.find(meta.settings.items, {id}).name)
          this.transfer.current[key] = arr
        } else this.transfer.current[key] = values
      } else if (meta.type === 'complex') {
        let metaCards = this.$store.getters.metaCards.filter({metaId:meta.id})
        let arr = values.map(id => metaCards.find({id}).value().meta.name)
        this.transfer.current[key] = arr
      }
    },
    transferValue(key, value) { 
      this.transfer.current[key] = value
      this.transferedKey = Date.now()
    },
    transferAll() {
      for (const key in this.transfer.found) {
        let meta = this.getMetaByField(key)
        if (meta) this.transfer.current[key] = this.transfer.found[key]
      }
      this.transferedKey = Date.now()
    },
    closeDialog() { this.$emit('closeScraper')},
    validateNonexistent(typeOfTransferedInfo) { 
      this.nonexistent = { simple: [], complex: [] }
      let values = this.transfer[typeOfTransferedInfo]
      let metaCards = this.$store.getters.metaCards
      for (const key in values) {
        if (this.specificMeta.includes(key)) continue
        let metaItem = _.find(this.meta.settings.metaInCard, i=>i.scraperField===key)
        if (!metaItem) continue // if not assigned
        let meta = this.getMeta(metaItem.id)
        let value = values[key]
        let nonexistent = []
        if (meta.type === 'simple' && meta.dataType !== 'array') continue
        for (let i = 0; i < value.length; i++) {
          let found
          if (meta.type === 'simple') found = _.find(meta.settings.items, j=>j.name.trim().toLowerCase()===value[i].trim().toLowerCase())
          else found = metaCards.filter({metaId:meta.id}).find(j=>j.meta.name.trim().toLowerCase()===value[i].trim().toLowerCase()).value()
          if (!found) nonexistent.push(value[i])
        }
        if (nonexistent.length) this.nonexistent[meta.type].push({[meta.id]:nonexistent})
      }
      if (this.nonexistent.simple.length || this.nonexistent.complex.length) this.dialogNonexistent = true
    },
    addNewItems() {
      let simpleItems = this.nonexistent.simple
      let complexItems = this.nonexistent.complex
      if (simpleItems.length) {
        for (let i = 0; i < simpleItems.length; i++) {
          const item = simpleItems[i]
          for (let metaId in item) {
            const newItems = item[metaId]
            for (let j = 0; j < newItems.length; j++) {
              const newItemName = newItems[j]
              const newItemId = shortid.generate()
              const newItemGenerated = { id: newItemId, name: newItemName }
              this.$store.getters.meta.find({id:metaId}).get('settings.items').push(newItemGenerated).write()
            }
          }
        }
      }
      if (complexItems.length) {
        for (let i = 0; i < complexItems.length; i++) {
          const item = complexItems[i]
          for (let metaId in item) {
            const newItems = item[metaId]
            for (let j = 0; j < newItems.length; j++) {
              const newItemName = newItems[j]
              const newItemId = shortid.generate()
              const newCard = { id:newItemId, metaId, meta:{name:newItemName} }
              this.$store.dispatch('addMetaCard', newCard)
            }
          }
        }
      }
      this.$emit('updateKey') 
      this.nonexistent = { simple: [], complex: [] }
      this.dialogNonexistent = false
    },
    applyTransfered() {
      this.validateNonexistent('current') 
      if (this.nonexistent.simple.length || this.nonexistent.complex.length) return
      this.$emit('getValues', this.transfer.current) 
    },
    applyFounded() { 
      this.validateNonexistent('found') 
      if (this.nonexistent.simple.length || this.nonexistent.complex.length) return
      this.$emit('getValues', this.transfer.found) 
    },
    getMetaByField(field) { 
      if (this.specificMeta.includes(field)) return {id: field}
      return _.find(this.meta.settings.metaInCard, i=>i.scraperField===field) 
    },
    copyNameToClipboard() {
      this.tooltipCopyName = true
      clipboard.writeText(this.name)
      setTimeout(() => { this.tooltipCopyName = false }, 3000)
    },
    pasteQueryString() { this.queryString = clipboard.readText() },
    findCountryCode(country) {
      if (country == '' || country === undefined) return ''
      let countryName = country.toLowerCase()
      let code = _.filter(Countries, country => (country.name.toLowerCase().includes(countryName)) )[0]
      if (code == undefined) return ''
      else return code.code
    },
  },
  watch: {
  }
}
</script>


<style lang="less">
.transfer-table {
  td {
    position: relative;
  }
  .restore-btn,
  .transfer-btn {
    position: absolute; 
    top: 0;
    bottom: 0;
    margin: auto;
  }
  .restore-btn { 
    left: 0;
  }
  .transfer-btn { 
    right: 0;
  }
}
</style> 