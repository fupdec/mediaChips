<template>
  <div>
    <v-dialog v-model="$store.state.Performers.dialogEditPerformerInfo" persistent scrollable width="1000">
      <v-card>
        <v-card-title class="edit-card-title">
          <v-img :src="getImg()" :aspect-ratio="1" position="top"
            min-width="84" max-width="84" height="84" class="mr-6"
            gradient="to right, rgba(0,0,0,.0) 70%, #3d3d3d 100%"/>
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
              :value="percentCompleted" size="36" rotate="270"
              :color="percentCompleted>=99?'green':'white'" width="2">
              <v-icon v-if="percentCompleted>=99" color="green">mdi-check</v-icon>
              <div v-else>{{percentCompleted}}<span class="percent">%</span></div>
            </v-progress-circular>
          </div>
          <v-spacer></v-spacer>
          <v-btn class="ma-2" dark outlined @click="close"> Cancel </v-btn>
          <v-btn @click="savePerformerInfo(performer.id)" :disabled="!valid"
            class="ma-2" color="primary"> 
            <v-icon left>mdi-content-save-outline</v-icon> Save 
          </v-btn>
        </v-card-title>
        <vuescroll>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-container fluid>
                <v-row>
                  <v-col cols="4" class="pt-0">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn @click="getPerformerInfoFreeonce(performerNameForSearch)" v-on="on"
                          :loading="searchInProgress" color="secondary" class="mr-4" fab small>
                          <v-icon>mdi-auto-fix</v-icon>
                        </v-btn>
                      </template>
                      <span>Find information by name automatically on freeones.com</span>
                    </v-tooltip>
                    <v-btn @click="dialogFindPerformerInfo=true" color="secondary"> 
                      <v-icon left>mdi-magnify</v-icon> Find info
                    </v-btn>
                  </v-col>
                  <v-col cols="8" class="pt-0 text-right">
                    <v-chip label outlined class="mr-4">
                      <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
                    </v-chip>
                    <v-chip label outlined>
                      <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
                    </v-chip>
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
                      <v-text-field v-model="performerName"
                        label="Name" placeholder=" " :disabled="!isPerformerNameEditEnabled"
                        hint='The name may include letters, numbers, symbols: !?#&+()$~*-_'
                        :rules="[getNameRules]" maxlength="100" counter
                        error-count="3" validate-on-blur
                        @click:append-outer="pastePerformerName" 
                        append-outer-icon="mdi-clipboard-text-outline"/>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="aliases" label="Aliases" placeholder=" "
                      hint='Divide by "," or ; e.g. "Ca$$, Cass!dy; Cassy, Casssidy".
                      Aliases may include letters, numbers, symbols: !?#&+()$~*-_'
                      :rules="[getAliasesRules]" maxlength="500" counter
                      error-count="3" validate-on-blur @click:append-outer="pasteAliases" 
                      append-outer-icon="mdi-clipboard-text-outline"/>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="masked-block">
                      <v-text-field v-model="start" :rules="[getCareerStartRules]"
                        label="Career start year" persistent-hint
                        hint='YYYY' class="masked-input" placeholder=" "/>
                      <the-mask v-model="start" mask="####" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <div class="masked-block">
                      <v-text-field v-model="end" :rules="[getCareerEndRules]"
                        label="Career end year" persistent-hint hint='YYYY' 
                        class="masked-input" placeholder=" " />
                      <the-mask mask="####" v-model="end" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="category" :items="$store.state.Settings.performerInfoCategory"
                      multiple label="Category" placeholder=" " />
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-menu v-model="menu" ref="menu" :close-on-content-click="false"
                      transition="scale-transition" offset-y min-width="auto">
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field v-model="birthday" v-bind="attrs" v-on="on" readonly
                          label="Birthday" placeholder=" " hint='YYYY-MM-DD' persistent-hint/>
                      </template>
                      <v-date-picker v-model="birthday" ref="picker" @change="save" no-title
                        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01"/>
                    </v-menu>
                  </v-col>
                  <v-col cols="12" sm="9">
                    <v-autocomplete v-model="nations" :items="countries" clearable multiple 
                      item-text="name" item-value="name" label="Nationality" placeholder=" "
                      class=" nation-chips hidden-close nation-select"
                      :menu-props="{contentClass:'list-with-preview'}">
                      <template v-slot:selection="data">
                        <v-chip
                          v-bind="data.attrs" class="my-1 pl-1 pr-3" outlined close
                          :input-value="data.selected" close-icon="mdi-close"
                          @click="data.select" @click:close="removeChip(data.item)"
                        > <country-flag :country='data.item.code' size='normal'/> {{ data.item.name }}
                        </v-chip>
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
                  <v-col cols="12" sm="4">
                    <v-autocomplete v-model="ethnicity" @blur="sort('ethnicity')"
                      :items="$store.state.Settings.performerInfoEthnicity"
                      label="Ethnicity" multiple placeholder=" " />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-autocomplete v-model="eyes" @blur="sort('eyes')"
                      :items="$store.state.Settings.performerInfoEyes"
                      label="Eyes color" multiple placeholder=" " />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-autocomplete v-model="hair" @blur="sort('hair')"
                      :items="$store.state.Settings.performerInfoHair"
                      label="Hair color" multiple placeholder=" " />
                  </v-col>
                  <v-col cols="6" sm="2">
                    <div class="masked-block">
                      <v-text-field v-model="height" :rules="[getHeightRules]"
                        label="Height" persistent-hint hint='cm' class="masked-input"
                        validate-on-blur placeholder=" " />
                      <the-mask v-model="height" mask="###" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="6" sm="2">
                    <div class="masked-block">
                      <v-text-field v-model="weight" :rules="[getWeightRules]" label="Weight"
                        persistent-hint hint='kg' class="masked-input" validate-on-blur
                        placeholder=" " />
                      <the-mask v-model="weight" mask="###" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="3" sm="1">
                    <div class="masked-block">
                      <v-text-field label="Bra" placeholder=" " class="masked-input"
                        persistent-hint hint='in'/>
                      <the-mask v-model="bra" mask="###" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="3" sm="2">
                    <v-select v-model="cups" :items="$store.state.Settings.performerInfoCups"
                      label="Cups" multiple/>
                  </v-col>
                  <v-col cols="3" sm="1">
                    <div class="masked-block">
                      <v-text-field label="Waist" class="masked-input"
                        persistent-hint hint='in' placeholder=" "/>
                      <the-mask v-model="waist" mask="###" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="3" sm="1">
                    <div class="masked-block">
                      <v-text-field label="Hip" class="masked-input"
                        persistent-hint hint='in' placeholder=" "/>
                      <the-mask v-model="hip" mask="###" type="text" class="masked-mask"/>
                    </div>
                  </v-col>
                  <v-col cols="8" sm="3">
                    <v-autocomplete v-model="boobs" :items="$store.state.Settings.performerInfoBoobs"
                      label="Boobs" multiple placeholder=" "/>
                  </v-col>
                  <v-col cols="12">
                    <div v-if="params.length" class="overline text-center">Custom parameters</div>
                  </v-col>
                  <v-col v-for="param in params" :key="param.name" cols="6" sm="3">
                    <v-text-field v-if="param.type==='string'||param.type==='number'" 
                      @input="setVal($event,param.name)" :value="values[param.name]"
                      :label="param.name" placeholder=" " />

                    <v-autocomplete v-if="param.type==='array'" :items="param.items"
                      @input="setVal($event,param.name)" :value="values[param.name]"
                      :label="param.name" multiple placeholder=" " />

                    <v-switch v-if="param.type==='boolean'" inset :label="param.name"
                      @change="setVal($event,param.name)" :value="values[param.name]"/>
                        
                    <v-text-field v-if="param.type==='date'" readonly
                      :value="values[param.name]" @focus="picker=true, pickerParam=param.name"
                      :label="param.name" placeholder=" " hint='YYYY-MM-DD' persistent-hint
                      clearable @click:clear="setVal('', param.name)" />
                  </v-col>
                  <v-col cols="12" class="pa-0"/>
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
                              <v-icon>mdi-calendar-plus</v-icon>
                            </v-btn>
                          </template>
                          <span>date added</span>
                        </v-tooltip>
                      </v-btn-toggle>
                    </v-card-actions>
                  </v-col>
                  <v-col cols="12">
                    <div class="overline text-center my-4">Bookmark</div>
                    <v-textarea v-model="$store.state.Bookmarks.bookmarkText" hide-details
                      clearable auto-grow outlined placeholder="Write text here" />
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogFindPerformerInfo" scrollable max-width="1200px">
      <v-card :loading="searchInProgress" class="pb-4">
        <v-card-title class="edit-card-title pa-4">
          <div class="headline">
            Find information for
            <v-tooltip v-model="tooltipCopyPerformerName" bottom>
              <template v-slot:activator="{ click }">
                <span v-on="click" @click="copyPerformerNameToClipboard('find')" class="font-weight-bold "
                  style="cursor:pointer;" title="Copy name to clipboard"> {{performer.name}} 
                </span>
              </template>
              <span>Name copied to clipboard!</span>
            </v-tooltip>
          </div>
          
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
    <v-dialog v-model="picker" width="300px">
      <v-date-picker @change="setVal($event, pickerParam), picker=false"
        :max="new Date().toISOString().substr(0, 10)" min="1950-01-01" 
        :value="values[pickerParam]" no-title color="primary" full-width/>
    </v-dialog>
  </div>
