<template>
	<div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Videos.dialogFilterVideos=true" v-on="on" icon tile>
          <v-badge :value="filtersNumber!=0" :content="filtersNumber" overlap bottom style="z-index: 5;"> 
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
          <span>Search by File Path</span>
        </v-tooltip>
      </template>
      <v-card width="350">
        <div class="pa-2 d-flex">
          <v-text-field :value="searchStringComputed" @input="changeSearchString($event)" autofocus
            @click:clear="clearSearch" @keypress.enter="search" outlined dense hide-details clearable class="pt-0"/>
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

    <v-tooltip v-if="$store.state.Settings.showExperimentalFeatures" bottom>
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
        <v-card class="d-flex">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" @click="toggleSortDirection" outlined height="48" width="48" min-width="48" class="mr-4">
                <v-icon>mdi-arrow-{{sortDirection=='desc'?'up':'down'}}-thick</v-icon>
              </v-btn>
            </template>
            <span>Toggle Sort Direction</span>
          </v-tooltip>

          <vuescroll>
            <v-card-text class="pa-0">
              <v-btn-toggle :value="sortBy" @change="changeSortBy($event)" mandatory class="group-buttons-sort" color="primary">
                <v-tooltip v-for="(s,i) in sort" :key="i" bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="sortCards" :value="s.name" outlined>
                      <v-icon>mdi-{{s.icon}}</v-icon>
                      <v-icon right size="14" v-if="sortBy==s.name && sortDirection=='desc'">mdi-arrow-up-thick</v-icon>
                      <v-icon right size="14" v-if="sortBy==s.name && sortDirection=='asc'">mdi-arrow-down-thick</v-icon>
                    </v-btn>
                  </template>
                  <span>Sort by {{s.tip}}</span>
                </v-tooltip>
              </v-btn-toggle>
            </v-card-text>
          </vuescroll>
      </v-card>
    </v-menu>

		<!-- <v-tooltip bottom>
			<template v-slot:activator="{ on }">
				<v-btn @click="selectAllVideos" icon tile v-on="on">
					<v-icon>mdi-select-all</v-icon>
				</v-btn>
			</template>
			<span>Select All Videos</span>
		</v-tooltip> -->

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
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'VideosAppbarActions',
  components: {
    DialogFolderTree: () => import('@/components/pages/videos/DialogFolderTree.vue'),
    DialogFilterVideos: () => import('@/components/pages/videos/DialogFilterVideos.vue'),
    vuescroll,
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
      this.initSort()
    })
  },
  data: () => ({
    searchString: '',
    sort: [
      {
        name: 'name',
        icon: 'alphabetical-variant',
        tip: 'Name',
      },
      {
        name: 'duration',
        icon: 'timer-outline',
        tip: 'Duration',
      },
      {
        name: 'size',
        icon: 'harddisk',
        tip: 'Filesize',
      },
      {
        name: 'resolution',
        icon: 'monitor-screenshot',
        tip: 'Resolution',
      },
      {
        name: 'rating',
        icon: 'star-outline',
        tip: 'Rating',
      },
      {
        name: 'views',
        icon: 'eye-outline',
        tip: 'Number of Views',
      },
      {
        name: 'date',
        icon: 'calendar-plus',
        tip: 'Date Added',
      },
      {
        name: 'edit',
        icon: 'calendar-edit',
        tip: 'Date of Editing',
      },
      {
        name: 'viewed',
        icon: 'calendar-clock',
        tip: 'Viewed Date',
      },
      {
        name: 'path',
        icon: 'folder-outline',
        tip: 'Path',
      },
    ],
    sortBy: 'name',
  }),
  computed: {
    filtersNumber() {
      let filters = _.cloneDeep(this.$store.state.Settings.videoFilters)
      if (!filters.length) return 0
      filters = _.filter(filters, f => {
        if (f.type == null) return false 
        if (f.type=='number'||f.type=='string'||f.type=='date'||f.type=='select'||f.type=='array') {
          if (f.val.length) return true 
          else return false
        } 
        if (f.type == 'boolean') return true
      })
      return filters.length
    },
    sortIcon() {
      let sortObject = _.find(this.sort, {name: this.sortBy})
      if (sortObject) return `mdi-${sortObject.icon}`
      else return 'mdi-help'
    },
    sortDirection() { return this.$store.state.Settings.videoSortDirection },
    isTreeEmpty() { return !this.$store.state.Videos.tree.length },
    treeBadgeContent() { return this.$store.state.Videos.tree.length },
    tabId() { return this.$route.query.tabId },
    searchStringComputed() {
      let filters = this.$store.state.Settings.videoFilters
      let search = _.find(filters, {by: 'path', appbar: true})
      if (search) return search.val
      else return ''
    },
    favoritesFilterExist() {
      let favorite = {by:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, favorite)
      return index > -1
    },
    metaAssignedToVideos() { return this.$store.state.Settings.metaAssignedToVideos },
  },
  methods: {
    search() {
      if (this.searchString == null || this.searchString.length == 0) return
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, {by: 'path', appbar: true})
      if (index > -1) filters.splice(index, 1)
      this.$store.state.Settings.videoFilters.push({
        by: 'path', cond: 'includes', val: this.searchString,
        type: 'string', flag: null, appbar: true, lock: false
      })
      this.$store.dispatch('filterVideos')
    },
    changeSearchString(e) { this.searchString = e },
    clearSearch() {
      let filters = this.$store.state.Settings.videoFilters
      let index = _.findIndex(filters, {by: 'path', appbar: true})
      if (index > -1) filters.splice(index, 1)
      else return
      this.$store.dispatch('filterVideos')
    },
    toggleFavorites() {
      let filters = this.$store.state.Settings.videoFilters
      let favorite = {by:'favorite',cond:'yes',val:'',type:'boolean',flag:null,appbar:true,lock:false}
      let index = _.findIndex(filters, favorite)
      if (index > -1) filters.splice(index, 1)
      else this.$store.state.Settings.videoFilters.push(favorite)
      this.$store.dispatch('filterVideos')
    },
    initSort() {
      this.sortBy = this.$store.state.Settings.videoSortBy || 'name'
      for (const m of this.metaAssignedToVideos) {
        if (m.type === 'simple') {
          let sm = this.getMeta(m.id)
          if (['rating','date','number'].includes(sm.dataType)) this.sort.push({ 
            name: sm.id, 
            icon: sm.settings.icon, 
            tip: sm.settings.name 
          })
        }
      }
    },
    changeSortBy(e) { this.sortBy = e },
    sortCards() {
      setTimeout(()=>{ 
        if (this.$store.state.Settings.videoSortBy == this.sortBy) {
          this.$store.state.Settings.videoSortDirection = this.sortDirection=='asc'?'desc':'asc'
        }
        this.$store.state.Settings.videoSortBy = this.sortBy
        this.$store.dispatch('filterVideos') 
      }, 100)
    },
    toggleSortDirection() {
      setTimeout(()=>{         
        this.$store.state.Settings.videoSortDirection = this.sortDirection=='asc'?'desc':'asc'
        this.$store.dispatch('filterVideos') 
      }, 100)
    },
    // selectAllVideos() {
    //   this.$store.state.Videos.selection.clearSelection()
    //   let selected = this.$store.state.Videos.selection.select('.video-card')
    //   this.$store.state.Videos.selection.keepSelection()
    //   let ids = selected.map(item => (item.dataset.id))
    //   this.$store.commit('updateSelectedVideos', ids)
    //   for (let i=0;i<selected.length;++i) {
    //     selected[i].classList.add("selected")
    //   }
    // },
    addNewTab() {
      let tabId = Date.now()
      let filters = _.cloneDeep(this.$store.state.Settings.videoFilters)
      filters = filters.map(i=>{i.lock=false;return i})
      let tab = { 
        name: this.$store.getters.videoFiltersForTabName, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters,
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