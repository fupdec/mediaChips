<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-container fluid class="pb-0">
      <v-btn @click="showDynamicPlaylists=!showDynamicPlaylists" outlined small block class="mb-2"> Dynamic playlists </v-btn>
      <div v-show="showDynamicPlaylists" v-if="dynamicPlaylists.length" class="dynamic-playlists-wrapper" :class="[{'bottombar':$store.state.Settings.navigationSide=='2'}]">
        <vuescroll>
          <div class="dynamic-playlists">
            <DynamicPlaylistCard v-for="dp in dynamicPlaylists" :key="dp.id" :playlist="dp"/>
          </div>
        </vuescroll>
      </div>
      <v-alert v-else type="info" text outlined dense class="text-center">
        Please go to the video page, select filters and save them so that dynamic playlists appear
      </v-alert>
    </v-container>

    <div class="headline text-h4 d-flex align-center justify-center">
      <v-icon left>mdi-format-list-bulleted</v-icon> Playlists
      <span v-if="totalPlaylists!=numberFilteredPlaylists" class="text-h6 ml-2">({{numberFilteredPlaylists}} of {{totalPlaylists}})</span>
      <span v-else class="text-h6 ml-2">({{numberFilteredPlaylists}})</span>
    </div>
    
    <v-container v-if="filters.length==0&&showSavedFilters&&savedFilters.length" fluid class="d-flex justify-center align-start pb-0">
      <v-chip-group show-arrows>
        <v-chip v-for="(sf,i) in savedFilters" :key="sf.id" 
          @click="applyFilter(i)" title="Apply saved filter">{{sf.name}}</v-chip>
      </v-chip-group>
    </v-container>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start pb-0">
      <FiltersChips :filters="filters" type="Playlist" />
    </v-container>

    <v-container v-if="numberFilteredPlaylists" fluid class="pagination-container">
      <v-overflow-btn v-model="playlistsPerPage" hint="items per page" persistent-hint
        :items="playlistsPerPagePreset" dense height="36" solo disable-lookup hide-no-data
        class="items-per-page-dropdown" />
      <v-spacer></v-spacer>
      <v-pagination v-model="playlistsCurrentPage" :length="playlistsPagesSum" :total-visible="getNumberOfPagesLimit"/>
      <v-spacer></v-spacer>
      <v-overflow-btn v-if="playlistsPagesSum > 5"
        v-model="playlistsCurrentPage" :items="pages" dense height="36" solo
        class="items-per-page-dropdown width-70 jump-to-page-menu" 
        disable-lookup hint="jump to page" persistent-hint hide-no-data
        :menu-props="{ 
          auto:true, 
          contentClass:'jump-to-page-menu',
          nudgeBottom: -110,
          origin:'center center', 
          transition:'scale-transition'
        }"
      ></v-overflow-btn>
      <div v-else style="min-width:80px;"></div>
    </v-container>

    <div v-if="numberFilteredPlaylists==0" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching playlists for the selected filters.
    </div>
    
    <Loading />

    <v-container fluid class="playlists-grid" :class="gapSize">
      <PlaylistCard v-for="(playlist) in playlistsOnPage" :key="playlist.id" :playlist="playlist"/>
    </v-container>

    <v-pagination v-if="numberFilteredPlaylists" class="mt-4 mb-8"
      v-model="playlistsCurrentPage" :length="playlistsPagesSum" :total-visible="getNumberOfPagesLimit" />
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    <v-dialog v-model="$store.state.Playlists.dialogDeletePlaylist" scrollable persistent max-width="500">
      <v-card>
        <v-toolbar color="error">
          <div class="headline"> Are you sure? </div>
          <v-spacer></v-spacer>
          <v-btn @click="$store.state.Playlists.dialogDeletePlaylist=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deletePlaylists" outlined> <v-icon left>mdi-check</v-icon>Yes</v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>You want to delete playlist<span v-if="selectedPlaylistsLength>1">s</span></div>
            {{selectedPlaylists(true)}}
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
    <DialogEditPlaylist v-if="$store.state.Playlists.dialogEditPlaylist"/>
  </vuescroll>
</template>


<script>
const { clipboard } = require('electron')

import PlaylistCard from "@/components/pages/playlists/PlaylistCard.vue"
import Selection from "@simonwep/selection-js";
import vuescroll from 'vuescroll'

