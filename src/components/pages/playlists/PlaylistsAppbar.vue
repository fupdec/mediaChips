<template>
	<div class="app-bar-container">
		<div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-playlist-plus</v-icon>
              </v-btn>
            </template>
            <span>Add new playlist</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add new playlist</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-playlist-plus</v-icon>
          </v-card-title>
          <v-divider></v-divider>
            <v-card-text class="pb-0">
              <v-form ref="form" v-model="validPlaylistName">
                <v-textarea
                  v-model="playlistName" label="Names" outlined required :rules="nameRules"
                  hint="Write a name on a new line to add several playlists at once" no-resize
                ></v-textarea>
                <v-alert
                  v-model="alertDuplicatePlaylists" border="left" text dismissible class="mt-6"
                  icon="mdi-plus-circle-multiple-outline" close-text="Close" type="warning"
                > Already in the database: {{duplicatePlaylists}} </v-alert>
                <v-alert
                  v-model="alertAddNewPlaylists" border="left" text icon="mdi-plus-circle"
                  close-text="Close" type="success" dismissible class="mt-6" 
                > Added: {{newPlaylists}} </v-alert>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="pasteText" color="secondary" class="mb-2 ml-2" small> 
                <v-icon left>mdi-clipboard-text-outline</v-icon> Paste text
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn 
                @click="addNewPlaylist" :disabled="!validPlaylistName" 
                color="primary" class="mb-2 mr-2" small
              > <v-icon left>mdi-plus</v-icon> Add
              </v-btn>
            </v-card-actions>
        </v-card>
      </v-menu>

      <v-menu v-model="filtersMenu" offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" @click="filtersMenu=true" icon tile>
                <v-badge :value="filterBadge" :content="filteredPlaylistsTotal" 
                  overlap bottom :dot="filteredPlaylistsTotal==0" style="z-index: 5;"
                ><v-icon>mdi-filter</v-icon>
                </v-badge>
              </v-btn>
            </template>
            <span>Filter playlists</span>
          </v-tooltip>
        </template>
        <v-card width="620">
          <v-card-title class="py-1">
            <span class="headline">Filter playlists</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-filter</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field 
              v-model="$store.state.Playlists.filters.name"
              label="Name" hide-details clearable outlined dense
              prepend-icon="mdi-alphabetical-variant"
              @click:append-outer="pasteName" 
              append-outer-icon="mdi-clipboard-text-outline"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn small class="mx-2 mb-2" color="secondary" @click="resetAllFilters(), filtersMenu=false">
              <v-icon left>mdi-filter-off</v-icon> Reset all filters
            </v-btn>

            <v-spacer></v-spacer>
            
            <v-btn small class="mr-2 mb-2" color="primary" @click="applyAllFilters(), filtersMenu=false">
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
            <v-icon v-if="$store.state.Playlists.filters.favorite">mdi-heart</v-icon>
            <v-icon v-else>mdi-heart-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="$store.state.Playlists.filters.favorite">Show all</span>
        <span v-else>Show favorites</span>
      </v-tooltip>

      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-badge :icon="sortIcon" overlap offset-x="25" offset-y="45">
                <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                  <v-icon v-if="sortDirection=='desc'">mdi-sort-descending</v-icon>
                  <v-icon v-else>mdi-sort-ascending</v-icon>
                </v-btn>
              </v-badge>
            </template>
            <span>Sort Playlists</span>
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
                <v-btn outlined @click="toggleSortDirection" value="videos" v-on="on">
                  <v-icon>mdi-video-outline</v-icon>
                  <v-icon right size="14" v-if="sortButtons=='videos' && sortDirection=='desc'">
                    mdi-arrow-up-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='videos' && sortDirection=='asc'">
                    mdi-arrow-down-thick
                  </v-icon>
                </v-btn>
              </template>
              <span>Sort by Number of Videos</span>
            </v-tooltip>
          </v-btn-toggle>
        </v-card>
      </v-menu>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="selectAllPlaylists" v-on="on">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
        </template>
        <span>Select all playlists</span>
      </v-tooltip>
	  </div>
	</div>
</template>


<script>
const shortid = require('shortid')

