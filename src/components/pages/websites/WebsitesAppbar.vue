<template>
	<div class="app-bar-container">
		<div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-plus-circle</v-icon>
              </v-btn>
            </template>
            <span>Add new website</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add new website</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-plus-circle</v-icon>
          </v-card-title>
          <v-divider></v-divider>
            <v-card-text class="pb-0">
              <v-form ref="form" v-model="validWebsiteName">
                <v-textarea
                  v-model="websiteName" label="Names" outlined required :rules="nameRules"
                  hint="Write a name on a new line to add several websites at once" no-resize
                ></v-textarea>
                <v-alert
                  v-model="alertDuplicateWebsites" border="left" text dismissible class="mt-6"
                  icon="mdi-plus-circle-multiple-outline" close-text="Close" type="warning"
                > Already in the database: {{duplicateWebsites}} </v-alert>
                <v-alert
                  v-model="alertAddNewWebsites" border="left" text icon="mdi-plus-circle"
                  close-text="Close" type="success" dismissible class="mt-6" 
                > Added: {{newWebsites}} </v-alert>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="pasteText" color="secondary" class="mb-2 ml-2" small> 
                <v-icon left>mdi-clipboard-text-outline</v-icon> Paste text
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn 
                @click="addNewWebsite" :disabled="!validWebsiteName" 
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
                <v-badge 
                  :value="filterBadge" :content="filteredTagsTotal" 
                  overlap bottom :dot="filteredTagsTotal==0" style="z-index: 5;"
                ><v-icon>mdi-filter</v-icon>
                </v-badge>
              </v-btn>
            </template>
            <span>Filter websites</span>
          </v-tooltip>
        </template>
        <v-card width="620">
          <v-card-title class="py-1">
            <span class="headline">Filter websites</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-filter</v-icon>
          </v-card-title>
          <v-divider></v-divider>
          <v-container fluid class="py-0">
            <v-row>
              <v-col cols="12" sm="12">
                <v-text-field 
                  v-model="$store.state.Websites.filters.name"
                  label="Name" hide-details clearable outlined dense
                  prepend-icon="mdi-alphabetical-variant"
                  @click:append-outer="pasteName" 
                  append-outer-icon="mdi-clipboard-text-outline"
                />
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions class="mt-4">
            <v-btn small class="mx-2 mb-2" color="secondary" @click="resetAllFilters(), filtersMenu=false">
              <v-icon left>mdi-filter-off</v-icon> Reset all filters
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn small class="mb-2 mr-2" color="secondary" @click="addNewTab(), filtersMenu=false">
              <v-icon left>mdi-tab-plus</v-icon> New tab
            </v-btn>
            
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
            <v-icon v-if="$store.state.Websites.filters.favorite">mdi-heart</v-icon>
            <v-icon v-else>mdi-heart-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="$store.state.Websites.filters.favorite">Show all</span>
        <span v-else>Show favorites</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
            <v-icon v-if="$store.state.Websites.filters.bookmark">mdi-bookmark</v-icon>
            <v-icon v-else>mdi-bookmark-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="$store.state.Websites.filters.bookmark">Show all</span>
        <span v-else>Show bookmarks</span>
      </v-tooltip>

      
      <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs"  v-on="on" icon tile>
            <v-badge :content="websitesSort" overlap bottom class="badge-sort">
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
                <v-btn outlined @click="toggleSortDirection" value="color" v-on="on">
                  <v-icon>mdi-palette</v-icon>
                  <v-icon right size="14" v-if="sortButtons==='color' && sortDirection==='desc'">
                    mdi-arrow-down-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons==='color' && sortDirection==='asc'">
                    mdi-arrow-up-thick
                  </v-icon>
                </v-btn>
              </template>
              <span>Sort by color</span>
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
          </v-btn-toggle>
        </v-card>
      </v-menu>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="selectAllWebsites" v-on="on">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
        </template>
        <span>Select all websites</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="openRandomWebsite" icon tile v-on="on"> 
              <v-icon>mdi-dice-5</v-icon>
          </v-btn>
        </template>
        <span>Open random website</span>
      </v-tooltip>
    </div>

    <v-spacer></v-spacer>

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-badge :value="isEditBtnHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
            <v-btn icon tile @click="toggleEditBtnVisibilty()" v-on="on">
              <v-icon>mdi-circle-edit-outline</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span v-if="isEditBtnHidden">Show edit button</span>
        <span v-else>Hide edit button</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-badge :value="isVideoTagsHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
            <v-btn icon tile @click="toggleVideoTagsVisibilty()" v-on="on">
              <v-icon>mdi-tag-outline</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span v-if="isVideoTagsHidden">Show Video Tags</span>
        <span v-else>Hide Video Tags</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-badge :value="isPerformersHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
            <v-btn icon tile @click="togglePerformersVisibilty()" v-on="on">
              <v-icon>mdi-account</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span v-if="isPerformersHidden">Show Tags</span>
        <span v-else>Hide Tags</span>
      </v-tooltip>
    </div>
	</div>
</template>


<script>
const shortid = require('shortid')