export default {
  name: "PlaylistsPage",
  components: {
    PlaylistCard, 
    DynamicPlaylistCard: () => import("@/components/pages/playlists/DynamicPlaylistCard.vue"),
    DialogEditPlaylist: () => import("@/components/pages/playlists/DialogEditPlaylist.vue"),
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  beforeMount() { this.initDynamicPlaylists() },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
      this.$store.state.Playlists.selection = new Selection({
        boundaries: ['.playlists-grid'],
        selectables: ['.playlist-card'],
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button == 2 && store.stored.includes(targetEl)) return false
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) el.classList.remove('selected')
          this.$store.state.Playlists.selection.clearSelection()
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        for (const el of added) el.classList.add('selected')
        for (const el of removed) el.classList.remove('selected')
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button==0 && targetEl) this.$store.state.Playlists.selection.select(targetEl)
        this.$store.state.Playlists.selection.keepSelection()
        this.getSelectedPlaylists(store.stored)
      })
    })
  },
  destroyed() {
    this.$store.state.Playlists.selection.destroy()
  },
  data: () => ({
    showDynamicPlaylists: true,
    dynamicPlaylists: [],
    playlistsPerPagePreset: [20,40,60,80,100,150,200],
    selection: null,
    isScrollToTopVisible: false,
  }),
  computed: {
    savedFilters() { return this.$store.state.SavedFilters.savedFilters.playlists || [] },
    showSavedFilters() {return this.$store.state.Settings.showSavedFilters},
    getNumberOfPagesLimit() { return this.$store.state.Settings.numberOfPagesLimit },
    pages() { return this.$store.getters.playlistsPagesSum },
    playlistsOnPage() { return this.$store.getters.playlistsOnPage },
    playlistsPerPage: {
      get() { return this.$store.state.Settings.playlistsPerPage },
      set(number) { this.$store.dispatch('changePlaylistsPerPage', number) },
    },
    playlistsPagesSum: {
      get() { return this.$store.state.Playlists.pageTotal },
      set(number) { this.$store.state.Playlists.pageTotal = number },
    },
    playlistsCurrentPage: {
      get() { return this.$store.state.Settings.playlistPage },
      set(number) {
        this.$store.state.Settings.playlistPage = number
        this.$store.dispatch('saveFiltersOfPlaylists')
      },
    },
    selectedPlaylistsLength() { return this.$store.getters.getSelectedPlaylists.length },
    tabId() { return this.$route.query.tabId },
    gapSize() { return `gap-size-${this.$store.state.Settings.gapSize}` },
    tab() {
      if (this.tabId === 'default') return undefined
      else return this.$store.getters.tabsDb.find({id: +this.tabId}).value()    
    },
    filters() { return this.$store.state.Settings.playlistFilters },
    numberFilteredPlaylists() { return this.$store.state.Playlists.filteredPlaylists.length },
    totalPlaylists() { return this.$store.getters.playlists.value().length },
  },
  methods: {
    selectedPlaylists(list) {
      let ids = this.$store.getters.getSelectedPlaylists
      let playlists = this.$store.getters.playlists
      if (ids.length===0) return ''
      let names = ids.map(i=>(playlists.find({id:i}).value().name))
      if (list) return names.map((n,i) => (`${i+1}) ${n}`)).join('\r\n')
      else return names.join(', ')
    },
    scrollToTop() { this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad") },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) this.isScrollToTopVisible = true
      else this.isScrollToTopVisible = false
    },
    getSelectedPlaylists(selectedPlaylists) {
      let ids = selectedPlaylists.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPlaylists', ids)
    },
    copyPlaylistNameToClipboard() { clipboard.writeText(this.selectedPlaylists()) },
    deletePlaylists(){
      this.$store.dispatch('deletePlaylists'), 
      this.$store.state.Playlists.dialogDeletePlaylist = false
    },
    initFilters() {
      let newFilters
      if (this.tabId === 'default' || typeof this.tab.filters === 'undefined') {
        newFilters = _.cloneDeep(this.$store.getters.settings.get('playlistFilters').value())
        this.$store.state.Settings.playlistSortBy = this.$store.getters.settings.get('playlistSortBy').value()
        this.$store.state.Settings.playlistSortDirection = this.$store.getters.settings.get('playlistSortDirection').value()
        this.$store.state.Settings.playlistPage = this.$store.getters.settings.get('playlistPage').value()
        this.$store.state.Settings.playlistFirstChar = this.$store.getters.settings.get('playlistFirstChar').value()
        this.$store.state.Settings.playlistColor = this.$store.getters.settings.get('playlistColor').value()
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Settings.playlistSortBy = this.tab.sortBy || 'name'
        this.$store.state.Settings.playlistSortDirection = this.tab.sortDirection || 'asc'
        this.$store.state.Settings.playlistPage = this.tab.page || 1
        this.$store.state.Settings.playlistFirstChar = this.tab.firstChar || []
        this.$store.state.Settings.playlistColor = this.tab.color || []
      }
      this.$store.state.Settings.playlistFilters = newFilters
      this.$store.dispatch('filterPlaylists', true)
    },
    async initDynamicPlaylists() {
      let savedFilters = this.$store.state.SavedFilters.savedFilters.videos
      for (let f of savedFilters) {
        let videos = await this.$store.dispatch('getFilteredVideos', f.filters)
        let playlist = {
          id: f.id,
          name: f.name,
          filters: f.filters,
          videos: videos.value(),
        }
        this.dynamicPlaylists.push(playlist)
      }
    },
    applyFilter(i) { 
      this.$store.state.Settings.playlistFilters = _.cloneDeep(this.savedFilters[i].filters)
      this.$store.dispatch('filterPlaylists') 
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/playlists/:')) return
      this.initFilters()
    },
  }
}
</script>


<style lang="less">
.dynamic-playlists-wrapper {
  max-width: calc(100vw - 80px);
  overflow: hidden;
  padding-bottom: 10px;
  &.bottombar {
    max-width: calc(100vw - 25px);
  }
}
.dynamic-playlists {
  display: flex;
  padding-bottom: 10px;
}
.playlists-grid {
  padding: 10px;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-rows: minmax(260px, auto);
  &.gap-size {
    &-xs {
      grid-gap: 10px;
    }
    &-s {
      grid-gap: 15px;
    }
    &-m {
      grid-gap: 20px;
    }
    &-l {
      grid-gap: 25px;
    }
    &-xl {
      grid-gap: 30px;
    }
  }
}
.playlist-card.selected {
  position: relative;
  overflow: visible;
  &:after {
    content: '';
    position: absolute;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    left: -4px;
    top: -4px;
    border-radius: 7px;
    pointer-events: none;
    border: 2px solid var(--v-secondary-base);
  }
}
</style>