export default {
  name: 'PlaylistsAppbar',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validPlaylistName: false,
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 1 || 'Name must be more than 1 characters',
      v => !/[\/\%"?<>{}\[\]]/g.test(v) || 'Name must not content \/%\"?<>{}\[\]',
    ],
    alertDuplicatePlaylists: false,
    alertAddNewPlaylists: false,
    duplicatePlaylists: "",
    newPlaylists: "",
    playlistName: "",
    filtersMenu: false,
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredPlaylistsTotal
      return total !== this.$store.getters.playlistsTotal
    },
    filteredPlaylistsTotal() {
      return this.$store.getters.filteredPlaylistsTotal
    },
    sortIcon() {
      if (this.sortButtons=='name') return 'mdi-alphabetical-variant'
      if (this.sortButtons=='date') return 'mdi-calendar-plus'
      if (this.sortButtons=='edit') return 'mdi-calendar-edit'
      if (this.sortButtons=='videos') return 'mdi-video-outline'
      return 'mdi-help'
    },
    sortButtons: {
      get() {
        return this.$store.state.Playlists.filters.sortBy
      },
      set(value) {
        const values = {
          key: 'sortBy', 
          value: value,
        }
        this.$store.commit('updateFiltersOfPlaylists', values)
      },
    },
    sortDirection() {
      return this.$store.state.Playlists.filters.sortDirection
    },
  },
  methods: {
    async pasteText() {
      let text = await navigator.clipboard.readText()
      if (this.playlistName) {
        text = this.playlistName + text
      }
      this.playlistName = text
    },
    async pasteName() {
      let text = await navigator.clipboard.readText()
      let name = this.$store.state.Playlists.filters.name
      if (name) {
        text = name + text
      }
      const values = {
        key: 'name', 
        value: text,
      }
      this.$store.commit('updateFiltersOfPlaylists', values)
    },
    applyAllFilters(event) {
      this.$store.dispatch('filterPlaylists')
    },
    resetAllFilters(event) {
      this.$store.commit('resetFilteredPlaylists')
      this.$store.dispatch('filterPlaylists')
    },
    toggleFavorites() {
      const values = {
        key: 'favorite', 
        value: !this.$store.state.Playlists.filters.favorite,
      }
      this.$store.commit('updateFiltersOfPlaylists', values)
      this.$store.dispatch('filterPlaylists')
    },
    toggleSortDirection() {
      let dir = this.sortDirection == 'asc' ? 'desc' : 'asc'
      const values = {
        key: 'sortDirection', 
        value: dir,
      }
      this.$store.commit('updateFiltersOfPlaylists', values)
      setTimeout(()=>{
        this.$store.dispatch('filterPlaylists')
      },200)
    },
    addNewPlaylist() {
      let playlistsArray = this.playlistName.trim()
      playlistsArray = playlistsArray.replace(/[\/\%"?<>{}\[\]]/g, '')
      playlistsArray = playlistsArray.split(/\r?\n/)
      playlistsArray = playlistsArray.filter((el)=>(el != ""))
      playlistsArray = playlistsArray.map(s => s.trim())
      console.log(`start:::${playlistsArray.join(', ')}:::end`)
      const playlistsDb = this.$store.getters.playlists
      let dups = []
      let newPlaylists = []

      async function addPlaylistInDb() {
        for (const playlist of playlistsArray) {

          // check for duplicate name of playlist
          let duplicate = playlistsDb.find(w=>(w.name.toLowerCase()===playlist.toLowerCase())).value()
          if (duplicate) {
            console.warn(`playlist ${JSON.stringify(duplicate.name)} already in DB`)
            dups.push(duplicate.name)
            continue
          }

          // create playlist info 
          const playlistID = shortid.generate()
          const playlistInfo = {
            id: playlistID,
            name: playlist,
            videos: [],
            date: Date.now(),
            edit: Date.now(),
            favorite: false,
          }

          // add playlistInfo to DB
          await playlistsDb.push(playlistInfo).write()
          newPlaylists.push(playlist)
          
          console.log(`added: playlist ${JSON.stringify(playlistInfo.name)}`)
        }
      }
      addPlaylistInDb().then(()=>{
        this.duplicatePlaylists = dups.join(", ")
        if(this.duplicatePlaylists) {
          this.alertDuplicatePlaylists = true
        } else { this.alertDuplicatePlaylists = false }
        this.newPlaylists = newPlaylists.join(", ")
        console.log("All playlists added!");
        if(this.newPlaylists) {
          this.alertAddNewPlaylists = true
        } else { this.alertAddNewPlaylists = false }
        this.playlistName = '',
        this.$store.commit('updatePlaylists')
        this.$store.dispatch('filterPlaylists', true)
      })
    },
    selectAllPlaylists() {
      this.$store.state.Playlists.selection.clearSelection()
      let selected = this.$store.state.Playlists.selection.select('.playlist-card')
      this.$store.state.Playlists.selection.keepSelection()
      this.getSelectedPlaylists(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedPlaylists(selectedPlaylists){
      let ids = selectedPlaylists.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPlaylists', ids)
    },
  },
  watch: {
  },
}
</script>