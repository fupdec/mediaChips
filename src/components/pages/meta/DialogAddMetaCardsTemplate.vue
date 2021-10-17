<template>
<div>
  <v-dialog v-model="dialog" persistent scrollable max-width="600">
    <v-card>
      <v-toolbar color="primary">
        <div class="headline">Adding meta cards </div>
        <v-spacer></v-spacer>
        <v-btn @click="close" :disabled="isProcessRunning" class="mr-4" outlined><v-icon left>mdi-cancel</v-icon>Cancel</v-btn>
        <v-btn @click="start" :disabled="isProcessRunning||!valid||(!settings.performers.value&&!settings.tags.value&&!settings.websites.value)" outlined><v-icon left>mdi-plus</v-icon>Add</v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text>
          <v-alert type="info" text outlined dense>
            Add most popular performers from "freeones.com", tags, websites. <br>
            To get performers you need an internet connection.
          </v-alert>

          <v-form ref="form" v-model="valid" :disabled="isProcessRunning">
          <div class="d-flex align-center">
            <v-switch v-model="settings.performers.value" label="Add performers to:" class="mr-4"/>
            <v-autocomplete v-model="settings.performers.meta" :disabled="!settings.performers.value" :items="metaList"
              label="Meta with performers" placeholder="Please select the meta for which performers will be added" 
              :rules="settings.performers.value?[v=>!!v||'Meta is required']:[]" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
            </v-autocomplete>
          </div>
          <div class="d-flex align-center">
            <div class="mr-4">The number of performers to be added: {{numberPerformers}}</div>
            <v-slider v-model="numberPerformers" :disabled="!settings.performers.value" hide-details step="96" min="96" max="960" class="mx-4"/>
          </div>
          <div class="mb-4">
            <div>Performers received: {{found.length}} / {{numberPerformers}}</div>
            <v-progress-linear v-if="isProcessRunning" height="5" color="secondary" rounded indeterminate/>
          </div>

          <div class="d-flex align-center">
            <v-switch v-model="settings.tags.value" label="Add tags to:" class="mr-4"/>
            <v-autocomplete v-model="settings.tags.meta" :disabled="!settings.tags.value" :items="metaList"
              label="Meta with tags" placeholder="Please select the meta for which tags will be added" 
              :rules="settings.tags.value?[v=>!!v||'Meta is required']:[]" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
            </v-autocomplete>
          </div>

          <div class="d-flex align-center">
            <v-switch v-model="settings.websites.value" label="Add websites to:" class="mr-4"/>
            <v-autocomplete v-model="settings.websites.meta" :disabled="!settings.websites.value" :items="metaList"
              label="Meta with websites" placeholder="Please select the meta for which websites will be added" 
              :rules="settings.websites.value?[v=>!!v||'Meta is required']:[]" item-value="id" :filter="filterMeta">
              <template v-slot:selection="data">
                <v-icon left small>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
              <template v-slot:item="data">
                <v-icon left>mdi-{{data.item.settings.icon}}</v-icon>
                <span>{{data.item.settings.name}}</span>
              </template>
            </v-autocomplete>
          </div>
          </v-form>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</div>
</template>


<script>
const axios = require("axios")
const cheerio = require("cheerio")
const shortid = require('shortid')

import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters'
import Tags from '@/components/elements/TagsDefault'
import Websites from '@/components/elements/WebsitesDefault'

export default {
  name: 'DialogAddMetaCardsTemplate',
  props: {
    dialog: Boolean,
  },
  components: { vuescroll, },
  mixins: [MetaGetters], 
  mounted() {
    this.$nextTick(function () {
      let performers = this.$store.getters.meta.find(i=>i.settings.name==='Performers').cloneDeep().value()
      if (performers) this.settings.performers.meta = performers.id 
      let tags = this.$store.getters.meta.find(i=>i.settings.name==='Tags').cloneDeep().value()
      if (tags) this.settings.tags.meta = tags.id 
      let websites = this.$store.getters.meta.find(i=>i.settings.name==='Websites').cloneDeep().value()
      if (websites) this.settings.websites.meta = websites.id 
    })
  },
  data: () => ({
    settings: {
      performers: {
        value: true,
        meta: null,
      },
      tags: {
        value: true,
        meta: null,
      },
      websites: {
        value: true,
        meta: null,
      },
    },
    numberPerformers: 288,
    isProcessRunning: false,
    months: ['january','february','march','april','may','june','july','august','september','october','november','december'],
    found: [],
    valid: false,
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
    metaList() { return this.$store.getters.meta.filter({type:'complex'}).value() },
  },
  methods: {
    async start() {
      this.$refs.form.validate()
      if (!this.valid) return
      this.isProcessRunning = true
      let pages = this.numberPerformers/96
      if (this.settings.performers.value) {
        for (let i=1; i<=pages; i++) {
          let query = 'https://www.freeones.com/babes?s=rank.currentRank&o=asc&l=96&v=grid&f%5Bprofessions%5D=porn_stars&p='+i
          await this.getPerformers(query)
        }
        await this.createPerformers()
      }
      if (this.settings.tags.value) await this.createTags()
      if (this.settings.websites.value) await this.createWebsites()
      this.isProcessRunning = false
      this.$emit('finish') 
    },
    close() { this.$emit('close') },
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },
    async getPerformers(query) {
      return new Promise(resolve => {
        axios.get(query).then((response) => {
          if (response.status !== 200) return
          const html = response.data
          const $ = cheerio.load(html)
          $('.grid-item').each((i,e) => {
            let p = {}
            p.id = shortid.generate()
            p.name = $(e).find('[data-test="subject-name"]').text().trim()
            p.link = $(e).find('a').attr('href').replace('feed','bio')
            let avatar = $(e).find('.image-content').attr('src')
            if (avatar == undefined) avatar = $(e).find('.image-content').attr('data-src')
            if (avatar !== undefined) p.img = avatar
            this.found.push(p)
          })
          resolve()
        }, (error) => { console.log(error) })
      })
    },
    async createPerformers() {
      return new Promise(async resolve => {
        const metaId = this.settings.performers.meta
        for (const p of this.found) {
          let card = {
            id: p.id,
            metaId,
            views: 0,
            meta: {
              name: p.name,
            },
          }
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===p.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    async createTags() {
      return new Promise(async resolve => {
        const metaId = this.settings.tags.meta
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const t of Tags) {
          let card = {
            id: shortid.generate(),
            metaId,
            views: 0,
            meta: {
              name: t.name,
            },
          }
          if (synonyms) card.meta.synonyms = t.synonyms || []
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===t.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    async createWebsites() {
      return new Promise(async resolve => {
        const metaId = this.settings.websites.meta
        const synonyms = this.getMeta(metaId).settings.synonyms
        for (const w of Websites) {
          let card = {
            id: shortid.generate(),
            metaId,
            views: 0,
            meta: {
              name: w.name,
            },
          }
          if (synonyms) card.meta.synonyms = w.synonyms || []
          
          let isDublicate = this.$store.getters.metaCards.filter({metaId}).find(i=>i.meta.name.toLowerCase()===w.name.toLowerCase()).value()
          if (!isDublicate) this.$store.dispatch('addMetaCard', card)
          await this.sleep(1)
        }
        resolve()
      })
    },
    filterMeta(metaObj, queryText) { return metaObj.settings.name.toLowerCase().includes(queryText.toLowerCase()) },
  },
}
</script>