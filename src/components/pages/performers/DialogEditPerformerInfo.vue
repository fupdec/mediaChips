<template>
  <div>
    <v-dialog 
      v-model="$store.state.Performers.dialogEditPerformerInfo"
      persistent max-width="1000" scrollable
    >
      <v-card>
        <v-card-title class="edit-card-title">
          <v-img 
            :src="getImg()" :aspect-ratio="1" position="top"
            min-width="84" max-width="84" height="84" class="mr-6"
            gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%"
          />
          <div class="headline" style="cursor:pointer;">
            <v-tooltip v-model="tooltipCopyName" bottom>
              <template v-slot:activator="{ click }">
                <div v-on="click" @click="copyPerformerNameToClipboard" 
                  title="Copy name to clipboard"
                > {{performerName}} 
                </div>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          
          <v-spacer></v-spacer>

          <div class="profile-completed-container ma-6">
            <div class="overline mr-2">completed</div>
            <v-progress-circular class="profile-completed-progress"
              :value="percentComplete" size="36" rotate="270"
              :color="percentComplete>=99?'green':'white'" width="2"
            >
              <v-icon v-if="percentComplete>=99" color="green">mdi-check</v-icon>
              <div v-else>{{percentComplete}}<span class="percent">%</span></div>
            </v-progress-circular>
          </div>

          <v-spacer></v-spacer>

          <v-btn class="ma-4" dark outlined @click="close"> Cancel </v-btn>
          <v-btn @click="savePerformerInfo(performer.id)" :disabled="!valid"
            class="ma-4" color="primary"> 
            <v-icon left>mdi-content-save-outline</v-icon> Save 
          </v-btn>
        </v-card-title>
        <vuescroll>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-container>
                <v-row>
                  <v-col cols="8" class="pt-0">
                    <v-btn @click="getInfoFreeonce(performerNameForSearch)" 
                      :loading="findInfoRun" color="secondary" class="mr-8">
                      <v-icon left>mdi-auto-fix</v-icon> Autosearch info by name
                    </v-btn>
                    <v-btn @click="dialogFindPerformerInfo=true" color="secondary"> 
                      <v-icon left>mdi-magnify</v-icon> Find info 
                    </v-btn>
                  </v-col>
                  <v-col cols="4" class="pt-0">
                    <div class="text-right">last edit {{editDate}}</div>
                  </v-col>
                  <v-col cols="12" class="pb-0">
                    <div class="editable-text-field">
                      <v-tooltip bottom v-if="isPerformerNameEditEnabled">
                        <template v-slot:activator="{ on }">
                          <v-icon @click="isPerformerNameEditEnabled=!isPerformerNameEditEnabled"
                            left v-on="on">mdi-close</v-icon>
                        </template>
                        <span>Keep the old name</span>
                      </v-tooltip>
                      <v-tooltip bottom v-else>
                        <template v-slot:activator="{ on }">
                          <v-icon @click="isPerformerNameEditEnabled=!isPerformerNameEditEnabled"
                            left v-on="on">mdi-pencil</v-icon>
                        </template>
                        <span>Edit name</span>
                      </v-tooltip>
                      <v-text-field 
                        v-model="performerName"
                        label="Name" placeholder=" " :disabled="!isPerformerNameEditEnabled"
                        hint='The name may include letters, numbers, symbols: !?#&+()$~*-_'
                        :rules="[getNameRules]" maxlength="100" counter
                        error-count="3" validate-on-blur
                        @click:append-outer="pastePerformerName" 
                        append-outer-icon="mdi-clipboard-text-outline"
                      ></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field 
                      v-model="aliases" label="Aliases" placeholder=" "
                      hint='Divide by "," or ; e.g. "Ca$$, Cass!dy; Cassy, Casssidy".
                      Aliases may include letters, numbers, symbols: !?#&+()$~*-_'
                      :rules="[getAliasesRules]" maxlength="500" counter
                      error-count="3" validate-on-blur
                      @click:append-outer="pasteAliases" 
                      append-outer-icon="mdi-clipboard-text-outline"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Career start year" persistent-hint
                        hint='YYYY' class="masked-input" placeholder=" "
                        :rules="[getCareerStartRules]" v-model="careerStart"
                      ></v-text-field>
                      <the-mask 
                        mask="####" v-model="careerStart"
                        type="text" class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Career end year" persistent-hint
                        hint='YYYY' class="masked-input" placeholder=" "
                        :rules="[getCareerEndRules]" v-model="careerEnd"
                      ></v-text-field>
                      <the-mask 
                        mask="####" v-model="careerEnd"
                        type="text" class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" >
                    <v-select
                      :items="$store.state.Settings.performerInfoCategory" multiple
                      label="Category" placeholder=" " v-model="category"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="3" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Birthday"
                        persistent-hint hint='DD.MM.YYYY'
                        class="masked-input" placeholder=" "
                      ></v-text-field>
                      <the-mask 
                        mask="##.##.####" 
                        v-model="birthday"
                        type="text"
                        class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="9" >
                    <v-autocomplete
                      v-model="nation"
                      :items="countries"
                      item-text="name"
                      item-value="name"
                      label="Nationality" placeholder=" "
                      class="nation-select" clearable
                    >
                      <template v-slot:selection="data">
                        <country-flag :country='data.item.code' size='normal'/>
                        {{ data.item.name }}
                      </template>
                      <template v-slot:item="data">
                        <template v-if="typeof data.item !== 'object'">
                          <v-list-item-content v-text="data.item"></v-list-item-content>
                        </template>
                        <template v-else>
                          <country-flag :country='data.item.code' size='normal'/>
                          <v-list-item-content>
                            <v-list-item-title v-html="data.item.name"></v-list-item-title>
                          </v-list-item-content>
                        </template>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12">
                    <div class="overline text-center">Appearance</div>
                  </v-col>
                  <v-col cols="12" sm="4" >
                    <v-autocomplete
                      v-model="ethnicity" @blur="sort('ethnicity')"
                      :items="$store.state.Settings.performerInfoEthnicity"
                      label="Ethnicity" multiple placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="4" >
                    <v-autocomplete
                      v-model="eyes" @blur="sort('eyes')"
                      :items="$store.state.Settings.performerInfoEyes"
                      label="Eyes color" multiple placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="4" >
                    <v-autocomplete
                      v-model="hair" @blur="sort('hair')"
                      :items="$store.state.Settings.performerInfoHair"
                      label="Hair color" multiple placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" sm="2" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Height" 
                        persistent-hint
                        hint='cm'
                        class="masked-input" v-model="height" validate-on-blur
                        placeholder=" " :rules="[getHeightRules]"
                      />
                      <the-mask 
                        mask="###" 
                        v-model="height"
                        type="text"
                        class="masked-mask"
                      />
                    </div>
                  </v-col>
                  <v-col cols="6" sm="2" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Weight"
                        persistent-hint
                        hint='kg'
                        class="masked-input" v-model="weight" validate-on-blur
                        placeholder=" " :rules="[getWeightRules]"
                      ></v-text-field>
                      <the-mask 
                        mask="###" 
                        v-model="weight"
                        type="text"
                        class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="3" sm="1" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Bra"
                        class="masked-input"
                        persistent-hint
                        hint='in'
                        placeholder=" "
                      />
                      <the-mask 
                        mask="###"
                        v-model="bra"
                        type="text"
                        class="masked-mask"
                      />
                    </div>
                  </v-col>
                  <v-col cols="3" sm="2" >
                    <v-select
                      :items="$store.state.Settings.performerInfoCups"
                      label="Cup size" v-model="cup"
                    />
                  </v-col>
                  <v-col cols="3" sm="1" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Waist"
                        class="masked-input"
                        persistent-hint
                        hint='in'
                        placeholder=" "
                      ></v-text-field>
                      <the-mask 
                        mask="###"
                        v-model="waist"
                        type="text"
                        class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="3" sm="1" >
                    <div class="masked-block">
                      <v-text-field 
                        label="Hip"
                        class="masked-input"
                        persistent-hint
                        hint='in'
                        placeholder=" "
                      ></v-text-field>
                      <the-mask 
                        mask="###"
                        v-model="hip"
                        type="text"
                        class="masked-mask"
                      >
                      </the-mask>
                    </div>
                  </v-col>
                  <v-col cols="8" sm="3" >
                    <v-select
                      :items="$store.state.Settings.performerInfoBoobs"
                      label="Boobs" v-model="boobs" placeholder=" " clearable
                    />
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <v-autocomplete
                      v-model="body" @blur="sort('body')"
                      :items="$store.state.Settings.performerInfoBody"
                      label="Body type" multiple placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <v-autocomplete
                      v-model="pussy" clearable
                      :items="$store.state.Settings.performerInfoPussy"
                      label="Pussy type" placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <v-autocomplete
                      v-model="pussyLips" clearable
                      :items="$store.state.Settings.performerInfoPussyLips"
                      label="Pussy lips size" placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" sm="3" >
                    <v-autocomplete
                      v-model="pussyHair" @blur="sort('pussyHair')"
                      :items="$store.state.Settings.performerInfoPussyHair"
                      label="Pussy hair" multiple placeholder=" "
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" class="text-center">
                    <div class="overline">Rating</div>
                    <v-rating v-model="rating"
                      color="yellow darken-3" background-color="grey"
                      empty-icon="mdi-star-outline"
                      half-icon="mdi-star-half-full"
                      half-increments hover size="32" clearable
                    ></v-rating>
                  </v-col>
                  <v-col cols="12" sm="6" class="text-center">
                    <div class="overline">Favorite</div>
                    <v-btn @click="favorite=!favorite" x-large icon>
                      <v-icon v-if="favorite" color="pink">mdi-heart</v-icon>
                      <v-icon v-else color="grey">mdi-heart-outline</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <div class="overline text-center">Tags</div>
                  </v-col>
                  <v-col cols="12" sm="9" class="pt-4">
                    <v-autocomplete
                      v-model="tags" outlined
                      :items="tagsAll" placeholder="Choose tags of performer"
                      item-text="name" class="hidden-close"
                      item-value="name" no-data-text="No more tags"
                      multiple hide-selected hide-details
                      :menu-props="{contentClass:'list-with-preview'}"
                      @blur="sort('tags')" :filter="filterItemsTags"
                    >
                      <template v-slot:selection="data">
                        <v-chip
                          v-bind="data.attrs" close
                          :input-value="data.selected" 
                          @click="data.select" 
                          @click:close="removeTag(data.item)"
                          @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                          @mouseleave.stop="$store.state.hoveredImage=false"
                          :color="data.item.color" text-color="white"
                        >
                          <span>{{ data.item.name }}</span>
                        </v-chip>
                      </template>
                      <template v-slot:item="data">
                        <div class="list-item" style="padding: 6px 10px;"
                          @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                          @mouseleave.stop="$store.state.hoveredImage=false"
                        > <v-icon :color="data.item.favorite===false ? 'grey':'pink'"
                          left size="14"> mdi-heart </v-icon>
                          <v-icon left size="16" :color="data.item.color">
                            mdi-tag
                          </v-icon>
                          <span>{{data.item.name}}</span>
                          <span v-if="data.item.altNames.length" class="aliases"> 
                            {{data.item.altNames.join(', ').slice(0,50)}}
                          </span>
                        </div>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="3" class="pt-0 text-right">
                    <span class="caption">Sort list of tags by</span>
                    <v-card-actions class="pa-0">
                      <v-spacer></v-spacer>
                      <v-btn-toggle v-model="sortButtonsTags" mandatory color="primary">
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn outlined value="name" v-on="on">
                              <v-icon>mdi-alphabetical-variant</v-icon>
                            </v-btn>
                          </template>
                          <span>name</span>
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn outlined value="favorite" v-on="on">
                              <v-icon>mdi-heart-outline</v-icon>
                            </v-btn>
                          </template>
                          <span>favorite</span>
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn outlined value="color" v-on="on">
                              <v-icon>mdi-palette</v-icon>
                            </v-btn>
                          </template>
                          <span>color</span>
                        </v-tooltip>
                        <v-tooltip top>
                          <template v-slot:activator="{ on }">
                            <v-btn outlined value="date" v-on="on">
                              <v-icon>mdi-calendar-clock</v-icon>
                            </v-btn>
                          </template>
                          <span>date added</span>
                        </v-tooltip>
                      </v-btn-toggle>
                    </v-card-actions>
                  </v-col>
                  <v-col cols="12">
                    <div class="overline text-center my-4">Bookmark</div>
                    <v-textarea clearable auto-grow outlined placeholder="Write text here" 
                      v-model="$store.state.Bookmarks.bookmarkText" />
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <!-- TODO: when import info from founded performers should be good view compare 
      field from existing info in profile and new info from internet profile -->
    <v-dialog v-model="dialogFindPerformerInfo" scrollable max-width="1200px">
      <v-card :loading="searchInProgress">
        <v-card-title class="edit-card-title headline pa-4">Find information for
          <v-tooltip v-model="tooltipCopyPerformerName" bottom>
            <template v-slot:activator="{ click }">
              <span v-on="click" style="cursor:pointer;" title="Copy name to clipboard"
                @click="copyPerformerNameToClipboard('find')" class="ml-2"
              > {{performer.name}} 
              </span>
            </template>
            <span>Name copied to clipboard!</span>
          </v-tooltip>
          
          <v-spacer></v-spacer>

          <v-btn class="mx-2" dark outlined @click="dialogFindPerformerInfo=false"> Cancel </v-btn>
        </v-card-title>
        <v-card-actions>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="queryString" hide-details dense solo
                  placeholder="Performer name or alias" 
                  @click:append-outer="pasteQueryString" 
                  append-outer-icon="mdi-clipboard-text-outline"/>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn 
                  @click="findPerformersIafd" :loading="findIafdRun"
                  color="secondary" block :disabled="findFreeonceRun"
                >
                  <v-icon left>mdi-magnify</v-icon> iafd.com
                </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn 
                  @click="findPerformersFreeonce" :loading="findFreeonceRun"
                  color="secondary" block :disabled="findIafdRun"
                >
                  <v-icon left>mdi-magnify</v-icon> freeones.com
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-actions>
        <vuescroll>
          <v-card-text>
            <v-container>
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
                                <v-btn v-if="resultFromFreeones" @click="getInfoFreeonce(fp.link)" color="primary">
                                  <v-icon left>mdi-information-variant</v-icon> Get info
                                </v-btn>
                                <v-btn v-else @click="getInfoIafd(fp.link)" color="primary">
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
  </div>
