<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="headline text-h3 text-center my-6">Playlists</div>
      
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
    
    <div v-show="$store.getters.navigationSide=='2'" class="py-6"></div>

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
        <v-list-item link @click="$store.state.Playlists.dialogEditPlaylist = true"
          :disabled="!isSelectedSinglePlaylist">
          <v-list-item-title>
            <v-icon left size="18">mdi-pencil</v-icon> Edit playlist
          </v-list-item-title>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item link @click="$store.state.Playlists.dialogDeletePlaylist = true"
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
const fs = require("fs")
const path = require("path")

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
      this.$store.dispatch('filterPlaylists')
      this.$store.state.Playlists.selection = Selection.create({
        boundaries: ['.playlists-grid'],
        selectables: ['.playlist-card'],
      }).on('beforestart', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.playlist-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        return (oe.button !== 1);
      }).on('start', ({inst, selected, oe}) => {
        const targetEl = oe.target.closest('.playlist-card')
        if (oe.button === 2 && selected.includes(targetEl)) {
          return false
        }
        // Remove class if the user isn't pressing the shift or control or ⌘ keys
        if (!oe.shiftKey && !oe.ctrlKey && !oe.metaKey) {
          // Unselect all elements
          for (const el of selected) {
              el.classList.remove('selected');
              inst.removeFromSelection(el);
          }
          // Clear previous selection
          inst.clearSelection();
        }
      }).on('move', ({changed: {removed, added}, inst, selected, oe}) => {
        // Add a custom class to the elements that where selected.
        for (const el of added) {
          el.classList.add('selected');
        }
        // Remove the class from elements that where removed
        // since the last selection
        for (const el of removed) {
          el.classList.remove('selected');
        }
      }).on('stop', ({inst, selected, oe}) => {
        if (oe.shiftKey || oe.ctrlKey || oe.metaKey) {
          let mergedCards = _.union(this.previousSelection, selected)
          let duplicates = _.filter(selected,(v,i,it)=>{return _.find(it, v, i + 1)})
          duplicates.map(duplicated=>{mergedCards = _.reject(mergedCards, duplicated)})
          selected = mergedCards
          this.previousSelection = mergedCards
          for (const el of duplicates) {
            inst.removeFromSelection(el)
          }
        } 
        inst.keepSelection()
        this.getSelectedPlaylists(selected)
        let cards = document.querySelectorAll('.playlist-card')
        for (let i=0;i<cards.length;++i) {
          cards[i].classList.remove("selected")
          void cards[i].offsetWidth
        }
        for (let i=0;i<selected.length;++i) {
          selected[i].classList.add("selected")
        }
      })
    })
  },
  destroyed() {
    this.$store.state.Playlists.selection.destroy()
  },
  data: () => ({
    playlistsPerPagePreset: [20,40,60,80,100,150,200],
    selection: null,
    previousSelection: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    chars: {
      get () {
        return this.$store.state.Playlists.filters.firstChar
      },
      set (value) {
        this.updateFiltersOfPlaylists('firstChar', value)
      },
    },
    colors: {
      get () {
        return this.$store.state.Playlists.filters.colors
      },
      set (value) {
        this.updateFiltersOfPlaylists('colors', value)
      },
    },
    getNumberOfPagesLimit() {
      return this.$store.getters.getNumberOfPagesLimit
    },
    pages: {
      get() {
        return this.$store.getters.playlistsPages
      },
      set(value) {
      },
    },
    playlistsOnPage: {
      get() {
        return this.$store.getters.playlistsOnPage
      },
      set(value) {
      },
    },
    playlistsPerPage: {
      get() {
        return this.$store.getters.playlistsPerPage
      },
      set(number) {
        this.$store.dispatch('changePlaylistsPerPage', number)
      },
    },
    playlistsPagesSum: {
      get() {
        return this.$store.getters.playlistsPagesSum
      },
      set(number) {
        this.$store.dispatch('changePlaylistsPageTotal', number)
      },
    },
    playlistsCurrentPage: {
      get() {
        return this.$store.getters.playlistsCurrentPage
      },
      set(number) {
        this.$store.state.Playlists.filters.page = number
        this.$store.dispatch('changePlaylistsPageCurrent', number)
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
  },
  methods: {
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
    updateFiltersOfPlaylists(key, value){
      this.$store.commit('updateFiltersOfPlaylists', {key, value})
      this.$store.dispatch('filterPlaylists')
    },
    getSelectedPlaylists(selectedPlaylists){
      let ids = selectedPlaylists.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPlaylists', ids)
    },
    copyPlaylistNameToClipboard(){
      navigator.clipboard.writeText(this.selectedPlaylists())
    },
    deletePlaylists(){
      this.previousSelection = []
      this.$store.dispatch('deletePlaylists'), 
      this.$store.state.Playlists.dialogDeletePlaylist = false
    },
  },
  watch: {
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
    border: 1.5px solid rgb(122, 122, 122);
  }
}
</style>