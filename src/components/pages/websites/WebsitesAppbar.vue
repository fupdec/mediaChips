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
        
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Websites.dialogFilterWebsites=true" v-on="on" icon tile>
            <v-badge :value="filterBadge" :content="filteredWebsitesTotal" overlap bottom style="z-index: 5;"> 
            <v-icon>mdi-filter</v-icon> </v-badge>
          </v-btn>
        </template>
        <span>Filter Websites</span>
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
            <span>Sort Websites</span>
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
                <v-btn outlined @click="toggleSortDirection" value="color" v-on="on">
                  <v-icon>mdi-palette</v-icon>
                  <v-icon right size="14" v-if="sortButtons=='color' && sortDirection=='desc'">
                    mdi-arrow-down-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='color' && sortDirection=='asc'">
                    mdi-arrow-up-thick
                  </v-icon>
                </v-btn>
              </template>
              <span>Sort by Color</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                  <v-icon>mdi-calendar-plus</v-icon>
                  <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='desc'">
                    mdi-arrow-down-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='date' && sortDirection=='asc'">
                    mdi-arrow-up-thick
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
                    mdi-arrow-down-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='edit' && sortDirection=='asc'">
                    mdi-arrow-up-thick
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
                    mdi-arrow-down-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='videos' && sortDirection=='asc'">
                    mdi-arrow-up-thick
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
          <v-btn icon tile @click="selectAllWebsites" v-on="on">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
        </template>
        <span>Select all websites</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="addNewTab" icon tile v-on="on">
            <v-icon>mdi-tab-plus</v-icon>
          </v-btn>
        </template>
        <span>Add New Tab</span>
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
          <v-btn icon tile @click="toggleWebsiteView" v-on="on">
            <v-icon v-if="websiteView=='default'">mdi-image</v-icon>
            <v-icon v-if="websiteView=='compact'">mdi-label</v-icon>
          </v-btn>
        </template>
        <span>Website View: {{websiteView}}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-badge :value="isEditBtnHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
            <v-btn icon tile @click="toggleEditBtnVisibilty()" v-on="on" :disabled="websiteView=='compact'">
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
            <v-btn icon tile @click="toggleVideoTagsVisibilty()" v-on="on" :disabled="websiteView=='compact'">
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
            <v-btn icon tile @click="togglePerformersVisibilty()" v-on="on" :disabled="websiteView=='compact'">
              <v-icon>mdi-account</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span v-if="isPerformersHidden">Show Tags</span>
        <span v-else>Hide Tags</span>
      </v-tooltip>
    </div>
    <DialogFilterWebsites v-if="$store.state.Websites.dialogFilterWebsites"/>
	</div>
</template>


<script>
const shortid = require('shortid')

export default {
  name: 'WebsitesAppbar',
  components: {
    DialogFilterWebsites: () => import('@/components/pages/websites/DialogFilterWebsites.vue'),
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
    duplicateWebsites: '',
    newWebsites: '',
    websiteName: '',
    searchString: '',
  }),
  computed: {
    filterBadge() {
      let filters = _.cloneDeep(this.$store.state.Settings.websiteFilters)
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
    filteredWebsitesTotal() {
      let filters = _.cloneDeep(this.$store.state.Settings.websiteFilters)
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
      if (this.sortButtons=='color') return 'mdi-palette'
      if (this.sortButtons=='date') return 'mdi-calendar-plus'
      if (this.sortButtons=='edit') return 'mdi-calendar-edit'
      if (this.sortButtons=='videos') return 'mdi-video-outline'
      return 'mdi-help'
    },
    sortButtons: {
      get() {
        return this.$store.state.Settings.websiteSortBy
      },
      set(value) {
        this.$store.state.Settings.websiteSortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Settings.websiteSortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
    websiteView: {
      get() {
        return this.$store.state.Settings.websiteView
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'websiteView', value})
      },
    },
    isPerformersHidden: {
      get () {
        return this.$store.state.Settings.websitePerformersHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'websitePerformersHidden', value})
      },
    },
    isVideoTagsHidden: {
      get () {
        return this.$store.state.Settings.websiteVideoTagsHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'websiteVideoTagsHidden', value})
      },
    },
    isEditBtnHidden: {
      get () {
        return this.$store.state.Settings.websiteEditBtnHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'websiteEditBtnHidden', value})
      },
    },
    searchStringComputed() {
      let filters = this.$store.state.Settings.websiteFilters
      let search = _.find(filters, {param: 'name', flag: 'search'})
      if (search) return search.val
      else return ''
    },
    favoritesFilterExist() {
      let filters = this.$store.state.Settings.websiteFilters
      let index = _.findIndex(filters, {param: 'favorite'})
      if (index >= 0) return true 
      else return false
    },
  },
  methods: {
    search() {
      if (this.searchString == null || this.searchString.length == 0) return
      let filters = this.$store.state.Settings.websiteFilters
      let index = _.findIndex(filters, {param: 'name', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      this.$store.state.Settings.websiteFilters.push({
        param: 'name',
        cond: 'includes',
        val: this.searchString,
        type: 'string',
        flag: 'search',
        lock: true
      })
      this.$store.dispatch('filterWebsites')
    },
    clearSearch() {
      let filters = this.$store.state.Settings.websiteFilters
      let index = _.findIndex(filters, {param: 'name', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      else return
      this.$store.dispatch('filterWebsites')
    },
    toggleFavorites() {
      let filters = this.$store.state.Settings.websiteFilters
      let index = _.findIndex(filters, {param: 'favorite'})
      if (index >= 0) {
        filters.splice(index, 1)
      } else {
        this.$store.state.Settings.websiteFilters.push({
          param: 'favorite',
          cond: 'yes',
          val: '',
          type: 'boolean',
          flag: null,
          lock: true
        })
      }
      this.$store.dispatch('filterWebsites')
    },
    changeSearchString(e) {
      this.searchString = e
    },
    toggleWebsiteView() {
      this.websiteView == 'default' ? this.websiteView = 'compact' : this.websiteView = 'default'
    },
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
            favorite: false,
            bookmark: false,
            date: Date.now(),
            edit: Date.now(),
            videos: 0,
            performers: [],
            videoTags: [],
            views: 0,
            altNames: [],
            url: '',
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
    toggleSortDirection() {
      this.$store.state.Settings.websiteSortDirection = this.sortDirection=='asc' ? 'desc':'asc'
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
    addNewTab() {
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.websiteFiltersForTabName, 
        link: `/websites/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.websiteFilters),
        sortBy: this.$store.state.Settings.websiteSortBy,
        sortDirection: this.$store.state.Settings.websiteSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.websiteFirstChar,
        color: this.$store.state.Settings.websiteColor,
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Websites.dialogFilterWebsites = false
      this.$router.push(tab.link)
    },
  },
  watch: {
  },
}
</script>