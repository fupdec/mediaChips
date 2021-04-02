<template>
	<div class="app-bar-container">
    <div>
      <v-menu offset-y nudge-bottom="10" :close-on-content-click="false">
        <template #activator="{ on: onMenu }">
          <v-tooltip bottom>
            <template #activator="{ on: onTooltip }">
              <v-btn v-on="{ ...onMenu, ...onTooltip }" icon tile>
                <v-icon>mdi-tag-plus</v-icon>
              </v-btn>
            </template>
            <span>Add New Tag</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add New Tag</span>
            <v-spacer></v-spacer>
            <v-icon>mdi-tag-plus</v-icon>
          </v-card-title>
          <v-divider></v-divider>
            <v-card-text class="pb-0">
              <v-form ref="form" v-model="validTagName">
                <v-textarea v-model="tagName" label="Names" required :rules="nameRules" outlined
                  hint="Write a name on a new line to add several tags at once" no-resize
                ></v-textarea>
                <v-alert
                  v-model="alertDuplicateTags" border="left" text icon="mdi-tag-multiple-outline"
                  close-text="Close" type="warning" dismissible class="mt-6" 
                > Already in the database: {{duplicateTags}} </v-alert>
                <v-alert
                  v-model="alertAddNewTags" border="left" text icon="mdi-tag-plus-outline"
                  close-text="Close" type="success" dismissible class="mt-6" 
                > Added: {{newTags}} </v-alert>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="pasteText" color="secondary" class="mb-2 ml-2" small> 
                <v-icon left>mdi-clipboard-text-outline</v-icon> Paste text
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn 
                @click="addNewTag()" :disabled="!validTagName"
                color="primary" class="mb-2 mr-2" small
              > <v-icon left>mdi-tag-plus-outline</v-icon> Add </v-btn>
            </v-card-actions>
        </v-card>
      </v-menu>
        
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Tags.dialogFilterTags=true" v-on="on" icon tile>
            <v-badge :value="filterBadge" :content="filteredTagsTotal" overlap bottom style="z-index: 5;"> 
            <v-icon>mdi-filter</v-icon> </v-badge>
          </v-btn>
        </template>
        <span>Filter Tags</span>
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
            <span>Sort Tags</span>
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
                    mdi-arrow-up-thick
                  </v-icon>
                  <v-icon right size="14" v-if="sortButtons=='color' && sortDirection=='asc'">
                    mdi-arrow-down-thick
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
          <v-btn icon tile @click="selectAllTags" v-on="on">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
        </template>
        <span>Select All Tags</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="addNewTab" icon tile v-on="on">
            <v-icon>mdi-tab-plus</v-icon>
          </v-btn>
        </template>
        <span>Add New Tab</span>
      </v-tooltip>
    </div>

    <v-spacer></v-spacer>

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-badge :value="isAltNamesHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
            <v-btn icon tile @click="toggleAltNamesVisibilty()" v-on="on">
              <v-icon>mdi-alphabetical</v-icon>
            </v-btn>
          </v-badge>
        </template>
        <span v-if="isAltNamesHidden">Show alternate names</span>
        <span v-else>Hide alternate names</span>
      </v-tooltip>
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
    <DialogFilterTags v-if="$store.state.Tags.dialogFilterTags"/>
	</div>
</template>


<script>
const shortid = require('shortid')

