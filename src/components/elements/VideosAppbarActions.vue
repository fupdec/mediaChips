<template>
	<div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Videos.dialogFilterVideos=true" v-on="on" icon tile>
          <v-badge :value="filterBadge" :content="filteredVideosTotal" overlap bottom style="z-index: 5;"> 
          <v-icon>mdi-filter</v-icon> </v-badge>
        </v-btn>
      </template>
      <span>Filter videos</span>
    </v-tooltip>
    
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-badge :value="searchStringComputed" icon="mdi-format-letter-case" overlap offset-x="23" offset-y="44">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </v-badge>
          </template>
          <span>Search</span>
        </v-tooltip>
      </template>
      <v-card width="350">
        <div class="pa-2 d-flex">
          <v-text-field :value="searchStringComputed" @input="changeSearchString($event)" 
            @click:clear="clearSearch" outlined dense hide-details clearable class="pt-0"/>
          <v-btn @click="search" class="ml-2" color="primary" depressed height="40">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </div>
      </v-card>
    </v-menu>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleFavorites" v-on="on" icon tile>
          <v-icon v-if="favoritesFilterExist">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span>Toggle Favorites</span>
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
    
    <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
      <template #activator="{ on: onMenu }">
        <v-tooltip bottom>
          <template #activator="{ on: onTooltip }">
            <v-badge :icon="sortIcon" overlap offset-x="23" offset-y="44" class="badge-sort">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-sort-variant</v-icon>
                <v-icon v-if="sortDirection=='desc'" size="16" class="badge-sort-icon">mdi-arrow-up-thick</v-icon>
                <v-icon v-else size="16" class="badge-sort-icon">mdi-arrow-down-thick</v-icon>
              </v-btn>
            </v-badge>
          </template>
          <span>Sort Videos</span>
        </v-tooltip>
      </template>
      <v-card>
        <v-btn-toggle v-model="sortButtons" mandatory class="group-buttons-sort" color="primary">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="name" v-on="on">
                <v-icon>mdi-alphabetical-variant</v-icon>
                <v-icon right size="14" v-if="sortButtons=='name' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='name' && sortDirection=='asc'">
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
                <v-icon right size="14" v-if="sortButtons=='duration' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='duration' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Duration</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
            <v-btn outlined @click="toggleSortDirection" value="size" v-on="on">
              <v-icon>mdi-harddisk</v-icon>
              <v-icon right size="14" v-if="sortButtons=='size' && sortDirection=='desc'">
                mdi-arrow-up-thick
              </v-icon>
              <v-icon right size="14" v-if="sortButtons=='size' && sortDirection=='asc'">
                mdi-arrow-down-thick
              </v-icon>
            </v-btn>
            </template>
            <span>Sort by Size</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="rating" v-on="on">
                <v-icon>mdi-star-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons=='rating' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='rating' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                <v-icon>mdi-calendar-plus</v-icon>
                <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Date Added</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="edit" v-on="on">
                <v-icon>mdi-calendar-edit</v-icon>
                <v-icon right size="14" v-if="sortButtons=='edit' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='edit' && sortDirection=='asc'">
                  mdi-arrow-down-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Date of Editing</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="path" v-on="on">
                <v-icon>mdi-folder-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons=='path' && sortDirection=='desc'">
                  mdi-arrow-up-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons=='path' && sortDirection=='asc'">
                  mdi-arrow-down-thick
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
			<span>Select All Videos</span>
		</v-tooltip>

		<v-tooltip bottom>
			<template v-slot:activator="{ on }">
				<v-btn @click="addNewTab" icon tile v-on="on">
					<v-icon>mdi-tab-plus</v-icon>
				</v-btn>
			</template>
			<span>Add New Tab</span>
		</v-tooltip>

    <DialogFolderTree v-if="$store.state.Videos.dialogFolderTree"/>
    <DialogFilterVideos v-if="$store.state.Videos.dialogFilterVideos"/>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'VideosAppbarActions',
  components: {
    DialogFolderTree: () => import('@/components/pages/videos/DialogFolderTree.vue'),
    DialogFilterVideos: () => import('@/components/pages/videos/DialogFilterVideos.vue'),
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    searchString: '',
  }),
  computed: {
    filterBadge() {
      let filters = _.cloneDeep(this.$store.state.Settings.videoFilters)
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type=='number'||f.type=='string'||f.type=='date'||f.type=='select'||f.type=='array') {
            if (f.val.length) return true 
            else return false
          } 
          if (f.type == 'boolean') return true
        })
        return filters.length > 0
      } else return false
    },
    filteredVideosTotal() {
      let filters = _.cloneDeep(this.$store.state.Settings.videoFilters)
      if (filters.length) {
        filters = _.filter(filters, f => {
          if (f.type == null) return false 
          if (f.type=='number'||f.type=='string'||f.type=='date'||f.type=='select'||f.type=='array') {
            if (f.val.length) return true 
            else return false
          } 
          if (f.type == 'boolean') return true
        })
        return filters.length
      } else return 0
    },
    sortIcon() {
      if (this.sortButtons=='name') return 'mdi-alphabetical-variant'
      if (this.sortButtons=='duration') return 'mdi-timer-outline'
      if (this.sortButtons=='size') return 'mdi-harddisk'
      if (this.sortButtons=='rating') return 'mdi-star-outline'
      if (this.sortButtons=='date') return 'mdi-calendar-plus'
      if (this.sortButtons=='edit') return 'mdi-calendar-edit'
      if (this.sortButtons=='path') return 'mdi-folder-outline'
      return 'mdi-help'
    },
    sortButtons: {
      get() {
        return this.$store.state.Settings.videoSortBy
      },
      set(value) {
        this.$store.state.Settings.videoSortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Settings.videoSortDirection
    },
    isTreeEmpty() {
      if (this.$store.state.Videos.tree.length) {
        return false
      } else return true
    },
    treeBadgeContent() {
      return this.$store.state.Videos.tree.length  
    },
    tabId() {
      return this.$route.query.tabId
    },
    searchStringComputed() {
      let filters = this.$store.state.Settings.videoFilters
      let search = _.find(filters, {param: 'path', flag: 'search'})
      if (search) return search.val
      else return ''
    },
    favoritesFilterExist() {
      let favorite = {param:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, favorite)
      return index > -1
    },
  },
  methods: {
    search() {
      if (this.searchString == null || this.searchString.length == 0) return
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, {param: 'path', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      this.$store.state.Settings.videoFilters.push({
        param: 'path',
        cond: 'includes',
        val: this.searchString,
        type: 'string',
        flag: 'search',
        lock: true
      })
      this.$store.dispatch('filterVideos')
    },
    clearSearch() {
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, {param: 'path', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      else return
      this.$store.dispatch('filterVideos')
    },
    toggleFavorites() {
      let filters = this.$store.state.Settings.videoFilters
      let favorite = {param:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let index = _.findIndex(filters, favorite)
      if (index > -1) filters.splice(index, 1)
      else this.$store.state.Settings.videoFilters.push(favorite)
      this.$store.dispatch('filterVideos')
    },
    changeSearchString(e) {
      this.searchString = e
    },
    toggleSortDirection() {
      this.$store.state.Settings.videoSortDirection = this.sortDirection=='asc' ? 'desc':'asc'
      setTimeout(()=>{
        this.$store.dispatch('filterVideos')
        // this.$store.dispatch('saveFiltersOfVideos', this.$route)
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
    addNewTab() {
      let tabId = Date.now()
      let tab = { 
        name: this.$store.getters.videoFiltersForTabName, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.videoFilters),
        sortBy: this.$store.state.Settings.videoSortBy,
        sortDirection: this.$store.state.Settings.videoSortDirection,
        page: 1,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
  },
}
</script>