</template>


<script>
const { clipboard } = require('electron')
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
      this.start = this.performer.start
      this.end = this.performer.end
      this.nations = this.performer.nations
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
      this.cups = this.performer.cups
      this.category = this.performer.category
      this.queryString = this.performer.name
      this.tags = this.performer.tags.sort((a, b) => a.localeCompare(b))
      if (this.performer.bookmark) {
        let text = this.$store.getters.bookmarks.get('performers')
                    .find({itemId:this.performer.id}).value().text
        this.$store.state.Bookmarks.bookmarkText = text
      }
      // for custom parameters
      for (let param in this.params) {
        this.values[this.params[param].name] = this.performer[this.params[param].name]
      }
      this.calcPercentComleted()
    })
  },
  updated() {
    this.validate()
  },
  data: () => ({
    date: null,
    menu: false,
    isPerformerNameEditEnabled: false,
    valid: false,
    dialogFindPerformerInfo: false,
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
    tooltipCopyPerformerName: false,
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
    tagsAll() {
      let tags = this.$store.getters.tags.filter(t=>(t.type.includes('performer')))
      return this.sortItems(tags, 'Tags')
    },
    sortButtonsTags: {
      get() {
        return this.$store.state.Settings.videoEditTagsSortBy
      },
      set(value) {
        this.$store.dispatch('updateSettingsState', {key:'videoEditTagsSortBy', value})
      },
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    dateAdded() {
      let date = new Date(this.performer.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.performer.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    params() {
      return this.$store.state.Settings.customParametersPerformer
    },
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
    sortItems(items, type) {
      const sortBy = this[`sortButtons${type}`]
      let itemsSorted = items.orderBy(i=>i.name.toLowerCase(),['asc'])
      if (sortBy !== 'name') {
        if (sortBy == 'color') {
          let swatches = this.$store.state.swatches
          itemsSorted = itemsSorted.orderBy(i=>swatches.indexOf(i.color.toLowerCase()),['asc']).value()
        } else {
          itemsSorted = itemsSorted.orderBy(i=>i[sortBy],['desc']).value()
        }
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
      this.searchInProgress = true
      this.showFindError = false
      this.resultFromFreeones = true
      axios.get(`https://www.freeones.ru/babes?q=${this.queryString}&s=rank.currentRank&o=asc&l=96&p=1`)
      .then((response)=>{
        if(response.status === 200) {
          this.searchInProgress = false
          this.foundPerformers = []
          console.log('result')
          const html = response.data;
          const $ = cheerio.load(html)
          $('.grid-item').each((i,e) => {
            let p = {}
            p.img = $(e).find('.image-content').attr('src')
            if (p.img == undefined) {
              p.img = $(e).find('.image-content').attr('data-src')
            }
            if (p.img == undefined) {
              p.img = path.join(this.pathToUserData, '/img/templates/performer.png')
            }
            p.name = $(e).find('[data-test="subject-name"]').text().trim()
            p.link = p.name.replace(' ', '-').toLowerCase()
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
        this.searchInProgress = false
        this.showFindError = true
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.performer.name}`
        })
      })
    },
    findPerformersIafd() {
      this.showFindError = false
      this.searchInProgress = true
      this.resultFromFreeones = false
      let url = 'http://www.iafd.com/results.asp?searchtype=comprehensive&searchstring='
      axios.get(url + this.queryString).then((response)=>{
        if(response.status === 200) {
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
        this.searchInProgress = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.performer.name}`
        })
      })
    },
    getPerformerInfoFreeonce(performer) {
      this.searchInProgress = true
      this.foundPerformers = []
      axios.get(`https://www.freeones.com/${performer}/bio`).then((response)=>{
        if (response.status === 200) {
          this.searchInProgress = false
          this.clearPreviouslyFound()

          const html = response.data;
          const $ = cheerio.load(html)
          let profile = {}

          profile.aliases = $('[data-test="p_aliases"]').text().trim()
          let yearsActive = []
          $('.timeline-horizontal .m-0').each((i, elem)=>{
            yearsActive[i] = $(elem).text().trim()
          }) 
          if (yearsActive[0]) {
            if (!yearsActive[0].match(/\D*/)[0]) profile.start = yearsActive[0] // if not contains words
          }
          if (yearsActive[1]) {
            if (!yearsActive[1].match(/\D*/)[0]) profile.end = yearsActive[1] // if not contains words like "Now"
          }
          let countries = this.countries.map(c=>c.name)
          if ( countries.includes($('[data-test="link-country"] span').text().trim()) ) {
            profile.nations = [$('[data-test="link-country"] span').text().trim()]
          }
          profile.birth = $('[href*="dateOfBirth"]').attr('href')
          if (profile.birth) {
            let date = profile.birth.match(/\d{4}-\d{2}-\d{2}/)
            if (date) profile.birth = date[0]
            else profile.birth = undefined
          }
          let ethnicity = $('[data-test="link_span_ethnicity"]').text().trim()
          if (ethnicity) {
            profile.ethnicity = []
            ethnicity = ethnicity.split(',')
            let performerInfoEthnicity = this.$store.getters.settings.get('performerInfoEthnicity').value()
            for (let i=0; i<ethnicity.length; i++) {
              if ( performerInfoEthnicity.includes(ethnicity[i]) ) {
                profile.ethnicity.push(ethnicity[i])
              }
            }
          }
          let eyes = $('[data-test="link_span_eye_color"]').text().trim()
          if (eyes) {
            profile.eyes = []
            eyes = eyes.split(',')
            let performerInfoEyes = this.$store.getters.settings.get('performerInfoEyes').value()
            for (let i=0; i<eyes.length; i++) {
              if ( performerInfoEyes.includes(eyes[i]) ) {
                profile.eyes.push(eyes[i])
              }
            }
          }
          let hair = $('[data-test="link_span_hair_color"]').text().trim()
          if (hair) {
            profile.hair = []
            hair = hair.split(',')
            let performerInfoHair = this.$store.getters.settings.get('performerInfoHair').value()
            for (let i=0; i<hair.length; i++) {
              if ( performerInfoHair.includes(hair[i]) ) {
                profile.hair.push(hair[i])
              }
            }
          }
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
              profile.cups = [ sizes[0].match(/\D{1,}/)[0] ]
            }
            sizes[0] = sizes[0].match(/\d{2}/)[0]
          }
          profile.bra = sizes[0]
          profile.waist = sizes[1]
          profile.hip = sizes[2]
          profile.boobs = $('[data-test="link_span_boobs"]').text().trim()
          profile.profession = $('.sidebar-right .heading').next().find('.text-center')[0].children[0].data
          if (profile.aliases != undefined) { this.transfer.found.aliases = profile.aliases }
          if (profile.start != undefined) { this.transfer.found.start = profile.start }
          if (profile.end != undefined) { this.transfer.found.end = profile.end }
          if (profile.profession != undefined) { 
            if (profile.profession.includes('Adult')) {
              profile.profession = 'Erotic model'
            }
            if (profile.profession.includes('Porn')) {
              profile.profession = 'Pornstar'
            }
            if (this.$store.getters.settings.get('performerInfoCategory').value().includes(profile.profession)) {
              this.transfer.found.category = [profile.profession]
            } else profile.profession = undefined
          }
          if (profile.nations != undefined) { this.transfer.found.nations = profile.nations }
          if (profile.birth != undefined) { this.transfer.found.birthday = profile.birth }
          if (profile.ethnicity != undefined) { this.transfer.found.ethnicity = profile.ethnicity }
          if (profile.hair != undefined) { this.transfer.found.hair = profile.hair }
          if (profile.eyes != undefined) { this.transfer.found.eyes = profile.eyes }
          if (profile.height != undefined) { this.transfer.found.height = profile.height }
          if (profile.weight != undefined) { this.transfer.found.weight = profile.weight }
          if (profile.bra != undefined) { this.transfer.found.bra = profile.bra }
          if (profile.waist != undefined) { this.transfer.found.waist = profile.waist }
          if (profile.hip != undefined) { this.transfer.found.hip = profile.hip }
          if (profile.boobs != undefined) { 
            if (profile.boobs === "Natural") {
              profile.boobs = "Real"
            }
            this.transfer.found.boobs = [profile.boobs]
          }
          if (profile.cups != undefined) { this.transfer.found.cups = profile.cups }
        }
        this.getTransferCurrent()
        this.dialogTransferInfo = true
        this.dialogFindPerformerInfo = false
      }, (error) => {
        console.log(error)
        this.searchInProgress = false
        this.dialogFindPerformerInfo = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.performer.name}`
        })
      })
    },
    getPerformerInfoIafd(performer) {
      this.searchInProgress = true
      this.foundPerformers = []
      axios.get(`http://www.iafd.com${performer}`).then((response) => {
        if(response.status === 200) {
          this.searchInProgress = false
          this.clearPreviouslyFound()

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
            this.transfer.found.aliases = this.getBioString('performer', bio)
          }
          if (this.getBioString('ethnicity', bio)) {
            let ethnicity = this.getBioString('ethnicity', bio).split(',')
            let foundEth = []
            let performerInfoEthnicity = this.$store.getters.settings.get('performerInfoEthnicity').value()
            for (let i=0; i<ethnicity.length; i++) {
              if ( performerInfoEthnicity.includes(ethnicity[i]) ) {
                foundEth.push(ethnicity[i])
              }
            }
            if (foundEth.length) {
              this.transfer.found.ethnicity = foundEth
            }
          }
          if (this.getBioString('hair', bio)) {
            let hair = this.getBioString('hair', bio).split(',')
            let foundHair = []
            let performerInfoHair = this.$store.getters.settings.get('performerInfoHair').value()
            for (let i=0; i<hair.length; i++) {
              if ( performerInfoHair.includes(hair[i]) ) {
                foundHair.push(hair[i])
              }
            }
            if (foundHair.length) {
              this.transfer.found.hair = foundHair
            }
          }
          let years
          if (this.getBioString('years', bio)) {
            years = this.getBioString('years', bio)
            this.transfer.found.start = years.match(/\d{4}/)[0]  
            if ( years.match(/\d{4}/)[1] != undefined ) {
              this.transfer.found.end = years.match(/\d{4}/)[1]
            }
          }
          if (this.getBioString('birthday', bio)) {
            let year = this.getBioString('birthday', bio).match(/\d{4}/)[0]
            let day = this.getBioString('birthday', bio).match(/\d{2}/)[0]
            let month = this.getBioString('birthday', bio).split(' ')[0]
            month = this.months.indexOf(month.toLowerCase())+1
            if (+month < 10) month = "0"+month.toString()
            this.transfer.found.birthday = `${year}-${month}-${day}`
          }
          if (this.getBioString('height', bio)) {
            this.transfer.found.height = this.getBioString('height', bio).match(/\d{3}/)[0]
          }
          if (this.getBioString('weight', bio)) {
            this.transfer.found.weight = this.getBioString('weight', bio).match(/\d{2}/g)[1]
          }
          if (this.getBioString('measurements', bio)) {
            let sizes = this.getBioString('measurements', bio).match(/\d{2}/g)
            let cups = this.getBioString('measurements', bio).split('-')[0]
            this.transfer.found.cups = [ cups.match(/\D{1,}/)[0] ]
            this.transfer.found.bra = sizes[0]
            this.transfer.found.waist = sizes[1]
            this.transfer.found.hip = sizes[2]
          }
          if (this.getBioString('birthplace', bio)) {
            let countries = this.countries.map(c=>c.name)
            if (countries.includes(this.getBioString('birthplace', bio))) {
              this.transfer.found.nations = [this.getBioString('birthplace', bio)]
            }
            if (this.getBioString('nationality', bio).toLowerCase().includes('america')) {
              this.transfer.found.nations = ['United States']
            }
          }
          this.transfer.found.category = ['Pornstar']
            
          this.getTransferCurrent()
          this.dialogTransferInfo = true
          this.dialogFindPerformerInfo = false
        }
      }, (error) => {
        this.searchInProgress = false
        this.dialogFindPerformerInfo = false
        console.log(error)
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.performer.name}`
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
      } else if (+year > this.end && this.end.length>0) {
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
      } else if (+year < this.start && this.end.length>0) {
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
          nations: this.nations || [],
          birthday: this.birthday,
          start: this.start,
          end: this.end,
          ethnicity: this.ethnicity,
          hair: this.hair,
          eyes: this.eyes,
          height: this.height,
          weight: this.weight,
          bra: this.bra,
          waist: this.waist,
          hip: this.hip,
          boobs: this.boobs || [],
          cups: this.cups,
          tags: this.tags,
          bookmark: newBookmark,
          edit: Date.now(),
        })
        .assign(this.values)
        .write();

      // update edit dialog with new values
      this.performerName = newName
      this.aliases = newAliases.join(", ")

      // update performer card with new values
      console.log('info saved')
      this.$store.commit('updatePerformers')
      this.$store.state.Performers.dialogEditPerformerInfo = false
      this.$store.state.Bookmarks.bookmarkText = ''
    },
    calcPercentComleted() {
      let completed = []
      let appParams = [
        'performerName', 
        'start', 
        'category',
        'birthday', 
        'nations', 
        'ethnicity',
        'eyes',
        'hair', 
        'height', 
        'weight', 
        'bra', 
        'waist', 
        'hip', 
        'cups', 
        'boobs', 
      ]
      for (let i=0; i<appParams.length; i++) {
        this[appParams[i]].length > 0 ? completed.push(1) : completed.push(0) 
      }
      // for custom parameters
      for (let val in this.values) {
        if (typeof val == 'boolean') {
          this.values[val] === true ? completed.push(1) : completed.push(0)    
        } else {
          this.values[val].length > 0 ? completed.push(1) : completed.push(0) 
        }
      }

      let completedValue = 0
      for (let i=0; i<completed.length; i++) {
        completedValue = completedValue + completed[i]
      }
      this.percentCompleted = Math.ceil(completedValue / completed.length * 100)
    },
    getImg() {
      let imgAvaPath = this.getImgUrl(this.performer.id + '_avatar.jpg')
      let imgMainPath = this.getImgUrl(this.performer.id + '_main.jpg')
      return 'file://' + this.checkAvatarImageExist(imgAvaPath, imgMainPath)
    },
    getImgUrl(img) {
      return path.join(this.pathToUserData, `/media/performers/${img}`)
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
      clipboard.writeText(this.performer.name)
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
    save(date) {
      this.$refs.menu.save(date)
    },
    setVal(value, param) {
      this.values[param] = value 
      this.calcPercentComleted()
    },
    removeChip(item) { 
      const index = this.nations.indexOf(item.name)
      if (index >= 0) this.nations.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
  },
  watch: {
    menu (val) {
      val && setTimeout(() => (this.$refs.picker.activePicker = 'YEAR'))
    },
    performerName() {
      this.calcPercentComleted()
    },
    birthday() {
      this.calcPercentComleted()
    },
    nations() {
      this.calcPercentComleted()
    },
    ethnicity() {
      this.calcPercentComleted()
    },
    hair() {
      this.calcPercentComleted()
    },
    eyes() {
      this.calcPercentComleted()
    },
    height() {
      this.calcPercentComleted()
    },
    weight() {
      this.calcPercentComleted()
    },
    bra() {
      this.calcPercentComleted()
    },
    waist() {
      this.calcPercentComleted()
    },
    hip() {
      this.calcPercentComleted()
    },
    boobs() {
      this.calcPercentComleted()
    },
    cups() {
      this.calcPercentComleted()
    },
    category() {
      this.calcPercentComleted()
    },
    async start() {
      await this.$nextTick();
      this.calcPercentComleted()
      this.validate();
    },
    async end() {
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