export default {
  name: 'WebsitesAppbar',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validWebsiteName: false,
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 1 || 'Name must be more than 1 characters',
      v => !/[\/\%"?<>{}\[\]]/g.test(v) || 'Name must not content \/%\"?<>{}\[\]',
    ],
    alertDuplicateWebsites: false,
    alertAddNewWebsites: false,
    duplicateWebsites: "",
    newWebsites: "",
    websiteName: "",
    filtersMenu: false,
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredWebsitesTotal
      return total !== this.$store.getters.websitesTotal
    },
    filteredTagsTotal() {
      return this.$store.getters.filteredWebsitesTotal
    },
    websitesSort() {
      let sort = this.$store.state.Websites.filters.sortBy
      return sort.charAt(0) + sort.charAt(1) + sort.charAt(2) + '.'
    },
    sortButtons: {
      get() {
        return this.$store.state.Websites.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfWebsites('sortBy', value)
      },
    },
    sortDirection() {
      return this.$store.state.Websites.filters.sortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
    isPerformersHidden: {
      get () {
        return this.$store.state.Websites.websitePerformersHidden
      },
      set (value) {
        this.$store.dispatch('updateWebsitePerformersHidden', value)
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Websites.websiteVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updateWebsiteVideoTagsHidden', value)
      },
    },
    isEditBtnHidden: {
      get () {
        return this.$store.state.Websites.websiteEditBtnHidden
      },
      set (value) {
        this.$store.dispatch('updateWebsiteEditBtnHidden', value)
      },
    },
  },
  methods: {
    togglePerformersVisibilty() {
      this.isPerformersHidden = !this.isPerformersHidden
    },
    toggleVideoTagsVisibilty() {
      this.isVideoTagsHidden = !this.isVideoTagsHidden
    },
    toggleEditBtnVisibilty() {
      this.isEditBtnHidden = !this.isEditBtnHidden
    },
    async pasteText() {
      let text = await navigator.clipboard.readText()
      if (this.websiteName) {
        text = this.websiteName + text
      }
      this.websiteName = text
    },
    async pasteName() {
      let text = await navigator.clipboard.readText()
      let name = this.$store.state.Websites.filters.name
      if (name) {
        text = name + text
      }
      this.updateFiltersOfWebsites('name', text)
    },
    addNewWebsite() {
      let websitesArray = this.websiteName.trim()
      websitesArray = websitesArray.replace(/[\/\%"?<>{}\[\]]/g, '')
      websitesArray = websitesArray.split(/\r?\n/)
      websitesArray = websitesArray.filter((el)=>(el != ""))
      websitesArray = websitesArray.map(s => s.trim())
      console.log(`start:::${websitesArray.join(', ')}:::end`)
      const websitesDB = this.$store.getters.websites
      let dups = []
      let newWebsites = []

      async function addWebsiteInDb() {
        for (const website of websitesArray) {

          // check for duplicate name of website
          let duplicate = websitesDB.find(w=>(w.name.toLowerCase()===website.toLowerCase())).value()
          if (duplicate) {
            console.warn(`website ${JSON.stringify(duplicate.name)} already in DB`)
            dups.push(duplicate.name)
            continue;
          }

          // create website info 
          var websiteID = shortid.generate()
          var websiteInfo = {
            id: websiteID,
            name: website,
            color: "#9b9b9b",
            network: false,
            childWebsites: [],
            date: Date.now(),
            favorite: false,
            videos: 0,
            performers: [],
            tags: [],
            videoTags: [],
          }

          // add websiteInfo to DB
          await websitesDB.push(websiteInfo).write()
          newWebsites.push(website)
          
          console.log(`added: website ${JSON.stringify(websiteInfo.name)}`)
        }
      }
      addWebsiteInDb().then(()=>{
        this.duplicateWebsites = dups.join(", ")
        if(this.duplicateWebsites) {
          this.alertDuplicateWebsites = true
        } else { this.alertDuplicateWebsites = false }
        this.newWebsites = newWebsites.join(", ")
        console.log("All websites added!");
        if(this.newWebsites) {
          this.alertAddNewWebsites = true
        } else { this.alertAddNewWebsites = false }
        this.websiteName = '',
        this.$store.commit('updateWebsites')
        this.$store.dispatch('filterWebsites', true)
      })
    },
    updateFiltersOfWebsites(key, value){
      this.$store.commit('updateFiltersOfWebsites', {key, value})
      this.updateTabFilters()
    },
    updateTabFilters() {
      let newFilters = _.cloneDeep(this.$store.state.Websites.filters)
      if (this.tabId === 'default') {
        this.$store.state.Websites.filtersReserved = newFilters
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.websitesFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.websitesFilters, 
        link: `/websites/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Websites.filters),
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    applyAllFilters(event) {
      this.$store.dispatch('filterWebsites')
      this.updateTabFilters()
    },
    resetAllFilters(event) {
      this.$store.commit('resetFilteredWebsites')
      this.$store.dispatch('filterWebsites')
      this.updateTabFilters()
    },
    toggleFavorites() {
      this.updateFiltersOfWebsites('favorite', !this.$store.state.Websites.filters.favorite)
      this.$store.dispatch('filterWebsites')
    },
    toggleBookmarks() {
      this.updateFiltersOfWebsites('bookmark', !this.$store.state.Websites.filters.bookmark)
      this.$store.dispatch('filterWebsites')
    },
    toggleSortDirection() {
      let dir = this.sortDirection === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfWebsites('sortDirection', dir)
      setTimeout(()=>{
        this.$store.dispatch('filterWebsites')
      },200)
    },
    selectAllWebsites() {
      this.$store.state.Websites.selection.clearSelection()
      let selected = this.$store.state.Websites.selection.select('.website-card')
      this.$store.state.Websites.selection.keepSelection()
      this.getSelectedWebsites(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedWebsites(selectedWebsites){
      let ids = selectedWebsites.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedWebsites', ids)
    },
    openRandomWebsite() {
      const rand = this.getRandomIntInclusive(1, this.$store.getters.websitesTotal)
      const websiteId = this.$store.getters.websites.value()[rand].id
      this.openWebsitePage(websiteId)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    openWebsitePage(websiteId) {
      this.$router.push(`/website/:${websiteId}?tabId=default`)
    },
  },
  watch: {
  },
}
</script>