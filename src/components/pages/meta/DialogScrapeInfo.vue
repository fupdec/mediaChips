<template>
  <v-dialog v-model="$store.state.Meta.dialogScrapeInfoMetaCard" persistent scrollable max-width="800">
    <v-card >
      <v-toolbar color="primary">
        <div class="headline">Scrape info for {{meta.settings.name.toLowerCase()}}</div>
        <v-spacer></v-spacer>
        <v-btn @click="$store.state.Meta.dialogScrapeInfoMetaCard=false" :disabled="isProcessRunning" outlined><v-icon left>mdi-check</v-icon>ok</v-btn>
      </v-toolbar>
      <div class="mt-4 text-center">Search progress {{found.length}} / {{$store.state.Meta.selectedMeta.length}}</div>
      <div class="px-6 my-2"><v-progress-linear v-if="isProcessRunning" height="5" color="secondary" rounded indeterminate/></div>
      <vuescroll>
        <v-card-text>
          <v-expansion-panels accordion>
            <v-expansion-panel v-for="(f,i) in found" :key="i">
              <v-expansion-panel-header>
                <div>
                  <v-icon v-if="f.success" left small color="green">mdi-check</v-icon> 
                  <v-icon v-else left small color="red">mdi-close</v-icon> 
                  {{f.name}}
                </div>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <span v-for="(v,k) in f.info" :key="k+v+i">
                  <b>{{k}}</b>: 
                  <span v-if="typeof v === 'object'">{{v.join(',')}}</span>
                  <span v-else>{{v}}</span>;
                </span>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>


<script>
const axios = require("axios")
const cheerio = require("cheerio")
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'
import Scrapers from '@/mixins/Scrapers'

export default {
  name: 'DialogScrapeInfo',
  components: { vuescroll, },
  mixins: [Scrapers, MetaGetters], 
  mounted() {
    this.$nextTick(function () {
      if (this.meta.settings.synonyms) this.specificMeta.push('synonyms')
      if (this.meta.settings.country) this.specificMeta.push('country')
      this.tryConnect()
    })
  },
  data: () => ({
    isProcessRunning: false,
    transfer: { current: {}, found: {}, },
    nonexistent: { simple: [], complex: [] },
    specificMeta: ['name'],
    found: [],
    months: ['january','february','march','april','may','june','july','august','september','october','november','december'],
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    metaList() { return this.$store.getters.meta.filter({type:'complex'}).value() },
  },
  methods: {
    async tryConnect() {
      this.isProcessRunning = true
      let ids = this.$store.state.Meta.selectedMeta
      for (const id of ids) {
        const card = this.getCard(id)
        let success = false
        let pName = card.meta.name.replace(' ', '-').toLowerCase()
        let queryPPage = `https://www.freeones.com/${pName}/bio`
        await axios.get(queryPPage).then(async (response) => {
          if (response.status !== 200) return
          await this.scrapeInfo(response, id)
          success = true
        }, async (error) => { 
          if (error.response.status!==404) return
          let nameUrl = card.meta.name.replace(' ', '%20').toLowerCase()
          let querySearch = `https://www.freeones.com/babes?q=${nameUrl}&s=rank.currentRank&o=asc&l=12&p=1&v=grid`
          await axios.get(querySearch).then(async (response) => {
            const html = response.data
            const $ = cheerio.load(html)
            let link = $('.grid-item > a').first().attr('href')
            if (!link) return
            link = link.replace('feed','bio')
            let queryFPage = `https://www.freeones.com${link}`
            await axios.get(queryFPage).then(async (response) => {
              await this.scrapeInfo(response, id)
              success = true
            }, (error) => {  })
          }, (error) => {  })
        })
        this.found.push({
          name: card.meta.name,
          success,
          info: this.transfer.found,
        })
        this.transfer = { current: {}, found: {}, }
      }
      setTimeout(() => { this.$store.commit('updateMetaCards', ids) }, 1000)
      this.isProcessRunning = false
    },
    async scrapeInfo(response, id) {
      return new Promise(async resolve => {
        const html = response.data
        const $ = cheerio.load(html)
        await this.freeonesMeta($, id)
        await this.applyFoundValues(id)
        this.$store.getters.metaCards.find({id}).assign({edit: Date.now()}).get('meta').assign(this.transfer.current).write()
        resolve()
      })
    },
    async applyFoundValues(id) {
      return new Promise(async resolve => {
        const card = this.getCard(id)
        let metaInCard = this.meta.settings.metaInCard
        for (let i = 0; i < metaInCard.length; i++) {
          const id = metaInCard[i].id
          const type = metaInCard[i].type
          if (type=='complex') { this.transfer.current[id] = _.cloneDeep(card.meta[id]) || []; continue }
          const simpleMetaType = this.getMeta(id).dataType
          let defaultValue = ''
          if (simpleMetaType=='array') defaultValue = []
          else if (simpleMetaType=='boolean') defaultValue = false
          else if (simpleMetaType=='number'||simpleMetaType=='rating') defaultValue = 0
          this.transfer.current[id] = _.cloneDeep(card.meta[id]) || defaultValue
        } // copy card values to transfer.current

        await this.validateNonexistent('found') 
        if (this.nonexistent.simple.length || this.nonexistent.complex.length) await this.addNewItems()

        let values = this.transfer.found
        for (const key in values) {
          if (this.specificMeta.includes(key)) { 
            if (key === 'synonyms') this.transfer.current[key] = this.parseStringToArray(values[key])
            else this.transfer.current[key] = values[key] 
            continue 
          }
          let metaItem = _.find(this.meta.settings.metaInCard, i=>i.scraperField===key)
          if (!metaItem) continue // if not assigned
          let meta = this.getMeta(metaItem.id)
          if (meta.type === 'simple') {
            if (meta.dataType === 'array') {
              let arr = values[key].map(name => _.find(meta.settings.items, {name}).id)
              this.transfer.current[meta.id] = arr
            } else if (meta.dataType === 'number') this.transfer.current[meta.id] = Number(values[key])
            else this.transfer.current[meta.id] = values[key]
          } else if (meta.type === 'complex') {
            let metaCards = this.$store.getters.metaCards.filter({metaId:meta.id})
            let arr = values[key].map(name => metaCards.find(card=>card.meta.name===name).value().id)
            this.transfer.current[meta.id] = arr
          }
        }
        resolve()
      })
    },
    addNewItems() {
      return new Promise(resolve => {
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
        this.nonexistent = { simple: [], complex: [] }
        resolve()
      })
    },
    validateNonexistent(typeOfTransferedInfo) { 
      return new Promise(resolve => {
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
        resolve()
      })
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
    getMetaNamesAndUpdateCurrent(key) { 
      let metaItem = this.getMetaByField(key)
      let meta = this.getMeta(metaItem.id)
      let values = this.transfer.current[metaItem.id]
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
    getMetaByField(field) { 
      if (this.specificMeta.includes(field)) return {id: field}
      return _.find(this.meta.settings.metaInCard, i=>i.scraperField===field) 
    },
  },
}
</script>