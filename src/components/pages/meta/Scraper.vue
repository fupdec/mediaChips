<template>
  <div>
    <v-dialog :value="dialog" @input="closeDialog" scrollable max-width="1200px">
      <v-card :loading="searchInProgress" class="pb-4">
        <v-toolbar color="primary">
          <div class="headline">
            Scrap data for
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <span v-on="click" @click="copyPerformerNameToClipboard('find')" class="font-weight-bold "
                  style="cursor:pointer;" title="Copy name to clipboard"> {{name}} 
                </span>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          <v-spacer></v-spacer>
          <v-btn class="mx-2" dark outlined @click="closeDialog"> Cancel </v-btn>
        </v-toolbar>
        <v-card-actions>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="queryString" hide-details dense solo
                  placeholder="Performer name or alias" :disabled="searchInProgress"
                  @click:append-outer="pasteQueryString" 
                  append-outer-icon="mdi-clipboard-text-outline"/>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn @click="findPerformersIafd" :loading="searchInProgress"
                  color="secondary" block :disabled="searchInProgress"
                > <v-icon left>mdi-magnify</v-icon> iafd.com </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn @click="findPerformersFreeonce" :loading="searchInProgress"
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
                <v-col cols="12" class="text-center" v-once v-if="showFindError">
                  <h2>Nothing found</h2>
                </v-col>
                <v-col cols="12">
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
                                <v-btn v-if="resultFromFreeones" @click="getPerformerInfoFreeonce(fp.link)" color="primary" 
                                  :loading="searchInProgress">
                                  <v-icon left>mdi-information-variant</v-icon> Get info
                                </v-btn>
                                <v-btn v-else @click="getPerformerInfoIafd(fp.link)" color="primary" :loading="searchInProgress">
                                  <v-icon left>mdi-information-variant</v-icon> Get info
                                </v-btn>
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
        <v-card-title class="edit-card-title pa-4">
          <div class="headline">
            Transfer information
          </div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogTransferInfo=false" class="mx-2" dark outlined>Cancel</v-btn>
          <v-btn @click="applyTransfered" class="mx-2" color="primary"> 
            <v-icon left>mdi-transfer</v-icon> Apply transfered</v-btn>
          <v-btn @click="applyFounded" class="mx-2" color="primary"> 
            <v-icon left>mdi-magnify</v-icon> Apply found </v-btn>
        </v-card-title>
        <v-card-actions>
          <v-btn @click="restoreAll" small color="secondary" class="mx-4 mt-4">
            <v-icon left>mdi-restore</v-icon> Restore all
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="transferAll" small color="secondary" class="mx-4 mt-4">
            <v-icon left>mdi-transfer-left</v-icon> Transfer all
          </v-btn>
        </v-card-actions>
        <vuescroll>
          <v-card-text>
            <v-simple-table dense class="transfer-table">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-right" style="width:20%">Parameter</th>
                    <th class="text-center" style="width:40%">Current</th>
                    <th class="text-center" style="width:40%">Found</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(param, name, index) in transfer.found" :key="index">
                    <td v-if="param.length" class="text-right val-name">
                      <v-btn @click="transfer.current[name]=$data[name]" 
                        icon small class="transfer-btn" color="primary">
                        <v-icon>mdi-restore</v-icon>
                      </v-btn> {{ name }}: 
                    </td>
                    <td v-if="param.length" class="text-center"> {{ transfer.current[name] }} </td>
                    <td v-if="param.length" class="text-center val-found">
                      <v-btn @click="transfer.current[name]=param" 
                        icon small class="transfer-btn" color="primary">
                        <v-icon>mdi-transfer-left</v-icon>
                      </v-btn> {{ param }} 
                    </td>
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
const path = require("path")
const axios = require("axios")
const cheerio = require("cheerio")

import vuescroll from 'vuescroll'
import Scrapers from '@/mixins/Scrapers'