</template>


<script>
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const cheerio = require("cheerio")
const shortid = require('shortid')

import CountryFlag from 'vue-country-flag'
import {TheMask} from 'vue-the-mask'
import Countries from '@/mixins/Countries'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditPerformerInfo",
  components: {
    CountryFlag,
    TheMask,
    vuescroll,
	},
  mixins: [Countries, ShowImageFunction], 
  mounted () {
    this.$nextTick(function () {
      let filteredAliases = JSON.parse(JSON.stringify(this.performer.aliases))
      filteredAliases = filteredAliases.join(", ")
      this.performerName = this.performer.name
      this.favorite = this.performer.favorite
      this.rating = this.performer.rating
      this.aliases = filteredAliases
      this.careerStart = this.performer.start
      this.careerEnd = this.performer.end
      this.nation = this.performer.nation
      this.birthday = this.performer.birthday
      this.ethnicity = this.performer.ethnicity
      this.eyes = this.performer.eyes
      this.hair = this.performer.hair
      this.height = this.performer.height
      this.weight = this.performer.weight
      this.bra = this.performer.bra
      this.waist = this.performer.waist
      this.hip = this.performer.hip
      this.boobs = this.performer.boobs
      this.cup = this.performer.cup
      this.body = this.performer.body
      this.pussy = this.performer.pussy
      this.pussyLips = this.performer.pussyLips
      this.pussyHair = this.performer.pussyHair
      this.category = this.performer.category
      this.queryString = this.performer.name
      this.tags = this.performer.tags.sort((a, b) => a.localeCompare(b))
      if (this.performer.bookmark) {
        let text = this.$store.getters.bookmarks.get('performers')
                    .find({itemId:this.performer.id}).value().text
        this.$store.state.Bookmarks.bookmarkText = text
      }
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    isPerformerNameEditEnabled: false,
    valid: false,
    dialogFindPerformerInfo: false,
    queryString: "",
    searchInProgress: false,
    findFreeonceRun: false,
    findIafdRun: false,
    findInfoRun: false,
    showFindError: false,
    resultFromFreeones: false,
    foundPerformers: [],
    performerName: '',
    favorite: false,
    rating: 0,
    aliases: '',
    birthday: '',
    nation: '',
    careerStart: '',
    careerEnd: '',
    ethnicity: [],
    hair: [],
    eyes: [],
    height: '',
    weight: '',
    bra: '',
    waist: '',
    hip: '',
    boobs: '',
    body: [],
    pussy: '',
    pussyLips: '',
    pussyHair: [],
    cup: '',
    category: [],
    currentYear: new Date().getFullYear(),
    percentCompleteProgress: 0,
    percentValue: 5.263,
    tags: [],
    tooltipCopyName: false,
    tooltipCopyPerformerName: false,
    months: ['january','february','march','april','may','june','july',
      'august','september','october','november','december'],
  }),
  computed: {
    performer() {
      let ids = this.$store.getters.getSelectedPerformers
      let ps = this.$store.getters.performers
      if (this.$route.path.includes('/performer/:') && this.$router.currentRoute.params.id) {
        let performerId = this.$router.currentRoute.params.id.substring(1)
        if (performerId) {
          return ps.find({ id: performerId }).value()
        } 
      } else if (ids.length>0) {
        return ps.find({id:ids[0]}).value()
      } else {
        return ps.find('id').value()
      }
    },
    performerNameForSearch() {
      return this.performer.name.trim().toLowerCase().replace(/ /g, '-')
    },
    percentComplete: {
      get() {
        return Math.ceil(this.percentCompleteProgress)
      },
      set(percents) {
        this.percentCompleteProgress = percents
      },
    },
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('performer')))
      return this.sortItems(tags, 'Tags')
    },
    sortButtonsTags: {
      get() {
        return this.$store.state.Videos.videoEditTagsSortBy
      },
      set(value) {
        this.$store.dispatch('updateVideoEditTagsSortBy', value)
      },
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    editDate() {
      let date = new Date(this.performer.edit)
      let dateFormated = date.toLocaleDateString()
      dateFormated += ' ' + date.toLocaleTimeString() 
      return dateFormated
    },
  },
  methods: {
    async pastePerformerName() {
      this.performerName = await navigator.clipboard.readText()
    },
    async pasteAliases() {
      this.aliases = await navigator.clipboard.readText()
    },
    async pasteQueryString() {
      this.queryString = await navigator.clipboard.readText()
    },
    sortItems(items, type) {
      const sortBy = this[`sortButtons${type}`]
      let itemsSorted = items.orderBy(i=>(i.name.toLowerCase()),['asc'])
      if (sortBy !== 'name') {
        itemsSorted = itemsSorted.orderBy(i=>(i[sortBy]),['desc']).value()
        return itemsSorted
      } else return itemsSorted.value()
    },
    filterItemsTags(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const alternateNames = item.altNames
      let found = false
      for (let i=0;i<alternateNames.length;i++) {
        if (alternateNames[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
    },
    close() {
      this.$store.state.Performers.dialogEditPerformerInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    findCountryCode(country) {
      if (!country == '') {
        let countryName = country.toLowerCase()
        let code = _.filter(this.countries,
          country => (country.name.toLowerCase().includes(countryName))
        )[0]
        if (code == undefined) {
          return ''
        } else return code.code
      } else return ""
    },
    findPerformersFreeonce() {
      this.findFreeonceRun = true
      this.searchInProgress = true
      this.showFindError = false
      this.resultFromFreeones = true
      axios.get(`https://www.freeones.ru/babes?q=${this.queryString}&s=rank.currentRank&o=asc&l=96&p=1`)
      .then((response)=>{
        if(response.status === 200) {
          this.findFreeonceRun = false
          this.searchInProgress = false
          this.foundPerformers = []
          console.log('result')
          const html = response.data;
          const $ = cheerio.load(html)
          $('.grid-item').each((i,e) => {
            let p = {}
            p.link = $(e).find('a').attr('href').replace(/\//g, '')
            p.img = $(e).find('.image-content').attr('src')
            if (p.img == undefined) {
              p.img = $(e).find('.image-content').attr('data-src')
            }
            if (p.img == undefined) {
              p.img = path.join(this.pathToUserData, '/img/templates/performer.png')
            }
            p.name = $(e).find('[data-test="subject-name"]').text().trim()
            p.country = $(e).find('.flag-icon').attr('title').trim()
            // console.log(p)
            this.foundPerformers.push(p)
          })
          // console.log(this.foundPerformers)
          if (this.foundPerformers.length==0) {
            this.showFindError = true
          } else {
            this.showFindError = false
          }
        }
      }, (error) => {
        this.findFreeonceRun = false
        this.searchInProgress = false
        this.showFindError = true
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'Cant find this performer'
        })
      })
    },
    findPerformersIafd() {
      this.findIafdRun = true
      this.showFindError = false
      this.searchInProgress = true
      this.resultFromFreeones = false
      let url = 'http://www.iafd.com/results.asp?searchtype=comprehensive&searchstring='
      axios.get(url + this.queryString).then((response)=>{
        if(response.status === 200) {
          this.findIafdRun = false
          this.searchInProgress = false
          this.foundPerformers = []
          const html = response.data;
          const $ = cheerio.load(html)
          $('#tblFem tbody tr').each((i,e) => {
            if (i > 100) { return false }
            let p = {}
            p.link = $(e).find('td:nth-child(2) a').attr('href')
            p.img = $(e).find('img').attr('src')
            p.name = $(e).find('td:nth-child(2) a').text().trim()
            p.aliases = $(e).find('td:nth-child(3)').text().trim()
            p.country = ''
            this.foundPerformers.push(p)
          })
          if (this.foundPerformers.length==0) {
            this.showFindError = true
          } else {
            this.showFindError = false
          }
        }
      }, (error) => {
        this.findIafdRun = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'Cant find this performer'
        })
      })
    },
    getInfoFreeonce(performer) {
      this.findInfoRun = true
      setTimeout(()=>{
        this.dialogFindPerformerInfo = false
        this.foundPerformers = []
      }, 500)
      axios.get(`https://www.freeones.com/${performer}/profile`).then((response)=>{
        if(response.status === 200) {
        this.findInfoRun = false
        this.$store.dispatch('setNotification', {
          type: 'success',
          text: 'Got info from www.freeones.com'
        })

        const html = response.data;
        const $ = cheerio.load(html)
        let profile = {}

        profile.aliases = $('[data-test="p_aliases"]').text().trim()
        let yearsActive = []
        $('.timeline-horizontal .m-0').each((i, elem)=>{
          yearsActive[i] = $(elem).text().trim()
        }) 
        profile.start = yearsActive[0]
        profile.end = yearsActive[1]
        profile.nation = $('[data-test="link-country"] span').text().trim()
        profile.birth = $('[href*="dateOfBirth"]').attr('href')
        if (profile.birth) {
          profile.birth = profile.birth.match(/\d{4}-\d{2}-\d{2}/)[0]
          profile.birth = profile.birth.split('-')
          profile.birth = profile.birth[2]+profile.birth[1]+profile.birth[0]
        }
        profile.ethnicity = []
        profile.ethnicity.push($('[data-test="link_span_ethnicity"]').text().trim())
        profile.eyes = []
        profile.eyes.push($('[data-test="link_span_eye_color"]').text().trim())
        profile.hair = []
        profile.hair.push($('[data-test="link_span_hair_color"]').text().trim())
        profile.height = $('[data-test="link_span_height"]').text().trim()
        if(profile.height) {
          profile.height = profile.height.match(/\d{3}/)[0]
        }
        profile.weight = $('[data-test="link_span_weight"]').text().trim()
        if(profile.weight) {
          profile.weight = profile.weight.match(/\d{2}/)[0]
        }
        let sizes = []
        $('[data-test="p-measurements"] span').each((i, elem)=>{
          sizes[i] = $(elem).text().trim()
        }) 
        if (sizes.length>0) {
          if (sizes[0].match(/\D{1,}/)) {
            profile.cup = sizes[0].match(/\D{1,}/)[0]
          }
          sizes[0] = sizes[0].match(/\d{2}/)[0]
        }
        profile.bra = sizes[0]
        profile.waist = sizes[1]
        profile.hip = sizes[2]
        profile.boobs = $('[data-test="link_span_boobs"]').text().trim()
        profile.profession = $('.sidebar-right .heading').next().find('.text-center')[0].children[0].data
        if (profile.aliases != undefined) { this.aliases = profile.aliases }
        if (profile.start != undefined) { this.careerStart = profile.start }
        if (profile.end != undefined) { this.careerEnd = profile.end }
        if (profile.profession != undefined) { 
          if (profile.profession === 'Adult Models') {
            profile.profession = 'Erotic model'
          }
          if (profile.profession === 'Porn Stars') {
            profile.profession = 'Pornstar'
          }
          if (profile.profession === 'Porn Stars') {
            profile.profession = 'Pornstar'
          }
          this.category = [profile.profession]
        }
        if (profile.nation != undefined) { this.nation = profile.nation }
        if (profile.birth != undefined) { this.birthday = profile.birth }
        if (profile.ethnicity != undefined) { this.ethnicity = profile.ethnicity }
        if (profile.hair != undefined) { this.hair = profile.hair }
        if (profile.eyes != undefined) { this.eyes = profile.eyes }
        if (profile.height != undefined) { this.height = profile.height }
        if (profile.weight != undefined) { this.weight = profile.weight }
        if (profile.bra != undefined) { this.bra = profile.bra }
        if (profile.waist != undefined) { this.waist = profile.waist }
        if (profile.hip != undefined) { this.hip = profile.hip }
        if (profile.boobs != undefined) { 
          if (profile.boobs === "Natural") {
            profile.boobs = "Real"
          }
          this.boobs = profile.boobs
        }
        if (profile.cup != undefined) { this.cup = profile.cup }
        }
      }, (error) => {
        console.log(error)
        this.findInfoRun = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'Cant find this performer'
        })
      })
    },
    getInfoIafd(performer) {
      this.findIafdRun = true
      setTimeout(()=>{
        this.dialogFindPerformerInfo = false
        this.foundPerformers = []
      }, 500)
      axios.get(`http://www.iafd.com${performer}`).then((response) => {
        if(response.status === 200) {
        this.findIafdRun = false
        this.$store.dispatch('setNotification', {
          type: 'success',
          text: 'Got info from www.iafd.com'
        })

        const html = response.data;
        const $ = cheerio.load(html)
        let bio = []
        $('.bioheading').each((i,heading) => {
          bio.push({
            heading: $(heading).text().trim(),
            biodata: $('.bioheading + .biodata').eq(i).text().trim()
          })
        })
        if (this.getBioString('performer', bio)) {
          this.aliases = this.getBioString('performer', bio)
        }
        if (this.getBioString('ethnicity', bio)) {
          let ethnicity = []
          ethnicity.push(this.getBioString('ethnicity', bio))
          this.ethnicity = ethnicity
        }
        if (this.getBioString('hair', bio)) {
          let hair = [] 
          hair.push(this.getBioString('hair', bio))
          this.hair = hair
        }
        let years
        if (this.getBioString('years', bio)) {
          years = this.getBioString('years', bio)
          this.careerStart = years.match(/\d{4}/)[0]  
          if ( years.match(/\d{4}/)[1] != undefined ) {
            this.careerEnd = years.match(/\d{4}/)[1]
          }
        }
        let birth
        if (this.getBioString('birthday', bio)) {
          let year = this.getBioString('birthday', bio).match(/\d{4}/)[0]
          let day = this.getBioString('birthday', bio).match(/\d{2}/)[0]
          let month = this.getBioString('birthday', bio).split(' ')[0]
          month = this.months.indexOf(month.toLowerCase())+1
          if (+month < 10) month = "0"+month.toString()
          birth = day.toString()+month.toString()+year.toString()
          this.birthday = birth
        }
        if (this.getBioString('height', bio)) {
          this.height = this.getBioString('height', bio).match(/\d{3}/)[0]
        }
        if (this.getBioString('weight', bio)) {
          this.weight = this.getBioString('weight', bio).match(/\d{2}/g)[1]
        }
        if (this.getBioString('measurements', bio)) {
          let sizes
          this.getBioString('measurements', bio).match(/\d{2}/g).map(el=>{
            sizes += el
          }) 
          let cup = this.getBioString('measurements', bio).split('-')[0]
          this.cup = cup.match(/\D{1,}/)[0]
          this.sizes = sizes
        }
        if (this.getBioString('birthplace', bio)) {
          this.nation = this.getBioString('birthplace', bio)
          if (this.getBioString('nationality', bio)) {
            if (this.getBioString('nationality', bio)
              .toLowerCase().includes('america')) {
              this.nation = 'United States'
            }
          }
        }
        this.category = ['Pornstar']
        }
      }, (error) => {
        console.log(error)
        this.findIafdRun = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: 'Cant find this performer'
        })
      })
    },
    getBioString(string, bio) {
      let val = _.filter(bio, (param) => (
        param.heading.toLowerCase().includes(string)
      ))[0].biodata
      if (val != 'No known aliases' && val != 'No data') {
        return val 
      } else return false
    },
    validate () {
      this.$refs.form.validate()
    },
    getNameRules(name) {
      let duplicate = this.$store.getters.performers.find({name:name}).value()
      if (name.length > 100) {
        return 'Name must be less than 100 characters'
      } else if (name.length < 3 && name.length > 0) {
        return 'Name must be more than 2 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate!==undefined && duplicate.id!==this.performer.id) {
        return 'Performer with that name already exists'
      } else {
        return true
      }
    },
    getAliasesRules(aliases) {
      if (aliases.length > 500) {
        return 'Aliases must be less than 500 characters'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(aliases)) {
        return 'Aliases must not content \\/\%\"<>{}\[\]'
      } else if (this.parseStringToArray(aliases).filter((x,i,a)=>a.indexOf(x)===i).length
          !== this.parseStringToArray(aliases).length) {
        return 'Duplicates in aliases'
      } else if (this.parseStringToArray(aliases).includes(this.performerName)) {
        return 'Aliases must not include a performer name'
      } else {
        return true
      }
    },
    getCareerStartRules(year) {
      if (+year < 1950 && year.length>0) {
        return 'Start year should be from 1950'
      } else if (+year > this.currentYear && year.length>0) {
        return `End year should be up to ${this.currentYear}`
      } else if (+year > this.careerEnd && this.careerEnd.length>0) {
        return 'Start year must be less than end year'
      } else {
        return true
      }
    },
    getCareerEndRules(year) {
      if (+year < 1950 && year.length>0) {
        return 'End year should be from 1950'
      } else if (+year > this.currentYear && year.length>0) {
        return `End year should be up to ${this.currentYear}`
      } else if (+year < this.careerStart && this.careerEnd.length>0) {
        return 'End year must be greater than start year'
      } else {
        return true
      }
    },
    getHeightRules(height) {
      if (+height < 100 && height.length>0) {
        return 'Min height is 100'
      } else if (+height > 220 && height.length>0) {
        return 'Max height is 220'
      } else {
        return true
      }
    },
    getWeightRules(weight) {
      if (+weight < 20 && weight.length>0) {
        return 'Min weight is 20'
      } else if (+weight > 220 && weight.length>0) {
        return 'Max weight is 220'
      } else {
        return true
      }
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
    savePerformerInfo(performerId) {
      this.validate()
      if (this.valid === false) {
        return false
      }
      let newAliases, newName, newBookmark
      // console.warn('aliases typeof: '+ typeof this.birthday)
      // console.warn('aliases is: '+ this.birthday)
      
      newAliases = JSON.stringify(this.aliases)

      // console.warn('aliases typeof: '+ typeof newAliases)
      // console.warn('aliases is: '+ newAliases)
      if (typeof this.performerName === 'string') {
        newName = this.removeTrash(this.performerName)
      } else { console.error('name has unsupported type') }
      if (this.isPerformerNameEditEnabled) {
        this.$store.getters.videos.filter({'performers': [this.performer.name]}).each(video=>{
          let index = video.performers.indexOf(this.performer.name)
          if (index !== -1) video.performers.splice(index, 1, this.performerName)
        }).write()
        this.$store.getters.tags.filter({'performers': [this.performer.name]}).each(video=>{
          let index = video.performers.indexOf(this.performer.name)
          if (index !== -1) video.performers.splice(index, 1, this.performerName)
        }).write()
        this.$store.getters.websites.filter({'performers': [this.performer.name]}).each(video=>{
          let index = video.performers.indexOf(this.performer.name)
          if (index !== -1) video.performers.splice(index, 1, this.performerName)
        }).write()
      }
      if (typeof newAliases === 'string') {
        newAliases = this.parseStringToArray(newAliases)
        newAliases = newAliases.filter((x, i, a) => a.indexOf(x) === i)
        newAliases = newAliases.sort((a, b) => a.localeCompare(b))
        // console.log(aliases)
        // console.log(`string:::${aliases}:::end`)
      } else { console.error('aliases has unsupported type') }
      // console.warn('aliases typeof: '+ typeof newAliases)
      // console.warn('aliases is: '+ newAliases)

      if (this.$store.state.Bookmarks.bookmarkText) {
        let bookmark = this.$store.getters.bookmarks.get('performers')
                        .find({itemId:this.performer.id})
        newBookmark = true
        if (bookmark.value()) {
          bookmark.assign({ 
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        } else {
          this.$store.getters.bookmarks.get('performers').push({
            id: shortid.generate(),
            itemId: this.performer.id,
            text: this.$store.state.Bookmarks.bookmarkText,
            date: Date.now(),
          }).write()
        }
      } else {
        this.$store.getters.bookmarks.get('performers')
          .remove({itemId:this.performer.id}).write()
        newBookmark = false
      }

      this.$store.getters.performers
        .find({ id: performerId })
        .assign({ 
          name: newName,
          favorite: this.favorite, 
          rating: this.rating, 
          aliases: newAliases,
          category: this.category,
          nation: this.nation,
          birthday: this.birthday,
          start: this.careerStart,
          end: this.careerEnd,
          ethnicity: this.ethnicity,
          hair: this.hair,
          eyes: this.eyes,
          height: this.height,
          weight: this.weight,
          bra: this.bra,
          waist: this.waist,
          hip: this.hip,
          boobs: this.boobs,
          body: this.body,
          pussy: this.pussy,
          pussyLips: this.pussyLips,
          pussyHair: this.pussyHair,
          cup: this.cup,
          tags: this.tags,
          bookmark: newBookmark,
          edit: Date.now(),
        })
        .write();

      // update edit dialog with new values
      this.performerName = newName
      this.aliases = newAliases.join(", ")

      // update performer card with new values
      console.log('info saved')
      let info = {}
      info.id = this.performer.id
      info.name = newName
      info.favorite = this.favorite
      info.rating = this.rating
      info.aliases = newAliases
      info.category = this.category
      info.nation = this.nation
      info.birthday = this.birthday
      info.start = this.careerStart
      info.end = this.careerEnd
      info.ethnicity = this.ethnicity
      info.hair = this.hair
      info.eyes = this.eyes
      info.height = this.height
      info.weight = this.weight
      info.bra = this.bra
      info.waist = this.waist
      info.hip = this.hip
      info.boobs = this.boobs
      info.body = this.body
      info.pussy = this.pussy
      info.pussyLips = this.pussyLips
      info.pussyHair = this.pussyHair
      info.cup = this.cup
      info.tags = this.tags
      info.bookmark = newBookmark
      this.$store.state.Performers.updateInfo = info
      this.$store.commit('updatePerformers')
      this.$store.state.Performers.dialogEditPerformerInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    getPercentComleted(newValue, oldValue) {
      // console.log(`newValue: ${newValue} oldValue: ${oldValue}`)
      // console.log(`newValue: ${typeof newValue} oldValue: ${typeof oldValue}`)
      // console.log(`newValue: ${newValue == true} oldValue: ${oldValue == true}`)
      if (newValue === undefined) return
      if (newValue.length > 0 && oldValue === undefined) {
        this.percentComplete = this.percentCompleteProgress + this.percentValue
        return
      }
      if (newValue.length > 0 && oldValue.length == 0) {
        this.percentComplete = this.percentCompleteProgress + this.percentValue
      }
      if (newValue.length == 0 && oldValue.length > 0) {
        this.percentComplete = this.percentCompleteProgress - this.percentValue
      }
      // console.log(this.percentCompleteProgress)
    },
    getImg() {
      let imgAvaPath = this.getImgUrl(this.performer.id + '_avatar.jpg')
      let imgMainPath = this.getImgUrl(this.performer.id + '_main.jpg')
      return this.checkAvatarImageExist(imgAvaPath, imgMainPath)+'?lastmod='+Date.now()
    },
    getImgUrl(img) {
      return  path.join(this.pathToUserData, `/media/performers/${img}`)
    },
    checkAvatarImageExist(imgAvaPath, imgMainPath) {
      if (fs.existsSync(imgAvaPath)) {
        return imgAvaPath
      } else if (fs.existsSync(imgMainPath)) {
        return imgMainPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png')
      }
    },
    copyPerformerNameToClipboard(dialog) {
      if(dialog == 'find') {
        this.tooltipCopyPerformerName = true
      } else {
        this.tooltipCopyName = true
      }
      setTimeout(() => {
        this.tooltipCopyName = false
        this.tooltipCopyPerformerName = false
      },3000)
      navigator.clipboard.writeText(this.performer.name).then(function() {
        console.log('Async: Copying to clipboard was successful!');
      }, function(err) {
        console.error('Async: Could not copy text: ', err);
      });
    },
    removeTag(item) { 
      const index = this.tags.indexOf(item.name)
      if (index >= 0) this.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    getTagImgUrl(tagId) {
      let imgTag = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      return this.checkTagImageExist(imgTag)
    },
    checkTagImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/tag.png')
      }
    },
    sort(items) {
      this[items] = this[items].sort((a, b) => a.localeCompare(b))
    },
  },
  watch: {
    performerName(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    birthday(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    nation(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    ethnicity(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    hair(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    eyes(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    height(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    weight(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    bra(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    waist(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    hip(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    boobs(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    cup(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    category(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    body(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    pussy(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    pussyLips(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    pussyHair(newValue, oldValue) {
      this.getPercentComleted(newValue, oldValue)
    },
    async careerStart(newValue, oldValue) {
      await this.$nextTick();
      this.getPercentComleted(newValue, oldValue)
      this.validate();
    },
    async careerEnd(newValue, oldValue) {
      await this.$nextTick();
      this.validate();
    }
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
</style> 