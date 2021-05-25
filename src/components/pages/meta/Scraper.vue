<template>
  <div>
    <v-dialog :value="dialog" @input="closeDialog" scrollable max-width="1200px">
      <v-card class="pb-4">
        <v-toolbar color="primary">
          <div class="headline">
            Scrap data for
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
                    <v-col cols="4" xs="4" sm="3" md="2" v-for="(fp, i) in foundPerformers" :key="i">
                      <v-hover>
                        <template v-slot:default="{ hover }">
                          <v-card height="100%">
                            <v-img :src="fp.img" :aspect-ratio="1" position="center top" 
                              style="background-color:#777;"
                            > <country-flag :country='findCountryCode(fp.country)' size='normal'/>
                            </v-img>
                            <v-card-text>
                              <div class="body-2">{{fp.name}}</div>
                              <v-divider v-if="fp.aliases" class="my-2"></v-divider>
                              <div class="caption" style="line-height:1;">{{fp.aliases}}</div>
                            </v-card-text>
                            <v-fade-transition>
                              <v-overlay v-if="hover" absolute color="secondary">
                                <v-btn v-if="resultFromFreeones" @click="getInfo(fp.link, 'freeonce')" color="primary" :loading="searchInProgress">
                                  <v-icon left>mdi-information-variant</v-icon> Get info </v-btn>
                                <v-btn v-else @click="getInfo(fp.link, 'iafd')" color="primary" :loading="searchInProgress">
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
    <v-dialog v-model="dialogTransferInfo" scrollable max-width="860">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Transfer information</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogTransferInfo=false" outlined>Cancel</v-btn>
          <v-btn @click="applyTransfered" class="mx-4" outlined> 
            <v-icon left>mdi-transfer</v-icon> Apply transfered</v-btn>
          <v-btn @click="applyFounded" outlined> 
            <v-icon left>mdi-magnify</v-icon> Apply found </v-btn>
        </v-toolbar>
        <v-card-actions>
          <v-btn @click="initCurrentValues" small color="secondary" class="mx-4 mt-4">
            <v-icon left>mdi-restore</v-icon> Restore all </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="transferAll" small color="secondary" class="mx-4 mt-4">
            <v-icon left>mdi-transfer-left</v-icon> Transfer all </v-btn>
        </v-card-actions>
        <vuescroll>
          <v-card-text>
            <v-simple-table dense class="transfer-table">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-center pl-8" style="width:20%">Meta</th>
                    <th class="text-center" style="width:20%">Parameter</th>
                    <th class="text-center pr-8" style="width:30%">Current</th>
                    <th class="text-center" style="width:30%">Found</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key, i) in transfer.found" :key="i+transferedKey">
                    <td v-if="getMetaByField(key)" class="text-center pl-8">
                      <v-btn @click="restore(key)" icon small class="restore-btn" color="primary"> <v-icon>mdi-restore</v-icon> </v-btn> 
                      <v-icon size="20">mdi-{{ getMeta(getMetaByField(key).id).settings.icon }}</v-icon>
                      {{ getMeta(getMetaByField(key).id).settings.name }}
                    </td>
                    <td v-else class="text-center pl-8 red--text">Not assigned</td>
                    
                    <td class="text-center">{{ key }}</td>
                    
                    <td v-if="getMetaByField(key)" class="text-center pr-8">
                      <span>{{ transfer.current[key] }}</span> 
                      <v-btn @click="transferValue(key, value)" icon small class="transfer-btn" color="primary">
                        <v-icon>mdi-transfer-left</v-icon>
                      </v-btn>
                    </td>
                    <td v-else class="text-center pr-8">-</td>
                    
                    <td class="text-center">{{ value }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
const { clipboard } = require('electron')

import vuescroll from 'vuescroll'
import CountryFlag from 'vue-country-flag'
import Scrapers from '@/mixins/Scrapers'
import Countries from '@/mixins/Countries'
import MetaGetters from '@/mixins/MetaGetters'

export default {
  props: {
    dialog: Boolean,
    name: String,
    values: Object,
  },
  name: "Scraper",
  components: { vuescroll, CountryFlag },
  mixins: [Countries, Scrapers, MetaGetters], 
  beforeMount() {
    this.queryString = this.name
  },
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    queryString: '',
    searchInProgress: false,
    notFound: false,
    resultFromFreeones: false,
    foundPerformers: [],
    tooltipCopyName: false,
    dialogTransferInfo: false,
    transfer: {
      current: {},
      found: {},
    },
    transferedKey: Date.now(),
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    initCurrentValues() { 
      for (const key in this.transfer.found) {
        let meta = this.getMetaByField(key)
        if (meta) this.transfer.current[key] = this.values[meta.id]
      }
      this.transferedKey = Date.now()
    },
    restore(key) { 
      this.transfer.current[key] = this.values[this.getMetaByField(key).id] 
      this.transferedKey = Date.now()
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
    applyTransfered() { this.$emit('getValues', this.transfer.current) },
    applyFounded() { this.$emit('getValues', this.transfer.found) },
    getMetaByField(field) { return _.find(this.meta.settings.metaInCard, i=>i.scraperField===field) },
    copyNameToClipboard() {
      this.tooltipCopyName = true
      clipboard.writeText(this.name)
      setTimeout(() => { this.tooltipCopyName = false }, 3000)
    },
    pasteQueryString() { this.queryString = clipboard.readText() },
    findCountryCode(country) {
      if (country == '' || country === undefined) return ''
      let countryName = country.toLowerCase()
      let code = _.filter(this.countries, country => (country.name.toLowerCase().includes(countryName)) )[0]
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