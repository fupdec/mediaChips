<template>
	<v-app-bar app dense clipped-left :color="colorHeader" extension-height="32">
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Websites.dialogEditWebsite = true" 
          icon tile v-on="on"> 
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
      <span>Edit website</span>
    </v-tooltip>

    <v-menu v-model="filtersMenu" offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-btn v-on="{ ...onMenu, ...onTooltip }" @click="filtersMenu=true" icon tile>
              <v-badge 
                :value="filterBadge" :content="filteredVideosTotal" 
                overlap bottom :dot="filteredVideosTotal==0" style="z-index: 5;"
              ><v-icon>mdi-filter</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <span>Filter videos</span>
        </v-tooltip>
      </template>
      <v-card width="800">
        <v-card-title class="py-1">
          <span class="headline">Filter videos</span>
          <v-spacer></v-spacer>
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
          <v-icon>mdi-filter</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-container fluid class="py-0">
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-text-field 
                v-model="$store.state.Videos.filters.path" 
                clearable dense hide-details outlined
                label="Path or filename include" prepend-icon="mdi-folder-text-outline"
              />
            </v-col>
            <v-col cols="12" sm="7">
              <v-autocomplete
                v-model="$store.state.Videos.filters.performers" :items="performers"
                item-text="name" item-value="name" no-data-text="No more performers"
                class="mb-4 select-small-chips hidden-close" label="Performers" 
                multiple hide-selected hide-details clearable dense outlined
                prepend-icon="mdi-account" append-icon="" 
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterPerformersLogic" 
                :prepend-inner-icon="filterPerformersLogicIcon"
                :filter="filterItemsPerformers"
              >
                <template v-slot:selection="data">
                  <v-chip close small class="my-1" close-icon="mdi-close"
                    v-bind="data.attrs" :input-value="data.selected" 
                    @click="data.select" @click:close="removePerformer(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :color="getPerformerColorDependsRating(data.item.rating)"
                    :class="{'tag-with-favorite-performer': data.item.favorite}"
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'performer')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > 
                    <v-icon 
                      left size="12" 
                      :color="data.item.favorite===false ? 'grey' : 'pink'"
                    > mdi-heart </v-icon>
                    <v-rating 
                      class="rating-inline small mr-2"
                      v-model="data.item.rating"
                      color="yellow darken-3"
                      background-color="grey darken-1"
                      empty-icon="$ratingFull" 
                      half-icon="mdi-star-half-full"
                      dense half-increments readonly size="10"
                    />
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.aliases.length" class="aliases"> 
                      aka {{data.item.aliases.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-model="$store.state.Videos.filters.tags" :items="tags" 
                class="mb-4 select-small-chips hidden-close"
                item-text="name" dense label="Tags" prepend-icon="mdi-tag-outline"
                item-value="name" no-data-text="No more tags" append-icon="" 
                multiple hide-selected hide-details clearable outlined
                :menu-props="{contentClass:'list-with-preview'}"
                @click:prepend-inner="changeFilterTagsLogic" 
                :prepend-inner-icon="filterTagsLogicIcon"
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
                  > <v-icon left size="16" :color="data.item.color"> mdi-tag </v-icon>
                    <span>{{data.item.name}}</span>
                    <span v-if="data.item.altNames.length" class="aliases"> 
                      {{data.item.altNames.join(', ').slice(0,50)}}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-model="$store.state.Videos.filters.websites" :items="websites" 
                class="mb-4 select-small-chips hidden-close" append-icon="" 
                item-text="name" dense label="Websites" prepend-icon="mdi-web"
                item-value="name" no-data-text="No more websites" 
                multiple hide-selected hide-details clearable outlined
                :menu-props="{contentClass:'list-with-preview'}" disabled
              >
                <template v-slot:selection="data">
                  <v-chip
                    v-bind="data.attrs" small close class="my-1" close-icon="mdi-close"
                    @click="data.select" @click:close="removeWebsite(data.item)"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                    :input-value="data.selected" outlined label
                    :color="data.item.color"
                  ><span>{{ data.item.name }}</span>
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <div class="list-item"
                    @mouseover.stop="showImage($event, data.item.id, 'website')" 
                    @mouseleave.stop="$store.state.hoveredImage=false"
                  > <v-icon left size="16" :color="data.item.color"> mdi-web </v-icon>
                    {{data.item.name}}
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="5">
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Videos.filters.durationActive" class="mt-0"
                  dense hide-details on-icon="mdi-clock-outline" off-icon="mdi-clock-outline"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>Duration</span>
                      <span>
                        {{$store.state.Videos.filters.duration[0]}} - 
                        {{$store.state.Videos.filters.duration[1]}}
                        <span class="unit">min</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Videos.filters.duration" 
                  :disabled="!$store.state.Videos.filters.durationActive"
                  hide-details :min="0" :max="maxDuration"
                />
              </div>
              <div class="range-wrapper">
                <v-checkbox 
                  v-model="$store.state.Videos.filters.sizeActive" class="mt-0"
                  dense hide-details on-icon="mdi-harddisk" off-icon="mdi-harddisk"
                >
                  <template v-slot:label>
                    <span class="range-name">
                      <span>File size</span>  
                      <span>
                        {{$store.state.Videos.filters.size[0]}} - 
                        {{$store.state.Videos.filters.size[1]}}
                        <span class="unit">Gb</span>
                      </span>
                    </span>
                  </template>
                </v-checkbox>
                <v-range-slider 
                  v-model="$store.state.Videos.filters.size" 
                  :disabled="!$store.state.Videos.filters.sizeActive"
                  hide-details :min="0" :max="20" step="0.1"
                />
              </div>
              <div class="quality-container mb-2">
                <div><v-icon left>mdi-video-switch-outline</v-icon>Video quality</div>
                <v-btn-toggle
                  v-model="$store.state.Videos.filters.quality"
                  class="grouped-buttons" dense multiple color="primary"
                >
                  <v-btn outlined :value="2160">4K</v-btn>
                  <v-btn outlined :value="1080">1080p</v-btn>
                  <v-btn outlined :value="720">720p</v-btn>
                  <v-btn outlined :value="480">480p</v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>

          <v-btn small class="mr-4 mb-4" color="primary" outlined @click="resetAllFilters(), filtersMenu=false">
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>

          <v-btn small class="mb-4 mr-4" color="primary" @click="addNewTab(), filtersMenu=false">
            <v-icon left>mdi-tab-plus</v-icon> Open result in new tab
          </v-btn>
          
          <v-btn small class="mr-4 mb-4" color="primary" @click="applyAllFilters(), filtersMenu=false">
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
          <v-icon v-if="$store.state.Videos.filters.favorite">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.filters.favorite">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Videos.filters.bookmark">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.filters.bookmark">Show all</span>
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
              <v-btn outlined @click="toggleSortDirection" value="duration" v-on="on">
                <v-icon size="20">mdi-clock-outline</v-icon>
                <v-icon right size="12" v-if="sortButtons==='duration' && sortDirection==='desc'">
                  mdi-arrow-down-bold-outline
                </v-icon>
                <v-icon right size="12" v-if="sortButtons==='duration' && sortDirection==='asc'">
                  mdi-arrow-up-bold-outline
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by duration</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
            <v-btn outlined @click="toggleSortDirection" value="size" v-on="on">
              <v-icon size="22">mdi-harddisk</v-icon>
              <v-icon right size="12" v-if="sortButtons==='size' && sortDirection==='desc'">
                mdi-arrow-down-bold-outline
              </v-icon>
              <v-icon right size="12" v-if="sortButtons==='size' && sortDirection==='asc'">
                mdi-arrow-up-bold-outline
              </v-icon>
            </v-btn>
            </template>
            <span>Sort by size</span>
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
				<v-btn @click="selectAllVideos" icon tile v-on="on">
					<v-icon>mdi-select-all</v-icon>
				</v-btn>
			</template>
			<span>Select all videos</span>
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
        <v-slider v-model="$store.state.Settings.videoCardSize"
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
        <v-badge :value="isQualityLabelHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleQualityLabelVisibilty()" v-on="on">
            <v-icon>mdi-video-box</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isQualityLabelHidden">Show Quality Label</span>
      <span v-else>Hide Quality Label</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isDurationHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleDurationVisibilty()" v-on="on">
            <v-icon>mdi-timer</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isDurationHidden">Show Duration</span>
      <span v-else>Hide Duration</span>
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
        <v-badge :value="isFavoriteHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibilty()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHidden">Show Favorite heart</span>
      <span v-else>Hide Favorite heart</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileNameHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileNameHidden">Show Filename</span>
      <span v-else>Hide Filename</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileInfoHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileInfoVisibilty()" v-on="on">
            <v-icon>mdi-filmstrip</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileInfoHidden">Show File Information</span>
      <span v-else>Hide File Information</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isPerformersHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="togglePerformerVisibilty()" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isPerformersHidden">Show Performers</span>
      <span v-else>Hide Performers</span>
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
        <v-badge :value="isWebsiteHidden" icon="mdi-eye-off" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleWebsiteVisibilty()" v-on="on">
            <v-icon>mdi-web</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isWebsiteHidden">Show Website</span>
      <span v-else>Hide Website</span>
    </v-tooltip>

    <template v-slot:extension v-if="$store.getters.tabs.length">
      <Tabs />
    </template>
	</v-app-bar>
</template>


<script>
const shortid = require("shortid")

import FilterVideos from '@/mixins/FilterVideos'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformerAppbar',
  components: {
    Tabs: () => import('@/components/elements/Tabs.vue'),
  },
  mixins: [FilterVideos, ShowImageFunction], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    filtersMenu: false,
    filterPerformersLogicIcon: 'mdi-math-norm',
    filterTagsLogicIcon: 'mdi-math-norm',
    cardSizes: ['XS','S','M','L','XL'],
  }),
  computed: {
    website() {
      return this.$store.getters.websites.find({ id: this.websiteId }).value()    
    },
    websiteId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    colorHeader() {
      if (this.$vuetify.theme.isDark) {
        return this.$store.state.Settings.appColorDarkHeader
      } else return this.$store.state.Settings.appColorLightHeader
    },
    filterBadge() {
      let total = this.$store.getters.filteredVideosTotal
      return total !== this.$store.getters.videosTotal
    },
    filteredVideosTotal() {
      return this.$store.getters.filteredVideosTotal
    },
    sortButtons: {
      get() {
        return this.$store.state.Videos.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfVideos('sortBy', value)
      },
    },
    sortDirection() {
      return this.$store.state.Videos.filters.sortDirection
    },
    isChipsColored: {
      get() {
        return this.$store.state.Videos.videoChipsColored
      },
      set(value) {
        this.$store.dispatch('updateVideoChipsColored', value)
      },
    },
    isFileNameHidden: {
      get() {
        return this.$store.state.Videos.videoFileNameHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileNameHidden', value)
      },
    },
    isFileInfoHidden: {
      get() {
        return this.$store.state.Videos.videoFileInfoHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileInfoHidden', value)
      },
    },
    isRatingHidden: {
      get() {
        return this.$store.state.Videos.videoRatingHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoRatingHidden', value)
      },
    },
    isFavoriteHidden: {
      get() {
        return this.$store.state.Videos.videoFavoriteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFavoriteHidden', value)
      },
    },
    isQualityLabelHidden: {
      get() {
        return this.$store.state.Videos.videoQualityLabelHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoQualityLabelHidden', value)
      },
    },
    isDurationHidden: {
      get() {
        return this.$store.state.Videos.videoDurationHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoDurationHidden', value)
      },
    },
    isPerformersHidden: {
      get() {
        return this.$store.state.Videos.videoPerformersHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoPerformersHidden', value)
      },
    },
    isTagsHidden: {
      get() {
        return this.$store.state.Videos.videoTagsHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoTagsHidden', value)
      },
    },
    isWebsiteHidden: {
      get() {
        return this.$store.state.Videos.videoWebsiteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoWebsiteHidden', value)
      },
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    filterItemsPerformers(item, queryText, itemText) {
      const searchText = queryText.toLowerCase()
      const aliases = item.aliases
      let found = false
      for (let i=0;i<aliases.length;i++) {
        if (aliases[i].toLowerCase().indexOf(searchText) > -1) found = true
      }
      if (item.name.toLowerCase().indexOf(searchText) > -1) found = true
      return found
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
    changeFilterPerformersLogic() {
      let logic = this.$store.state.Videos.filters.performersLogic
      this.filterPerformersLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.$store.state.Videos.filters.performersLogic = !logic
      this.updateTabFilters()
    },
    changeFilterTagsLogic() {
      let logic = this.$store.state.Videos.filters.tagsLogic
      this.filterTagsLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.$store.state.Videos.filters.tagsLogic = !logic
      this.updateTabFilters()
    },
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.videosFilters, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Videos.filters),
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    removePerformer(item) { 
      const index = this.$store.state.Videos.filters.performers.indexOf(item.name)
      if (index >= 0) this.$store.state.Videos.filters.performers.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeTag(item) { 
      const index = this.$store.state.Videos.filters.tags.indexOf(item.name)
      if (index >= 0) this.$store.state.Videos.filters.tags.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    resetAllFilters(event) {
      this.$store.commit('resetFilteredVideos')
      this.updateFiltersOfVideos('websites', [this.website.name])
      this.$store.dispatch('filterVideos')
    },
    updateTabFilters() {
      if (this.tabId !== 'default') {
        let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
        this.$store.getters.tabsDb.find({id:this.tabId}).assign({filters:newFilters}).write()
      }
    },
    updateFiltersOfVideos(key, value){
      this.$store.commit('updateFiltersOfVideos', {key, value})
      this.updateTabFilters()
    },
    toggleFavorites() {
      this.updateFiltersOfVideos('favorite', !this.$store.state.Videos.filters.favorite)
      this.$store.dispatch('filterVideos')
    },
    toggleBookmarks() {
      this.updateFiltersOfVideos('bookmark', !this.$store.state.Videos.filters.bookmark)
      this.$store.dispatch('filterVideos')
    },
    toggleSortDirection() {
      let dir = this.sortDirection === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfVideos('sortDirection', dir)
      setTimeout(()=>{
        this.$store.dispatch('filterVideos')
      },200)
    },
    selectAllVideos() {
      this.$store.state.Videos.selection.clearSelection()
      let selected = this.$store.state.Videos.selection.select('.video-card')
      this.$store.state.Videos.selection.keepSelection()
      this.getSelectedVideos(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedVideos(selectedVideos){
      let ids = selectedVideos.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedVideos', ids)
    },
    toggleChipsColored() {
      this.isChipsColored = !this.isChipsColored
    },
    toggleFileNameVisibilty() {
      this.isFileNameHidden = !this.isFileNameHidden
    },
    toggleQualityLabelVisibilty() {
      this.isQualityLabelHidden = !this.isQualityLabelHidden
    },
    toggleDurationVisibilty() {
      this.isDurationHidden = !this.isDurationHidden
    },
    toggleRatingVisibilty() {
      this.isRatingHidden = !this.isRatingHidden
    },
    toggleFavoriteVisibilty() {
      this.isFavoriteHidden = !this.isFavoriteHidden
    },
    toggleFileInfoVisibilty() {
      this.isFileInfoHidden = !this.isFileInfoHidden
    },
    togglePerformerVisibilty() {
      this.isPerformersHidden = !this.isPerformersHidden
    },
    toggleTagsVisibilty() {
      this.isTagsHidden = !this.isTagsHidden
    },
    toggleWebsiteVisibilty() {
      this.isWebsiteHidden = !this.isWebsiteHidden
    },
    changeCardSize(event) {
      this.getCardSizeIcon()
      this.$store.getters.settings.set('videoCardSize', event).write()
    },
    getCardSizeIcon() {
      let size = ''
      switch(this.$store.state.Settings.videoCardSize) {
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