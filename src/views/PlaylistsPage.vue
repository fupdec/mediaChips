<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="headline text-h3 text-center my-6"> Playlists
      <span class="text-h5">({{$store.getters.filteredPlaylistsTotal}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start py-0">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn @click="removeAllFilters" v-on="on" fab x-small dark color="red" class="mr-4">
            <v-icon>mdi-filter-off</v-icon>
          </v-btn>
        </template>
        <span>Remove All Filters</span>
      </v-tooltip>
      <v-chip v-for="(filter, i) in filters" :key="i" class="ma-1" color="primary"
        small close :disabled="filter.lock" @click:close="removeFilter(i)">
        {{filter.param}} {{filter.cond}} 
        <span v-if="filter.type=='array'" class="ml-1">{{filter.val.join(', ')}}</span>
        <span v-else class="ml-1">{{filter.val}}</span>
      </v-chip>
    </v-container>
      
    <v-container fluid v-if="!$store.state.Playlists.filteredEmpty" class="pagination-container my-6">
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

    <div v-if="$store.state.Playlists.filteredEmpty" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching playlists for the selected filters.
    </div>
    
    <Loading />

    <v-container fluid class="playlists-grid" :class="gapSize">
      <PlaylistCard v-for="(playlist) in playlistsOnPage" :key="playlist.id" :playlist="playlist"/>
    </v-container>

    <v-pagination v-if="!$store.state.Playlists.filteredEmpty"
      v-model="playlistsCurrentPage" :length="playlistsPagesSum"
      :total-visible="getNumberOfPagesLimit" class="mt-6 mb-10"
    ></v-pagination>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    <v-dialog v-model="$store.state.Playlists.dialogDeletePlaylist" scrollable persistent max-width="600">
      <v-card>
        <v-card-title class="headline red--text">Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>You want to delete playlist<span v-if="selectedPlaylistsLength>1">s</span></div>
            {{selectedPlaylists(true)}}
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn class="ma-4" 
            @click="$store.state.Playlists.dialogDeletePlaylist = false">No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" class="ma-4" dark @click="deletePlaylists">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <DialogEditPlaylist v-if="$store.state.Playlists.dialogEditPlaylist"/>

    <v-menu v-model="$store.state.Playlists.menuCard" :position-x="$store.state.x" 
      :position-y="$store.state.y" absolute offset-y z-index="1000" min-width="150">
      <v-list dense class="context-menu">
        <v-list-item link @mouseup="$store.state.Playlists.dialogEditPlaylist = true"
          :disabled="!isSelectedSinglePlaylist">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit playlist
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @mouseup="$store.state.Playlists.dialogDeletePlaylist = true"
          :disabled="isSelectedWatchLater">
          <v-list-item-title>
            <v-icon left size="18" color="red">mdi-delete</v-icon> Delete playlist
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </vuescroll>
</template>


<script>
import PlaylistCard from "@/components/pages/playlists/PlaylistCard.vue"
import Selection from "@simonwep/selection-js";
import vuescroll from 'vuescroll'

export default {
  name: "PlaylistsPage",
  components: {
    PlaylistCard, 
    DialogEditPlaylist: () => import("@/components/pages/playlists/DialogEditPlaylist.vue"),
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
      this.$store.state.Playlists.selection = new Selection({
        boundaries: ['.playlists-grid'],
        selectables: ['.playlist-card'],
      }).on('beforestart', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        return (event.button !== 1)
      }).on('start', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button == 2 && store.selected.includes(targetEl)) {
          return false
        }
        if (!event.ctrlKey && !event.metaKey) {
          for (const el of store.stored) {
            el.classList.remove('selected')
          }
          this.$store.state.Playlists.selection.clearSelection()
        }
      }).on('move', ({store: {changed: {added, removed}}}) => {
        for (const el of added) {
          el.classList.add('selected')
        }
        for (const el of removed) {
          el.classList.remove('selected')
        }
      }).on('stop', ({store, event}) => {
        const targetEl = event.target.closest('.playlist-card')
        if (event.button==0 && targetEl) {
          this.$store.state.Playlists.selection.select(targetEl)
        }
        this.$store.state.Playlists.selection.keepSelection()
        this.getSelectedPlaylists(store.stored)
      })
    })
  },
  destroyed() {
    this.$store.state.Playlists.selection.destroy()
  },
  data: () => ({
    playlistsPerPagePreset: [20,40,60,80,100,150,200],
    selection: null,
    isScrollToTopVisible: false,
  }),
  computed: {
    getNumberOfPagesLimit() {
      return this.$store.state.Settings.numberOfPagesLimit
    },
    pages() {
      return this.$store.getters.playlistsPagesSum
    },
    playlistsOnPage() {
      return this.$store.getters.playlistsOnPage
    },
    playlistsPerPage: {
      get() {
        return this.$store.state.Settings.playlistsPerPage
      },
      set(number) {
        this.$store.dispatch('changePlaylistsPerPage', number)
      },
    },
    playlistsPagesSum: {
      get() {
        return this.$store.state.Playlists.pageTotal
      },
      set(number) {
        this.$store.state.Playlists.pageTotal = number
      },
    },
    playlistsCurrentPage: {
      get() {
        return this.$store.state.Settings.playlistPage
      },
      set(number) {
        this.$store.state.Settings.playlistPage = number
        this.$store.dispatch('saveFiltersOfPlaylists')
      },
    },
    selectedPlaylistsLength() {
      return this.$store.getters.getSelectedPlaylists.length
    },
    isSelectedSinglePlaylist() {
      return this.$store.getters.getSelectedPlaylists.length == 1
    },
    isSelectedWatchLater() {
      return this.$store.getters.getSelectedPlaylists.includes('123123123')
    },
    tabId() {
      return this.$route.query.tabId
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    tab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id: +this.tabId}).value()    
      }
    },
    filters() {
      return this.$store.state.Settings.playlistFilters
    },
  },
  methods: {
    removeAllFilters() {
      this.$store.state.Settings.playlistFilters = []
      this.$store.dispatch('filterPlaylists')
    },
    removeFilter(i) {
      this.filters.splice(i, 1)
      this.$store.dispatch('filterPlaylists')
    },
    selectedPlaylists(list) {
      let ids = this.$store.getters.getSelectedPlaylists
      let playlists = this.$store.getters.playlists
      if (ids.length!==0) {
        let names = ids.map(i=>(playlists.find({id:i}).value().name))
        if (list) {
          return names.map((n,i) => (`${i+1}) ${n}`)).join('\r\n')
        } else {
          return names.join(', ')
        }
      }
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    getSelectedPlaylists(selectedPlaylists){
      let ids = selectedPlaylists.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPlaylists', ids)
    },
    copyPlaylistNameToClipboard(){
      navigator.clipboard.writeText(this.selectedPlaylists())
    },
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