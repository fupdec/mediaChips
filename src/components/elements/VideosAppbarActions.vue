<template>
	<div>
    <!-- <v-menu v-model="filtersMenu" offset-y nudge-bottom="10" :close-on-content-click="false">
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
                @click:append-outer="pastePath" append-outer-icon="mdi-clipboard-text-outline"
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
                @click:append-outer="pastePerformers" 
                append-outer-icon="mdi-clipboard-text-outline"
                :filter="filterItemsPerformers" :disabled="isPerformerPage"
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
                :menu-props="{contentClass:'list-with-preview'}" :disabled="isWebsitePage"
                @click:append-outer="pasteWebsites" 
                append-outer-icon="mdi-clipboard-text-outline"
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
                  hide-details :min="0" 
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
                <div><v-icon left>mdi-monitor-screenshot</v-icon>Resol.</div>
                <v-btn-toggle
                  v-model="$store.state.Videos.filters.quality"
                  class="grouped-buttons" dense multiple color="primary"
                >
                  <v-btn outlined value="4K">4K</v-btn>
                  <v-btn outlined value="1080">1080p</v-btn>
                  <v-btn outlined value="720">720p</v-btn>
                  <v-btn outlined value="480">480p</v-btn>
                  <v-btn outlined value="vert"><v-icon size="18">mdi-cellphone</v-icon></v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions class="pt-0">
          <v-btn @click="resetAllFilters(), filtersMenu=false" small class="ml-2 mb-2 mt-0" color="secondary">
            <v-icon left>mdi-filter-off</v-icon> Reset all filters
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn @click="$store.state.Bookmarks.dialogFiltersPresets=true" small class="mx-2 mb-2 mt-0" color="secondary"> 
            <v-icon left>mdi-content-save</v-icon> Presets
          </v-btn>

          <v-btn @click="addNewTab(), filtersMenu=false" small class="mx-2 mb-2 mt-0" color="secondary"> 
            <v-icon left>mdi-tab-plus</v-icon> New tab
          </v-btn>
          
          <v-btn @click="applyAllFilters(), filtersMenu=false" small class="mr-2 mb-2 mt-0" color="primary">
            <v-icon left>mdi-filter</v-icon> Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu> -->
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Videos.dialogFilterVideos=true" v-on="on" icon tile>
          <v-badge :value="filterBadge" :content="filteredVideosTotal" 
            overlap bottom :dot="filteredVideosTotal==0" style="z-index: 5;"> 
          <v-icon>mdi-filter</v-icon> </v-badge>
        </v-btn>
      </template>
      <span>Filter videos</span>
    </v-tooltip>

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
          <v-icon v-if="$store.state.Videos.showFavorites">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.showFavorites">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Videos.showBookmarks">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Videos.showBookmarks">Show all</span>
      <span v-else>Show bookmarks</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Videos.dialogFolderTree = true" icon tile v-on="on"> 
          <v-badge :value="!isTreeEmpty" :content="treeBadgeContent" overlap bottom style="z-index: 5;">
            <v-icon>mdi-file-tree</v-icon>
          </v-badge>
        </v-btn>
      </template>
      <span>Open folder tree</span>
    </v-tooltip>
    
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-badge :content="videosSort" overlap bottom class="badge-sort">
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
            <span>Sort by Name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="duration" v-on="on">
                <v-icon>mdi-timer-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons==='duration' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='duration' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Duration</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
            <v-btn outlined @click="toggleSortDirection" value="size" v-on="on">
              <v-icon>mdi-harddisk</v-icon>
              <v-icon right size="14" v-if="sortButtons==='size' && sortDirection==='desc'">
                mdi-arrow-down-thick
              </v-icon>
              <v-icon right size="14" v-if="sortButtons==='size' && sortDirection==='asc'">
                mdi-arrow-up-thick
              </v-icon>
            </v-btn>
            </template>
            <span>Sort by Size</span>
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
            <span>Sort by Rating</span>
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
            <span>Sort by Date Added</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="path" v-on="on">
                <v-icon>mdi-folder-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons==='path' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='path' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Path</span>
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

    <FiltersPresets v-if="$store.state.Bookmarks.dialogFiltersPresets" typeOfPresets="videos"/>
    <DialogFolderTree v-if="$store.state.Videos.dialogFolderTree"/>
    <DialogFilterVideos v-if="$store.state.Videos.dialogFilterVideos"/>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'VideosAppbarActions',
  components: {
    FiltersPresets: () => import('@/components/elements/FiltersPresets.vue'),
    DialogFolderTree: () => import('@/components/pages/videos/DialogFolderTree.vue'),
    DialogFilterVideos: () => import('@/components/pages/videos/DialogFilterVideos.vue'),
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    filtersMenu: false,
    filterPerformersLogicIcon: 'mdi-math-norm',
    filterTagsLogicIcon: 'mdi-math-norm',
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredVideosTotal
      return total !== this.$store.getters.videosTotal
    },
    filteredVideosTotal() {
      return this.$store.getters.filteredVideosTotal
    },
    videosSort() {
      let sort = this.$store.state.Videos.sortBy
      return sort.charAt(0) + sort.charAt(1) + sort.charAt(2) + '.'
    },
    sortButtons: {
      get() {
        return this.$store.state.Videos.sortBy
      },
      set(value) {
        this.$store.state.Videos.sortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Videos.sortDirection
    },
    isTreeEmpty() {
      if (this.$store.state.Videos.tree.length) {
        return false
      } else return true
    },
    treeBadgeContent() {
      return this.$store.state.Videos.tree.length  
    },
    itemId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    tabId() {
      return this.$route.query.tabId
    },
    isPerformerPage() {
      return this.$route.path.includes('/performer/:')  
    },
    isTagPage() {
      return this.$route.path.includes('/tag/:')  
    },
    isWebsitePage() {
      return this.$route.path.includes('/website/:')  
    },
  },
  methods: {
    // async pastePath() {
    //   let text = await navigator.clipboard.readText()
    //   let path = this.$store.state.Videos.filters.path
    //   if (path) {
    //     text = path + text
    //   }
    //   this.updateFiltersOfVideos('path', text)
    // },
    // async pastePerformers() {
    //   let text = await navigator.clipboard.readText()
    //   let perfs = text.split(', ')
    //   perfs = this.$store.getters.performers.filter(p=>(perfs.includes(p.name))).value()
    //   perfs = perfs.map(p=>{return p.name})
    //   if (perfs.length) {
    //     this.updateFiltersOfVideos('performers', perfs)
    //   }
    // },
    getItem(itemType) {
      return this.$store.getters[itemType].find({ id: this.itemId }).value()    
    },
    resetAllFilters() {
      if (this.isPerformerPage) {
        let item = this.getItem('performers')
        this.$store.state.Settings.videoFilters = [{
          param: 'performers',
          cond: 'all',
          val: [item.name],
          type: 'array',
          lock: true,
        },{
          param: 'tags',
          cond: 'one of',
          val: [],
          type: 'array',
          lock: true,
        },{
          param: 'websites',
          cond: 'one of',
          val: [],
          type: 'array',
          lock: true,
        }]
      } else if (this.isTagPage) {
        let item = this.getItem('tags')
        this.$store.state.Settings.videoFilters = [{
          param: 'tags',
          cond: 'all',
          val: [item.name],
          type: 'array',
          lock: true,
        },{
          param: 'performers',
          cond: 'one of',
          val: [],
          type: 'array',
          lock: true,
        }]
      } else if (this.isWebsitePage) {
        let item = this.getItem('websites')
        this.$store.state.Settings.videoFilters = [{
          param: 'websites',
          cond: 'all',
          val: [item.name],
          type: 'array',
          lock: true,
        },{
          param: 'performers',
          cond: 'one of',
          val: [],
          type: 'array',
          lock: true,
        }]
      } else {
        this.$store.state.Settings.videoFilters = [{
          param: null,
          cond: null,
          val: null,
          type: null,
          lock: false,
        }]
      }

      this.$store.dispatch('filterVideos')

      const pages = ['/performer/:','/website/:']
      let newFilters = _.cloneDeep(this.$store.state.Settings.videoFilters)

      if (this.tabId === 'default') { // for videos page (not for tab)
        this.$store.getters.settings.set('videoFilters', newFilters).write()
      } 
      // for tab of tag page
      else if (this.$route.path.includes('/tag/:')) { 
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters')
          .assign({videos: newFilters}).write()
      } 
      // for tab of performer or website page
      else if (pages.some(p => this.$route.path.includes(p))) { 
        this.$store.getters.tabsDb.find({id:this.tabId})
          .assign({filters:newFilters}).write()
      } 
      // for tab of videos page
      else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
            filters: newFilters,
            name: this.$store.getters.videoFiltersForTabName,
          }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    toggleFavorites() {
      // this.updateFiltersOfVideos('favorite', !this.$store.state.Videos.filters.favorite)
      this.$store.state.Videos.showFavorites = !this.$store.state.Videos.showFavorites
      this.$store.dispatch('filterVideos')
    },
    toggleBookmarks() {
      // this.updateFiltersOfVideos('bookmark', !this.$store.state.Videos.filters.bookmark)
      this.$store.state.Videos.showBookmarks = !this.$store.state.Videos.showBookmarks
      this.$store.dispatch('filterVideos')
    },
    toggleSortDirection() {
      this.$store.state.Videos.sortDirection = this.sortDirection==='asc' ? 'desc':'asc'
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
  },
}
</script>