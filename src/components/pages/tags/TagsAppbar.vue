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
            <span>Add new tag</span>
          </v-tooltip>
        </template>
        <v-card width="500">
          <v-card-title class="py-1">
            <span class="headline">Add new tag</span>
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
              <v-btn @click="pasteText" color="primary" outlined class="mb-4 ml-4"> 
                <v-icon left>mdi-clipboard-text-outline</v-icon> Paste text
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn 
                @click="addNewTag()" :disabled="!validTagName"
                color="primary" class="mb-4 mr-4" 
              > <v-icon left>mdi-tag-plus-outline</v-icon> Add </v-btn>
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
            <span>Filter tags</span>
          </v-tooltip>
        </template>
        <v-card width="640">
          <v-card-title class="py-1">
            <span class="headline">Filter tags</span>
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
              <v-col cols="12" sm="9" class="pb-0 pr-0">
                <v-text-field 
                  v-model="$store.state.Tags.filters.name"
                  label="Name" hide-details clearable outlined dense
                  prepend-icon="mdi-alphabetical-variant"
                  @click:append-outer="pasteName" 
                  append-outer-icon="mdi-clipboard-text-outline"
                />
              </v-col>
              <v-col cols="12" sm="3" class="pt-2 pb-0">
                <v-checkbox v-model="$store.state.Tags.filters.alternate" 
                  dense hide-details class="ma-0"
                > <template v-slot:label>
                    <span class="caption">Include alternate names</span>
                  </template>
                </v-checkbox>
              </v-col>
              <v-col cols="12" sm="12" class="pb-0">
                <v-select
                  v-model="$store.state.Tags.filters.category" :items="categories"
                  label="Category" multiple hide-details outlined dense
                  prepend-icon="mdi-tag-multiple-outline"
                  @click:prepend-inner="changeFilterCategoryLogic" 
                  :prepend-inner-icon="filterCategoryLogicIcon" append-icon=""
                  :menu-props="{contentClass:'select-dense-checkbox'}"
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions class="mt-4">
            <v-btn small class="mx-4 mb-4" color="primary" @click="resetAllFilters(), filtersMenu=false">
              <v-icon left>mdi-filter-off</v-icon> Reset all filters
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn small class="mb-4 mr-4" color="primary" @click="addNewTab(), filtersMenu=false">
              <v-icon left>mdi-tab-plus</v-icon> New tab
            </v-btn>
            
            <v-btn small class="mr-4 mb-4" color="primary" @click="applyAllFilters(), filtersMenu=false">
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
            <v-icon v-if="$store.state.Tags.filters.favorite">mdi-heart</v-icon>
            <v-icon v-else>mdi-heart-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="$store.state.Tags.filters.favorite">Show all</span>
        <span v-else>Show favorites</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
            <v-icon v-if="$store.state.Tags.filters.bookmark">mdi-bookmark</v-icon>
            <v-icon v-else>mdi-bookmark-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="$store.state.Tags.filters.bookmark">Show all</span>
        <span v-else>Show bookmarks</span>
      </v-tooltip>

      <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs"  v-on="on" icon tile>
            <v-badge :content="tagsSort" overlap bottom class="badge-sort">
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
          <v-btn icon tile @click="selectAllTags" v-on="on">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
        </template>
        <span>Select all tags</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="openRandomTag" icon tile v-on="on"> 
              <v-icon>mdi-dice-5</v-icon>
          </v-btn>
        </template>
        <span>Open random tag</span>
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
	</div>
</template>


<script>
const shortid = require('shortid')

export default {
  name: 'TagsAppbar',
  components: {
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
    duplicateTags: "",
    newTags: "",
    tagName: "",
    filtersMenu: false,
    filterCategoryLogicIcon: 'mdi-math-norm',
    categories: ['performer', 'video'],
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredTagsTotal
      return total !== this.$store.getters.tagsTotal
    },
    filteredTagsTotal() {
      return this.$store.getters.filteredTagsTotal
    },
    tagsSort() {
      let sort = this.$store.state.Tags.filters.sortBy
      return sort.charAt(0) + sort.charAt(1) + sort.charAt(2) + '.'
    },
    sortButtons: {
      get() {
        return this.$store.state.Tags.filters.sortBy
      },
      set(value) {
        this.updateFiltersOfTags('sortBy', value)
      },
    },
    sortDirection() {
      return this.$store.state.Tags.filters.sortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
    isAltNamesHidden: {
      get () {
        return this.$store.state.Tags.tagAltNamesHidden
      },
      set (value) {
        this.$store.dispatch('updateTagAltNamesHidden', value)
      },
    },
    isPerformersHidden: {
      get () {
        return this.$store.state.Tags.tagPerformersHidden
      },
      set (value) {
        this.$store.dispatch('updateTagPerformersHidden', value)
      },
    },
    isEditBtnHidden: {
      get () {
        return this.$store.state.Tags.tagEditBtnHidden
      },
      set (value) {
        this.$store.dispatch('updateTagEditBtnHidden', value)
      },
    },
  },
  methods: {
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
    async pasteName() {
      let text = await navigator.clipboard.readText()
      let name = this.$store.state.Tags.filters.name
      if (name) {
        text = name + text
      }
      this.updateFiltersOfTags('name', text)
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
            favorite: false,
            videos: 0,
            performers: [],
            websites: [],
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
    changeFilterCategoryLogic() {
      let logic = this.$store.state.Tags.filters.categoryLogic
      this.filterCategoryLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
      this.$store.state.Tags.filters.categoryLogic = !logic
      this.updateTabFilters()
    },
    updateFiltersOfTags(key, value){
      this.$store.commit('updateFiltersOfTags', {key, value})
      this.updateTabFilters()
    },
    updateTabFilters() {
      let newFilters = _.cloneDeep(this.$store.state.Tags.filters)
      if (this.tabId === 'default') {
        this.$store.state.Tags.filtersReserved = newFilters
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.tagsFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    resetAllFilters(event) {
      this.$store.commit('resetFilteredTags')
      this.$store.dispatch('filterTags')
      this.updateTabFilters()
    },
    addNewTab() {
      let tabId = shortid.generate()
      let tab = { 
        name: this.$store.getters.tagsFilters, 
        link: `/tags/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Tags.filters),
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    applyAllFilters(event) {
      this.$store.dispatch('filterTags')
      this.updateTabFilters()
    },
    toggleFavorites() {
      this.updateFiltersOfTags('favorite', !this.$store.state.Tags.filters.favorite)
      this.$store.dispatch('filterTags')
    },
    toggleBookmarks() {
      this.updateFiltersOfTags('bookmark', !this.$store.state.Tags.filters.bookmark)
      this.$store.dispatch('filterTags')
    },
    toggleSortDirection() {
      let dir = this.sortDirection === 'asc' ? 'desc' : 'asc'
      this.updateFiltersOfTags('sortDirection', dir)
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
    openRandomTag() {
      const rand = this.getRandomIntInclusive(1, this.$store.getters.tagsTotal)
      const tagId = this.$store.getters.tags.value()[rand].id
      this.openTagPage(tagId)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    openTagPage(tagId) {
      this.$router.push(`/tag/:${tagId}?tabId=default`)
    },
  },
  watch: {
  },
}
</script>