export default {
  props: {
    dialog: Boolean,
    name: String,
  },
  name: "Scraper",
  components: {
    vuescroll,
	},
  mixins: [Scrapers], 
  beforeMount() {
    this.queryString = this.name
  },
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    date: null,
    menu: false,
    isPerformerNameEditEnabled: false,
    valid: false,
    queryString: "",
    searchInProgress: false,
    showFindError: false,
    resultFromFreeones: false,
    foundPerformers: [],
    performerName: '',
    favorite: false,
    rating: 0,
    aliases: '',
    start: '',
    end: '',
    category: [],
    birthday: '',
    nations: [],
    ethnicity: [],
    eyes: [],
    hair: [],
    height: '',
    weight: '',
    bra: '',
    waist: '',
    hip: '',
    boobs: [],
    cups: [],
    currentYear: new Date().getFullYear(),
    percentCompleted: 0,
    tags: [],
    tooltipCopyName: false,
    tooltipCopyName: false,
    months: ['january','february','march','april','may','june','july',
      'august','september','october','november','december'],
    dialogTransferInfo: false,
    transfer: {
      current: {},
      found: {},
    },
    defaultParamsForInfo: {
      aliases: '',
      start: '',
      end: '',
      category: [],
      birthday: '',
      nations: [],
      ethnicity: [],
      eyes: [],
      hair: [],
      height: '',
      weight: '',
      bra: '',
      waist: '',
      hip: '',
      boobs: [],
      cups: [],
    },
    values: {},
    picker: false,
    pickerParam: null,
    dialogAddNewTag: false,
    newTagName: '',
    validNewTagName: false,
  }),
  computed: {
  },
  methods: {
    pastePerformerName() {
      this.performerName = clipboard.readText()
    },
    pasteAliases() {
      this.aliases = clipboard.readText()
    },
    pasteQueryString() {
      this.queryString = clipboard.readText()
    },
    clearPreviouslyFound() {
      this.transfer.current = _.cloneDeep(this.defaultParamsForInfo)
      this.transfer.found = _.cloneDeep(this.defaultParamsForInfo)
    },
    getTransferCurrent() {
      this.transfer.current.aliases = this.aliases
      this.transfer.current.start = this.start
      this.transfer.current.end = this.end
      this.transfer.current.category = this.category
      this.transfer.current.birthday = this.birthday
      this.transfer.current.nations = this.nations
      this.transfer.current.ethnicity = this.ethnicity
      this.transfer.current.eyes = this.eyes
      this.transfer.current.hair = this.hair
      this.transfer.current.height = this.height
      this.transfer.current.weight = this.weight
      this.transfer.current.bra = this.bra
      this.transfer.current.waist = this.waist
      this.transfer.current.hip = this.hip
      this.transfer.current.boobs = this.boobs
      this.transfer.current.cups = this.cups
    },
    restoreAll() {
      for (const param in this.transfer.current) {
        this.transfer.current[param] = this[param]
      }
    },
    transferAll() {
      for (const param in this.transfer.found) {
        if (this.transfer.found[param].length) {
          this.transfer.current[param] = this.transfer.found[param]
        }
      }
    },
    applyTransfered() {
      this.dialogTransferInfo = false
      setTimeout(()=>{
        for (const param in this.transfer.current) {
          if (this.transfer.current[param].length) {
            this[param] = this.transfer.current[param]
          }
        }
      }, 1000)
    },
    applyFounded() {
      this.dialogTransferInfo = false
      setTimeout(()=>{
        for (const param in this.transfer.found) {
          if (this.transfer.found[param].length) {
            this[param] = this.transfer.found[param]
          }
        }
      }, 1000)
    },
    removeTrash(dirtyString) {
      let filtered = dirtyString.trim()
      return filtered.replace(/[\\\/\%"<>{}\[\]]/g, '').replace(/ +(?= )/g,'')
    },
    parseStringToArray(string) {
      string = string.trim()
      string = string.replace(/[\\\/\%"<>{}\[\]]/g, '')
      string = string.replace(/ +(?= )/g,'') // remove multiple spaces
      string = string.split(/[,;]/)
      string = string.filter((el)=>(el != '' && el != ' '))
      string = string.map(s => s.trim())
      return string
    },
    copyPerformerNameToClipboard(dialog) {
      if(dialog == 'find') {
        this.tooltipCopyName = true
      } else {
        this.tooltipCopyName = true
      }
      setTimeout(() => {
        this.tooltipCopyName = false
        this.tooltipCopyName = false
      },3000)
      clipboard.writeText(this.name)
    },
    closeDialog() { this.$emit('closeScraper')},
  },
  watch: {
  }
}
</script>


<style lang="less">
.masked {
  &-block {
    position: relative;
  }
  &-input {
    &.v-input input {
      color: transparent;
      &::placeholder {
          color: transparent;
      }
    }
  }
  &-mask {
    position: absolute;
    height: 34px;
    width: 100%;
    outline: none;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.87);
    top: 11px;
    left: 0;
  }
}
.theme--dark .masked-mask {
  color: #fff;
}
.nation-select {
  & .v-select__slot {
    height: 32px;
  }
}
.profile-completed-container {
  display: flex;
  align-items: center;
  z-index: 5;
}
.profile-completed-progress {
  .v-progress-circular__info {
    font-size: 12px;
  }
  .percent {
    font-size: 10px;
  }
  .v-progress-circular__underlay {
    stroke: rgba(255, 255, 255, 0.2);
  }
}
.transfer-table {
  .val-name,
  .val-found {
    position: relative;
    padding-left: 30px !important;
  }
  .transfer-btn {
    position: absolute; 
    left: 0;
    top: 0;
    bottom: 0;
    margin: auto;
  }
}
</style> 