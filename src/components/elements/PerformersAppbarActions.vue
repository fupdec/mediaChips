<template>
	<div>
    <v-menu v-model="filtersMenu" offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" @click="filtersMenu=true" icon tile>
              <v-badge 
                :value="filterBadge" :content="filteredPerformersTotal" 
                overlap bottom :dot="filteredPerformersTotal==0" style="z-index: 5;"
              ><v-icon>mdi-filter</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <span>Filter performers</span>
        </v-tooltip>
      </template>
      <v-card width="1000">
        <v-card-title class="py-1">
          <span class="headline">Filter performers</span>
          <v-spacer></v-spacer>
          <v-btn @click="showMoreFilters = !showMoreFilters" small text>
            <span v-if="!showMoreFilters">Show extra filters</span>
            <span v-else>Hide extra filters</span>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" class="mx-2">
                mdi-help-circle-outline
              </v-icon>
            </template>
            <span>
              By default, fields with multiple values operate according to the "OR" logic.
              <br>To change the logic click on the icons
              <v-icon dark>mdi-math-norm</v-icon> and <v-icon dark>mdi-ampersand</v-icon>,
              <br>which corresponds to the logics "OR" and "AND".
            </span>
          </v-tooltip>
          <v-icon class="ml-2">mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-container fluid class="py-0">
          <v-row>
            <v-col cols="12" sm="5" class="pb-0 pr-0">
              <v-text-field 
                v-model="$store.state.Performers.filters.name"
                label="Name" hide-details clearable outlined dense
                prepend-icon="mdi-alphabetical-variant"
                @click:append-outer="pasteName" 
                append-outer-icon="mdi-clipboard-text-outline"
              />
            </v-col>
            <v-col cols="12" sm="1">
              <v-checkbox v-model="$store.state.Performers.filters.aliases" 
                dense hide-details class="pt-2 ma-0"
              > <template v-slot:label>
                  <span class="caption">Aliases</span>
                </template>
              </v-checkbox>
            </v-col>
            <v-col cols="12" sm="6" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.category"
                :items="categoriesList"
                label="Category" multiple hide-details outlined dense
                prepend-icon="mdi-account-group-outline"
                @click:prepend-inner="changeFilterCategoryLogic" 
                :prepend-inner-icon="filterCategoryLogicIcon" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="$store.state.Performers.filters.tags" :items="tags" 
                class="select-small-chips hidden-close"
                item-text="name" label="Tags" prepend-icon="mdi-tag-outline"
                item-value="name" no-data-text="No more tags" 
                multiple hide-selected hide-details clearable outlined dense
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterTagsLogic" 
                :prepend-inner-icon="filterTagsLogicIcon" append-icon=""
                @click:append-outer="pasteTags" 
                append-outer-icon="mdi-clipboard-text-outline"
                :filter="filterItemsTags" :disabled="isTagPage"
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeTag(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined close
                    :color="data.item.color" 
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'tag')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color">mdi-tag</v-icon>
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.altNames.length" class="aliases"> 
                      {{data.item.altNames.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="$store.state.Performers.filters.nation" :items="countriesList" 
                item-text="name" item-value="name" prepend-icon="mdi-flag"
                label="Nationality" small-chips multiple hide-details hide-selected clearable
                class="select-small-chips nation-chips hidden-close" append-icon=""
                :menu-props="{contentClass:'list-with-preview'}" outlined dense
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small class="my-1" close
                    :input-value="data.selected" label close-icon="mdi-close"
                    @click="data.select" @click:close="removeCountry(data.item)"
                  > <country-flag :country='data.item.code' size='normal'/> {{ data.item.name }}
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <country-flag :country='data.item.code' size='small'/>
                    {{data.item.name}}
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-container>
        <v-container fluid class="py-0" v-if="showMoreFilters">
          <v-row>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.ratingActive" dense hide-details 
                  class="mt-0" on-icon="mdi-star" off-icon="mdi-star"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Rating</span>
                      <span>
                        {{$store.state.Performers.filters.rating[0]}} - 
                        {{$store.state.Performers.filters.rating[1]}} 
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.rating" :min="0" :max="5" :step="0.5"
                  :disabled="!$store.state.Performers.filters.ratingActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.ageActive" dense hide-details 
                  class="mt-0" on-icon="mdi-cake-variant" off-icon="mdi-cake-variant"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Age</span>
                      <span>
                        {{$store.state.Performers.filters.age[0]}} - 
                        {{$store.state.Performers.filters.age[1]}} 
                        <span class="unit">years</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.age" :min="18" :max="99"
                  :disabled="!$store.state.Performers.filters.ageActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.careerActive" dense hide-details 
                  class="mt-0" on-icon="mdi-briefcase" off-icon="mdi-briefcase"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Career</span>
                      <span>
                        {{$store.state.Performers.filters.career[0]}} - 
                        {{$store.state.Performers.filters.career[1]}} 
                        <span class="unit">years</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-checkbox v-if="$store.state.Performers.filters.careerActive"
                  v-model="$store.state.Performers.filters.careerEnded" 
                  hide-details dense class="mt-0"
                ><template v-slot:label><span class="range-name">Career ended</span></template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.career" :min="1980" :max="2020"
                  :disabled="!$store.state.Performers.filters.careerActive" hide-details
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.heightActive" dense hide-details 
                  class="mt-0" on-icon="mdi-human-male-height" off-icon="mdi-human-male-height"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Height</span>
                      <span>
                        {{$store.state.Performers.filters.height[0]}} - 
                        {{$store.state.Performers.filters.height[1]}}
                        <span class="unit">cm</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.height"
                  :disabled="!$store.state.Performers.filters.heightActive" 
                  hide-details :min="100" :max="220"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.weightActive" dense hide-details 
                  class="mt-0" on-icon="mdi-weight" off-icon="mdi-weight"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Weight</span>
                      <span>
                        {{$store.state.Performers.filters.weight[0]}} - 
                        {{$store.state.Performers.filters.weight[1]}}
                        <span class="unit">kg</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.weight" 
                  :disabled="!$store.state.Performers.filters.weightActive"
                  hide-details :min="20" :max="220"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.braActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Bra</span>
                      <span>
                        {{$store.state.Performers.filters.bra[0]}} - 
                        {{$store.state.Performers.filters.bra[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.bra" 
                  :disabled="!$store.state.Performers.filters.braActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.waistActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Waist</span>
                      <span>
                        {{$store.state.Performers.filters.waist[0]}} - 
                        {{$store.state.Performers.filters.waist[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.waist" 
                  :disabled="!$store.state.Performers.filters.waistActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="3" class="py-0">
              <div class="range-wrapper fieldset">
                <v-checkbox 
                  v-model="$store.state.Performers.filters.hipActive" dense hide-details 
                  class="mt-0" on-icon="mdi-tape-measure" off-icon="mdi-tape-measure"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Hip</span>
                      <span>
                        {{$store.state.Performers.filters.hip[0]}} - 
                        {{$store.state.Performers.filters.hip[1]}}
                        <span class="unit">inch</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Performers.filters.hip" 
                  :disabled="!$store.state.Performers.filters.hipActive"
                  hide-details :min="20" :max="60"
                />
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="py-0">
              <v-select
                v-model="$store.state.Performers.filters.ethnicity" :items="ethnicList"
                label="Ethnicity" multiple hide-details outlined dense
                prepend-icon="mdi-account-group" append-icon=""
                @click:prepend-inner="changeFilterEthnicityLogic" 
                :prepend-inner-icon="filterEthnicityLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0">
              <v-select
                v-model="$store.state.Performers.filters.hair" :items="hairList"
                label="Hair" multiple hide-details outlined dense
                prepend-icon="mdi-face-woman" append-icon=""
                @click:prepend-inner="changeFilterHairLogic" 
                :prepend-inner-icon="filterHairLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0">
              <v-select
                v-model="$store.state.Performers.filters.eyes" :items="eyesList"
                label="Eyes" multiple hide-details outlined dense
                prepend-icon="mdi-eye" append-icon=""
                @click:prepend-inner="changeFilterEyesLogic" 
                :prepend-inner-icon="filterEyesLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.cup" :items="cupsList"
                label="Cup" multiple hide-details outlined dense
                prepend-icon="mdi-coffee" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.boobs" 
                :items="boobsList" label="Boobs" multiple hide-details outlined dense
                prepend-icon="mdi-vector-circle-variant" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.body" :items="bodyList" 
                label="Body" multiple hide-details outlined dense
                prepend-icon="mdi-human-child" append-icon=""
                @click:prepend-inner="changeFilterBodyLogic" 
                :prepend-inner-icon="filterBodyLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.pussy" :items="pussyList" 
                label="Pussy" multiple hide-details outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.pussyLips" :items="pussyLipsList" 
                label="Pussy lips" multiple hide-details  outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.pussyHair" :items="pussyHairList" 
                label="Pussy hair" multiple hide-details outlined dense
                prepend-icon="mdi-cat" append-icon=""
                @click:prepend-inner="changeFilterPussyHairLogic" 
                :prepend-inner-icon="filterPussyHairLogicIcon"
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-btn @click="resetAllFilters(),filtersMenu=false" small class="ma-4" color="primary" outlined>
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn @click="$store.state.Bookmarks.dialogFiltersPresets=true" small class="ma-4" color="primary"> 
            <v-icon left>mdi-content-save</v-icon> Presets
          </v-btn>
          
          <v-btn @click="addNewTab(),filtersMenu=false" small class="ma-4" color="primary" >
            <v-icon left>mdi-tab-plus</v-icon> New tab
          </v-btn>
          
          <v-btn @click="applyAllFilters(),filtersMenu=false" small class="ma-4" color="primary">
            <v-icon left>mdi-filter</v-icon> Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="resetAllFilters" icon tile v-on="on"> 
            <v-icon>mdi-filter-off</v-icon>
        </v-btn>
      </template>
      <span>Reset all filters</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleFavorites" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Performers.filters.favorite">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.filters.favorite">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Performers.filters.bookmark">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.filters.bookmark">Show all</span>
      <span v-else>Show bookmarks</span>
    </v-tooltip>
    
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-badge :content="performersSort" overlap bottom class="badge-sort">
            <v-icon>mdi-sort-variant</v-icon>
          </v-badge>
        </v-btn>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtons" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="name" v-on="on">
                <v-icon>mdi-alphabetical-variant</v-icon>
                <v-icon right size="14" v-if="sortButtons==='name' && sortDirection==='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='name' && sortDirection==='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="rating" v-on="on">
                <v-icon>mdi-star-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons==='rating' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='rating' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                <v-icon>mdi-calendar-clock</v-icon>
                <v-icon right size="14" v-if="sortButtons==='date' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='date' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by date added</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="video" v-on="on">
                <v-icon>mdi-video-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons==='video' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='video' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by number of videos</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="selectAllPerformers" v-on="on">
          <v-icon>mdi-select-all</v-icon>
        </v-btn>
      </template>
      <span>Select all performers</span>
    </v-tooltip>

    <FiltersPresets v-if="$store.state.Bookmarks.dialogFiltersPresets" 
      typeOfPresets="performers"
    />
	</div>
</template>


<script>
const shortid = require("shortid")

import FilterPerformers from '@/mixins/FilterPerformers'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformersAppbarActions',
  components: {
    FiltersPresets: () => import('@/components/elements/FiltersPresets.vue'),
  },
  mixins: [FilterPerformers, ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    filtersMenu: false,
    filterCategoryLogicIcon: 'mdi-math-norm',
    filterTagsLogicIcon: 'mdi-math-norm',
    filterEthnicityLogicIcon: 'mdi-math-norm',
    filterHairLogicIcon: 'mdi-math-norm',
    filterEyesLogicIcon: 'mdi-math-norm',
    filterBodyLogicIcon: 'mdi-math-norm',
    filterPussyHairLogicIcon: 'mdi-math-norm',
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredPerformersTotal
      return total !== this.$store.getters.performersTotal
    },
    filteredPerformersTotal() {
      return this.$store.getters.filteredPerformersTotal
    },
    showMoreFilters: {
      get() {
        return this.$store.state.Performers.showMoreFilters
      },
      set(value) {
        this.$store.state.Performers.showMoreFilters = value
      },
    },
    performersSort() {
      let sort = this.$store.state.Performers.filters.sortBy
      return sort.charAt(0) + sort.charAt(1) + sort.charAt(2) + '.'
    },
    categoriesList() {
      let cats = _.cloneDeep(this.$store.state.Settings.performerInfoCategory)
      cats.push('None')
      return cats
    },
    countriesList() {
      let countries = this.countries
      countries.unshift({name: 'None', code: ''})
      return countries
    },
    ethnicList() {
      let ethnic = _.cloneDeep(this.$store.state.Settings.performerInfoEthnicity)
      ethnic.push('None')
      return ethnic
    },
    hairList() {
      let hair = _.cloneDeep(this.$store.state.Settings.performerInfoHair)
      hair.push('None')
      return hair
    },
    eyesList() {
      let eyes = _.cloneDeep(this.$store.state.Settings.performerInfoEyes)
      eyes.push('None')
      return eyes
    },
    cupsList() {
      let cups = _.cloneDeep(this.$store.state.Settings.performerInfoCups)
      cups.push('None')
      return cups
    },
    boobsList() {
      let boobs = _.cloneDeep(this.$store.state.Settings.performerInfoBoobs)
      boobs.push('None')
      return boobs
    },
    bodyList() {
      let body = _.cloneDeep(this.$store.state.Settings.performerInfoBody)
      body.push('None')
      return body
    },
    pussyList() {
      let pussy = _.cloneDeep(this.$store.state.Settings.performerInfoPussy)
      pussy.push('None')
      return pussy
    },
    pussyLipsList() {
      let lips = _.cloneDeep(this.$store.state.Settings.performerInfoPussyLips)
      lips.push('None')
      return lips
    },
    pussyHairList() {
      let hair = _.cloneDeep(this.$store.state.Settings.performerInfoPussyHair)
      hair.push('None')
      return hair
    },
    sortButtons: {
      get() {
        return this.$store.state.Performers.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfPerformers('sortBy', value)
      },
    },
    sortDirection() {
      return this.$store.state.Performers.filters.sortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    async pasteName() {
      let text = await navigator.clipboard.readText()
      let name = this.$store.state.Performers.filters.name
      if (name) {
        text = name + text
      }
      this.updateFiltersOfPerformers('name', text)
    },
    async pasteTags() {
      let text = await navigator.clipboard.readText()
      let tags = text.split(', ')
      tags = this.$store.getters.tags.filter(t => (
        t.category.includes('performer') && tags.includes(t.name)
      )).value()
      tags = tags.map(t=>{return t.name})
      if (tags.length) {
        this.updateFiltersOfPerformers('tags', tags)
      }
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
    changeFilterTagsLogic() {
      let logic = this.$store.state.Performers.filters.tagsLogic
      this.filterTagsLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('tagsLogic', !logic)
    },
    changeFilterCategoryLogic() {
      let logic = this.$store.state.Performers.filters.categoryLogic
      this.filterCategoryLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('categoryLogic', !logic)
    },
    changeFilterEthnicityLogic() {
      let logic = this.$store.state.Performers.filters.ethnicityLogic
      this.filterEthnicityLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('ethnicityLogic', !logic)
    },
    changeFilterHairLogic() {
      let logic = this.$store.state.Performers.filters.hairLogic
      this.filterHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('hairLogic', !logic)
    },
    changeFilterEyesLogic() {
      let logic = this.$store.state.Performers.filters.eyesLogic
      this.filterEyesLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('eyesLogic', !logic)
    },
    changeFilterBodyLogic() {
      let logic = this.$store.state.Performers.filters.bodyLogic
      this.filterBodyLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('bodyLogic', !logic)
    },
    changeFilterPussyHairLogic() {
      let logic = this.$store.state.Performers.filters.pussyHairLogic
      this.filterPussyHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.updateFiltersOfPerformers('pussyHairLogic', !logic)
    },
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.performersFilters, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Performers.filters),
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    removeTag(item) { 
      const index = this.$store.state.Performers.filters.tags.indexOf(item.name)
      if (index >= 0) this.$store.state.Performers.filters.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeCountry(item) { 
      const index = this.$store.state.Performers.filters.nation.indexOf(item.name)
      if (index >= 0) this.$store.state.Performers.filters.nation.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    toggleFavorites() {
      this.updateFiltersOfPerformers('favorite', !this.$store.state.Performers.filters.favorite)
      this.$store.dispatch('filterPerformers')
    },
    toggleBookmarks() {
      this.updateFiltersOfPerformers('bookmark', !this.$store.state.Performers.filters.bookmark)
      this.$store.dispatch('filterPerformers')
    },
    updateFiltersOfPerformers(key, value){
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.updateTabFilters()
    },
    toggleSortDirection() {
      let dir = this.sortDirection === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfPerformers('sortDirection', dir)
      setTimeout(()=>{
        this.$store.dispatch('filterPerformers')
      },200)
    },
    selectAllPerformers() {
      this.$store.state.Performers.selection.clearSelection()
      let selected = this.$store.state.Performers.selection.select('.performer-card')
      this.$store.state.Performers.selection.keepSelection()
      this.getSelectedPerformers(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
    },
  },
}
</script>