export default {
  name: 'TagsAppbar',
  components: {
    DialogFilterTags: () => import('@/components/pages/tags/DialogFilterTags.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    validTagName: false,
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length > 1 || 'Name must be more than 1 characters',
      v => !/[\/\%"?<>{}\[\]]/g.test(v) || 'Name must not content \/%\"?<>{}\[\]',
    ],
    alertDuplicateTags: false,
    alertAddNewTags: false,
    duplicateTags: '',
    newTags: '',
    tagName: '',
    searchString: '',
  }),
  computed: {
    filterBadge() {
      let filters = _.cloneDeep(this.$store.state.Settings.tagFilters)
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
    filteredTagsTotal() {
      let filters = _.cloneDeep(this.$store.state.Settings.tagFilters)
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
        return this.$store.state.Settings.tagSortBy
      },
      set(value) {
        this.$store.state.Settings.tagSortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Settings.tagSortDirection
    },
    isAltNamesHidden: {
      get () {
        return this.$store.state.Settings.tagAltNamesHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'tagAltNamesHidden', value})
      },
    },
    isPerformersHidden: {
      get () {
        return this.$store.state.Settings.tagPerformersHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'tagPerformersHidden', value})
      },
    },
    isEditBtnHidden: {
      get () {
        return this.$store.state.Settings.tagEditBtnHidden
      },
      set (value) {
        this.$store.dispatch('updateSettingsState', {key:'tagEditBtnHidden', value})
      },
    },
    searchStringComputed() {
      let filters = this.$store.state.Settings.tagFilters
      let search = _.find(filters, {param: 'name', flag: 'search'})
      if (search) return search.val
      else return ''
    },
    favoritesFilterExist() {
      let filters = this.$store.state.Settings.tagFilters
      let index = _.findIndex(filters, {param: 'favorite'})
      if (index >= 0) return true 
      else return false
    },
  },
  methods: {
    search() {
      if (this.searchString == null || this.searchString.length == 0) return
      let filters = this.$store.state.Settings.tagFilters
      let index = _.findIndex(filters, {param: 'name', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      this.$store.state.Settings.tagFilters.push({
        param: 'name',
        cond: 'includes',
        val: this.searchString,
        type: 'string',
        flag: 'search',
        lock: true
      })
      this.$store.dispatch('filterTags')
    },
    clearSearch() {
      let filters = this.$store.state.Settings.tagFilters
      let index = _.findIndex(filters, {param: 'name', flag: 'search'})
      if (index >= 0) filters.splice(index, 1)
      else return
      this.$store.dispatch('filterTags')
    },
    toggleFavorites() {
      let filters = this.$store.state.Settings.tagFilters
      let index = _.findIndex(filters, {param: 'favorite'})
      if (index >= 0) {
        filters.splice(index, 1)
      } else {
        this.$store.state.Settings.tagFilters.push({
          param: 'favorite',
          cond: 'yes',
          val: '',
          type: 'boolean',
          flag: null,
          lock: true
        })
      }
      this.$store.dispatch('filterTags')
    },
    changeSearchString(e) {
      this.searchString = e
    },
    toggleAltNamesVisibilty() {
      this.isAltNamesHidden = !this.isAltNamesHidden
    },
    togglePerformersVisibilty() {
      this.isPerformersHidden = !this.isPerformersHidden
    },
    toggleEditBtnVisibilty() {
      this.isEditBtnHidden = !this.isEditBtnHidden
    },
    async pasteText() {
      let text = await navigator.clipboard.readText()
      if (this.tagName) {
        text = this.tagName + text
      }
      this.tagName = text
    },
    addNewTag() {
      let tagsArray = this.tagName.trim()
      tagsArray = tagsArray.replace(/[\/\%"?<>{}\[\]]/g, '')
      tagsArray = tagsArray.split(/\r?\n/)
      tagsArray = tagsArray.filter((el)=>(el != ""))
      tagsArray = tagsArray.map(s => s.trim())
      console.log(`start:::${tagsArray.join(', ')}:::end`)
      const tagsDB = this.$store.getters.tags
      let dups = []
      let newTags = []

      async function addTagInDb() {
        for (const tag of tagsArray) {

          // check for duplicate name of tag
          let duplicate = tagsDB.find(t=>(t.name.toLowerCase()===tag.toLowerCase())).value()
          if (duplicate) {
            console.warn(`tag ${JSON.stringify(duplicate.name)} already in DB`)
            dups.push(duplicate.name)
            continue;
          }

          // create tag info 
          var tagID = shortid.generate()
          var tagInfo = {
            id: tagID,
            name: tag,
            altNames: [],
            category: [],
            color: "#9b9b9b",
            value: 0,
            date: Date.now(),
            edit: Date.now(),
            favorite: false,
            bookmark: false,
            type: [],
            videos: 0,
            performers: [],
          }

          // add tagInfo to DB
          await tagsDB.push(tagInfo).write()
          newTags.push(tag)
          
          console.log(`added: tag ${JSON.stringify(tagInfo.name)}`)
        }
      }
      addTagInDb().then(()=>{
        this.duplicateTags = dups.join(", ")
        if(this.duplicateTags) {
          this.alertDuplicateTags = true
        } else { this.alertDuplicateTags = false }
        this.newTags = newTags.join(", ")
        console.log("All tags added!");
        if(this.newTags) {
          this.alertAddNewTags = true
        } else { this.alertAddNewTags = false }
        this.tagName = '',
        this.$store.commit('updateTags')
        this.$store.dispatch('filterTags', true)
      })
    },
    toggleSortDirection() {
      this.$store.state.Settings.tagSortDirection = this.sortDirection=='asc' ? 'desc':'asc'
      setTimeout(()=>{
        this.$store.dispatch('filterTags')
      },200)
    },
    selectAllTags() {
      this.$store.state.Tags.selection.clearSelection()
      let selected = this.$store.state.Tags.selection.select('.tag-card')
      this.$store.state.Tags.selection.keepSelection()
      this.getSelectedTags(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedTags(selectedTags){
      let ids = selectedTags.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedTags', ids)
    },
    addNewTab() {
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.tagFiltersForTabName, 
        link: `/tags/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.tagFilters),
        sortBy: this.$store.state.Settings.tagSortBy,
        sortDirection: this.$store.state.Settings.tagSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.tagFirstChar,
        color: this.$store.state.Settings.tagColor,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.Tags.dialogFilterTags = false
      this.$router.push(tab.link)
    },
  },
  watch: {
  },
}
</script>