<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
              <v-icon>mdi-account-plus</v-icon>
            </v-btn>
          </template>
          <span>Add new performer</span>
        </v-tooltip>
      </template>
      <v-card width="500">
        <v-card-title class="py-1">
          <span class="headline">Add new performer</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-account-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-form ref="form" v-model="validPerformerName">
          <v-card-text class="pb-0">
            <v-textarea
              v-model="performerName" required :rules="nameRules" outlined label="Names"
              hint='Write a name on a new line to add several performers at once.' no-resize
            ></v-textarea>
            <v-alert
              v-model="alertDuplicatePerformers" border="left" text dense class="mt-6" 
              close-text="Close" type="warning" dismissible icon="mdi-account-multiple-outline"
            > Already in the database: {{duplicatePerformers}} </v-alert>
            <v-alert
              v-model="alertAddNewPerformers" border="left" text dense close-text="Close"
              icon="mdi-account-plus-outline" type="success" dismissible class="mt-6" 
            > Added: {{newPerformers}} </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              @click="addNewPerformer" :disabled="!validPerformerName"
              color="primary" class="mb-4 mr-4" 
            > <v-icon left>mdi-account-plus-outline</v-icon> Add
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-menu>

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
            <v-col cols="12" sm="4" class="pb-0 pr-0">
              <v-text-field 
                v-model="$store.state.Performers.filters.name"
                label="Name" hide-details clearable outlined dense
                prepend-icon="mdi-alphabetical-variant"
              />
            </v-col>
            <v-col cols="12" sm="2">
              <v-checkbox v-model="$store.state.Performers.filters.aliases" 
                dense hide-details class="pt-2 ma-0" label="Include aliases"
              />
            </v-col>
            <v-col cols="12" sm="6" class="pb-0">
              <v-select
                v-model="$store.state.Performers.filters.category"
                :items="$store.state.Settings.performerInfoCategory"
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
                :filter="filterItemsTags"
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
                v-model="$store.state.Performers.filters.nation" :items="countries" 
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="3" class="py-0" v-if="showMoreFilters">
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
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.ethnicity" 
                :items="$store.state.Settings.performerInfoEthnicity"
                label="Ethnicity" multiple hide-details outlined dense
                prepend-icon="mdi-account-group" append-icon=""
                @click:prepend-inner="changeFilterEthnicityLogic" 
                :prepend-inner-icon="filterEthnicityLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.hair"
                :items="$store.state.Settings.performerInfoHair"
                label="Hair" multiple hide-details outlined dense
                prepend-icon="mdi-face-woman" append-icon=""
                @click:prepend-inner="changeFilterHairLogic" 
                :prepend-inner-icon="filterHairLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="py-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.eyes"
                :items="$store.state.Settings.performerInfoEyes"
                label="Eyes" multiple hide-details outlined dense
                prepend-icon="mdi-eye" append-icon=""
                @click:prepend-inner="changeFilterEyesLogic" 
                :prepend-inner-icon="filterEyesLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.cup"
                :items="$store.state.Settings.performerInfoCups"
                label="Cup" multiple hide-details outlined dense
                prepend-icon="mdi-coffee" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.boobs" 
                :items="boobsItems" label="Boobs" multiple hide-details outlined dense
                prepend-icon="mdi-vector-circle-variant" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.body" 
                :items="$store.state.Settings.performerInfoBody" 
                label="Body" multiple hide-details outlined dense
                prepend-icon="mdi-human-child" append-icon=""
                @click:prepend-inner="changeFilterBodyLogic" 
                :prepend-inner-icon="filterBodyLogicIcon" 
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussy" 
                :items="$store.state.Settings.performerInfoPussy" 
                label="Pussy" multiple hide-details outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussyLips" 
                :items="$store.state.Settings.performerInfoPussyLips" 
                label="Pussy lips" multiple hide-details  outlined dense
                prepend-icon="mdi-cat" append-icon=""
                :menu-props="{contentClass:'select-dense-checkbox'}"
              />
            </v-col>
            <v-col cols="12" sm="4" class="pb-0" v-if="showMoreFilters">
              <v-select
                v-model="$store.state.Performers.filters.pussyHair" 
                :items="$store.state.Settings.performerInfoPussyHair" 
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
          <v-spacer></v-spacer>
          <v-btn small class="ma-4" color="primary" outlined @click="resetAllFilters(),filtersMenu=false">
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>
          
          <v-btn small class="ma-4" color="primary" @click="addNewTab(),filtersMenu=false">
            <v-icon left>mdi-tab-plus</v-icon> Open result in new tab
          </v-btn>
          
          <v-btn small class="ma-4" color="primary" @click="applyAllFilters(),filtersMenu=false">
            <v-icon left>mdi-filter</v-icon> Apply filters
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
          <v-icon>mdi-sort</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtons" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="name" v-on="on">
                <v-icon size="20">mdi-alphabetical-variant</v-icon>
                <v-icon right size="12" v-if="sortButtons==='name' && sortDirection==='desc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtons==='name' && sortDirection==='asc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="rating" v-on="on">
                <v-icon size="20">mdi-star-outline</v-icon>
                <v-icon right size="12" v-if="sortButtons==='rating' && sortDirection==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtons==='rating' && sortDirection==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                <v-icon size="20">mdi-calendar-clock</v-icon>
                <v-icon right size="12" v-if="sortButtons==='date' && sortDirection==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtons==='date' && sortDirection==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by date added</span>
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

    <v-spacer></v-spacer>
    
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-icon>mdi-magnify</v-icon>
          <v-icon class="card-size-icon">mdi-size-{{getCardSizeIcon()}}</v-icon>
        </v-btn>
      </template>
      <v-card width="300">
        <v-card-title class="py-1">
          <span class="headline">Card size</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-card-bulleted-settings</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-slider v-model="$store.state.Settings.performerCardSize"
          min="1" max="5" step="1" :tick-labels="cardSizes"
          @input="changeCardSize" class="pa-6"
        />
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn icon tile @click="toggleChipsColored()" v-on="on">
          <v-icon v-if="isChipsColored" color="white" class="colored">
            mdi-label-variant
          </v-icon>
          <v-icon v-else>mdi-label-variant</v-icon>
        </v-btn>
      </template>
      <span v-if="isChipsColored">Make labels grey</span>
      <span v-else>Make labels colored</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isRatingHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleRatingVisibilty()" v-on="on">
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isRatingHidden">Show Rating</span>
      <span v-else>Hide Rating</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNationalityHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNationalityVisibilty()" v-on="on">
            <v-icon>mdi-flag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNationalityHidden">Show country flag</span>
      <span v-else>Hide country flag</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFavoriteHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibilty()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHidden">Show Favorite's heart</span>
      <span v-else>Hide Favorite's heart</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isNameHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isNameHidden">Show Name</span>
      <span v-else>Hide Name</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isAliasesHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleAliasesVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isAliasesHidden">Show Aliases</span>
      <span v-else>Hide Aliases</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isMeterHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleMeterVisibilty()" v-on="on">
            <v-icon>mdi-gauge</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isMeterHidden">Show Tags Meter</span>
      <span v-else>Hide Tags Meter</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isCareerStatusHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleCareerStatusVisibilty()" v-on="on">
            <v-icon>mdi-list-status</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isCareerStatusHidden">Show Career Status</span>
      <span v-else>Hide Career Status</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isTagsHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isTagsHidden">Show Tags</span>
      <span v-else>Hide Tags</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isVideoTagsHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleVideoTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag-outline</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isVideoTagsHidden">Show Video Tags</span>
      <span v-else>Hide Video Tags</span>
    </v-tooltip>

    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
const shortid = require("shortid")

import FilterPerformers from '@/mixins/FilterPerformers'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformersAppbar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mixins: [FilterPerformers, ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    filtersMenu: false,
    validPerformerName: false,
    performerName: "",
    alertDuplicatePerformers: false,
    alertAddNewPerformers: false,
    duplicatePerformers: "",
    newPerformers: "",
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 2 || 'Name must be more than 2 characters',
      v => !/[%"?<>{}\[\]]/g.test(v) || 'Name must not content \\/\%\"?<>{}\[\]',
    ],
    showMoreFilters: false,
    filterCategoryLogicIcon: 'mdi-math-norm',
    filterTagsLogicIcon: 'mdi-math-norm',
    filterEthnicityLogicIcon: 'mdi-math-norm',
    filterHairLogicIcon: 'mdi-math-norm',
    filterEyesLogicIcon: 'mdi-math-norm',
    filterBodyLogicIcon: 'mdi-math-norm',
    filterPussyHairLogicIcon: 'mdi-math-norm',
    cardSizes: ['XS','S','M','L','XL'],
  }),
  computed: {
    colorHeader() {
      if (this.$vuetify.theme.isDark) {
        return this.$store.state.Settings.appColorDarkHeader
      } else return this.$store.state.Settings.appColorLightHeader
    },
    filterBadge() {
      let total = this.$store.getters.filteredPerformersTotal
      return total !== this.$store.getters.performersTotal
    },
    filteredPerformersTotal() {
      return this.$store.getters.filteredPerformersTotal
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
    isChipsColored: {
      get() {
        return this.$store.state.Performers.performerChipsColored
      },
      set(value) {
        this.$store.dispatch('updatePerformerChipsColored', value)
      },
    },
    isRatingHidden: {
      get () {
        return this.$store.state.Performers.performerRatingHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerRatingHidden', value)
      },
    },
    isNationalityHidden: {
      get () {
        return this.$store.state.Performers.performerNationalityHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNationalityHidden', value)
      },
    },
    isFavoriteHidden: {
      get () {
        return this.$store.state.Performers.performerFavoriteHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerFavoriteHidden', value)
      },
    },
    isNameHidden: {
      get () {
        return this.$store.state.Performers.performerNameHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerNameHidden', value)
      },
    },
    isAliasesHidden: {
      get () {
        return this.$store.state.Performers.performerAliasesHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerAliasesHidden', value)
      },
    },
    isMeterHidden: {
      get () {
        return this.$store.state.Performers.performerMeterHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerMeterHidden', value)
      },
    },
    isCareerStatusHidden: {
      get () {
        return this.$store.state.Performers.performerCareerStatusHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerCareerStatusHidden', value)
      },
    },
    isTagsHidden: {
      get () {
        return this.$store.state.Performers.performerTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerTagsHidden', value)
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Performers.performerVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updatePerformerVideoTagsHidden', value)
      },
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
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
    addNewPerformer() {
      // filter user entered data
      let performersArray  = this.performerName.trim()
      performersArray = performersArray.replace(/[\\/\%\"?<>{}\[\]]/g, '')
      performersArray = performersArray.split(/\r?\n/)
      performersArray = performersArray.filter((el)=>(el != ""))
      performersArray = performersArray.map(s => s.trim())
      console.log(`start:::${performersArray.join(', ')}:::end`)
      let dups = []
      let newPerformers = []
      let db = this.$store.getters.performers

      async function addPerformerInDb() {
        for (const performer of performersArray) {
          // check for duplicate name of performer
          // TODO: make case insensitive search
          let duplicate = db
            .find({ name: performer })
            .value();
          if (duplicate) {
            console.warn(
              `performer ${JSON.stringify(duplicate.name)} already in DB`
            );
            dups.push(duplicate.name)
            continue;
          }

          // create performer info
          var performerID = shortid.generate()
          var performerInfo = {
            id: performerID,
            name: performer,
            date: Date.now(),
            aliases: [],
            tags: [],
            favorite: false,
            bookmark: false,
            rating: 0,
            nation: "",
            birthday: "",
            start: "",
            end: "",
            ethnicity: [],
            hair: [],
            eyes: [],
            height: "",
            weight: "",
            bra: "",
            waist: "",
            hip: "",
            boobs: "",
            cup: "",
            category: [],
            body: [],
            pussy: "",
            pussyLips: "",
            pussyHair: [],
          }

          // add performerInfo to DB
          await db
            .push(performerInfo)
            .write()
            
          newPerformers.push(performer)

          console.log(`added performer "${performerInfo.name}": ${JSON.stringify(performerInfo)}`);
        }
      }
      addPerformerInDb().then(() => {
        this.duplicatePerformers = dups.join(", ")
        if(this.duplicatePerformers) {
          this.alertDuplicatePerformers = true
        } else { this.alertDuplicatePerformers = false }
        this.newPerformers = newPerformers.join(", ")
        console.log("Performers added!");
        if(this.newPerformers) {
          this.alertAddNewPerformers = true
        } else { this.alertAddNewPerformers = false }
        this.performerName = ""
        this.$store.commit('updatePerformers')
      })
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
    resetAllFilters(event) {
      this.$store.commit('resetFilteredPerformers')
      this.$store.dispatch('filterPerformers')
      this.updateTabFilters()
    },
    toggleFavorites() {
      this.updateFiltersOfPerformers('favorite', !this.$store.state.Performers.filters.favorite)
      this.$store.dispatch('filterPerformers')
    },
    toggleBookmarks() {
      this.updateFiltersOfPerformers('bookmark', !this.$store.state.Performers.filters.bookmark)
      this.$store.dispatch('filterPerformers')
    },
    updateTabFilters() {
      let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
      if (this.tabId === 'default') {
        this.$store.state.Performers.filtersReserved = newFilters
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.performersFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
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
    toggleChipsColored() {
      this.isChipsColored = !this.isChipsColored
    },
    toggleMeterVisibilty() {
      this.isMeterHidden = !this.isMeterHidden
    },
    toggleNameVisibilty() {
      this.isNameHidden = !this.isNameHidden
    },
    toggleRatingVisibilty() {
      this.isRatingHidden = !this.isRatingHidden
    },
    toggleNationalityVisibilty() {
      this.isNationalityHidden = !this.isNationalityHidden
    },
    toggleFavoriteVisibilty() {
      this.isFavoriteHidden = !this.isFavoriteHidden
    },
    toggleAliasesVisibilty() {
      this.isAliasesHidden = !this.isAliasesHidden
    },
    toggleCareerStatusVisibilty() {
      this.isCareerStatusHidden = !this.isCareerStatusHidden
    },
    toggleTagsVisibilty() {
      this.isTagsHidden = !this.isTagsHidden
    },
    toggleVideoTagsVisibilty() {
      this.isVideoTagsHidden = !this.isVideoTagsHidden
    },
    changeCardSize(event) {
      this.getCardSizeIcon()
      this.$store.getters.settings.set('performerCardSize', event).write()
    },
    getCardSizeIcon() {
      let size = ''
      switch(this.$store.state.Settings.performerCardSize) {
        case 1: size = 'xs'; break;
        case 2: size = 's'; break;
        case 3: size = 'm'; break;
        case 4: size = 'l'; break;
        case 5: size = 'xl'; break;
      }
      return size
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.colored {
  border-radius: 3px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
}
</style>