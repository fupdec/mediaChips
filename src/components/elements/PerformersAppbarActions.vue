<template>
	<div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Performers.dialogFilterPerformers=true" v-on="on" icon tile>
          <v-badge :value="filterBadge" :content="filteredPerformersTotal" 
            overlap bottom :dot="filteredPerformersTotal==0" style="z-index: 5;"> 
          <v-icon>mdi-filter</v-icon> </v-badge>
        </v-btn>
      </template>
      <span>Filter performers</span>
    </v-tooltip>

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
          <v-icon v-if="$store.state.Performers.showFavorites">mdi-heart</v-icon>
          <v-icon v-else>mdi-heart-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.showFavorites">Show all</span>
      <span v-else>Show favorites</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleBookmarks" icon tile v-on="on"> 
          <v-icon v-if="$store.state.Performers.showBookmarks">mdi-bookmark</v-icon>
          <v-icon v-else>mdi-bookmark-outline</v-icon>
        </v-btn>
      </template>
      <span v-if="$store.state.Performers.showBookmarks">Show all</span>
      <span v-else>Show bookmarks</span>
    </v-tooltip>
    
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs"  v-on="on" icon tile>
          <v-badge :content="performersSort" overlap bottom class="badge-sort">
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
            <span>Sort by Name</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="rating" v-on="on">
                <v-icon>mdi-star-outline</v-icon>
                <v-icon right size="14" v-if="sortButtons==='rating' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='rating' && sortDirection==='asc'">
                  mdi-arrow-up-thick
                </v-icon>
              </v-btn>
            </template>
            <span>Sort by Rating</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn outlined @click="toggleSortDirection" value="date" v-on="on">
                <v-icon>mdi-calendar-plus</v-icon>
                <v-icon right size="14" v-if="sortButtons==='date' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='date' && sortDirection==='asc'">
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
                <v-icon right size="14" v-if="sortButtons==='edit' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='edit' && sortDirection==='asc'">
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
                <v-icon right size="14" v-if="sortButtons==='videos' && sortDirection==='desc'">
                  mdi-arrow-down-thick
                </v-icon>
                <v-icon right size="14" v-if="sortButtons==='videos' && sortDirection==='asc'">
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
        <v-btn icon tile @click="selectAllPerformers" v-on="on">
          <v-icon>mdi-select-all</v-icon>
        </v-btn>
      </template>
      <span>Select all performers</span>
    </v-tooltip>

    <FiltersPresets v-if="$store.state.Bookmarks.dialogFiltersPresets" typeOfPresets="performers"/>
    <DialogFilterPerformers v-if="$store.state.Performers.dialogFilterPerformers"/>
	</div>
</template>


<script>
// const shortid = require("shortid")

// import FilterPerformers from '@/mixins/FilterPerformers'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'PerformersAppbarActions',
  components: {
    FiltersPresets: () => import('@/components/elements/FiltersPresets.vue'),
    DialogFilterPerformers: () => import('@/components/pages/performers/DialogFilterPerformers.vue'),
  },
  mixins: [
    // FilterPerformers, TODO check and delete file
    ShowImageFunction
  ], 
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    // filtersMenu: false,
    // filterCategoryLogicIcon: 'mdi-math-norm',
    // filterTagsLogicIcon: 'mdi-math-norm',
    // filterEthnicityLogicIcon: 'mdi-math-norm',
    // filterHairLogicIcon: 'mdi-math-norm',
    // filterEyesLogicIcon: 'mdi-math-norm',
    // filterBodyLogicIcon: 'mdi-math-norm',
    // filterPussyHairLogicIcon: 'mdi-math-norm',
  }),
  computed: {
    filterBadge() {
      let total = this.$store.getters.filteredPerformersTotal
      return total !== this.$store.getters.performersTotal
    },
    filteredPerformersTotal() {
      return this.$store.getters.filteredPerformersTotal
    },
    performersSort() {
      let sort = this.$store.state.Performers.sortBy
      return sort.charAt(0) + sort.charAt(1) + sort.charAt(2) + '.'
    },
    // categoriesList() {
    //   let cats = _.cloneDeep(this.$store.state.Settings.performerInfoCategory)
    //   cats.push('None')
    //   return cats
    // },
    // countriesList() {
    //   let countries = this.countries
    //   countries.unshift({name: 'None', code: ''})
    //   return countries
    // },
    // ethnicList() {
    //   let ethnic = _.cloneDeep(this.$store.state.Settings.performerInfoEthnicity)
    //   ethnic.push('None')
    //   return ethnic
    // },
    // hairList() {
    //   let hair = _.cloneDeep(this.$store.state.Settings.performerInfoHair)
    //   hair.push('None')
    //   return hair
    // },
    // eyesList() {
    //   let eyes = _.cloneDeep(this.$store.state.Settings.performerInfoEyes)
    //   eyes.push('None')
    //   return eyes
    // },
    // cupsList() {
    //   let cups = _.cloneDeep(this.$store.state.Settings.performerInfoCups)
    //   cups.push('None')
    //   return cups
    // },
    // boobsList() {
    //   let boobs = _.cloneDeep(this.$store.state.Settings.performerInfoBoobs)
    //   boobs.push('None')
    //   return boobs
    // },
    // bodyList() {
    //   let body = _.cloneDeep(this.$store.state.Settings.performerInfoBody)
    //   body.push('None')
    //   return body
    // },
    // pussyList() {
    //   let pussy = _.cloneDeep(this.$store.state.Settings.performerInfoPussy)
    //   pussy.push('None')
    //   return pussy
    // },
    // pussyLipsList() {
    //   let lips = _.cloneDeep(this.$store.state.Settings.performerInfoPussyLips)
    //   lips.push('None')
    //   return lips
    // },
    // pussyHairList() {
    //   let hair = _.cloneDeep(this.$store.state.Settings.performerInfoPussyHair)
    //   hair.push('None')
    //   return hair
    // },
    sortButtons: {
      get() {
        return this.$store.state.Performers.sortBy
      },
      set(value) {
        this.$store.state.Performers.sortBy = value
      },
    },
    sortDirection() {
      return this.$store.state.Performers.sortDirection
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    async pasteName() {
      let text = await navigator.clipboard.readText()
      let name = this.$store.state.Performers.filters.name
      if (name) {
        text = name + text
      }
      // this.updateFiltersOfPerformers('name', text)
    },
    async pasteTags() {
      let text = await navigator.clipboard.readText()
      let tags = text.split(', ')
      tags = this.$store.getters.tags.filter(t => (
        t.category.includes('performer') && tags.includes(t.name)
      )).value()
      tags = tags.map(t=>{return t.name})
      if (tags.length) {
        // this.updateFiltersOfPerformers('tags', tags)
      }
    },
    // changeFilterTagsLogic() {
    //   let logic = this.$store.state.Performers.filters.tagsLogic
    //   this.filterTagsLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('tagsLogic', !logic)
    // },
    // changeFilterCategoryLogic() {
    //   let logic = this.$store.state.Performers.filters.categoryLogic
    //   this.filterCategoryLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('categoryLogic', !logic)
    // },
    // changeFilterEthnicityLogic() {
    //   let logic = this.$store.state.Performers.filters.ethnicityLogic
    //   this.filterEthnicityLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('ethnicityLogic', !logic)
    // },
    // changeFilterHairLogic() {
    //   let logic = this.$store.state.Performers.filters.hairLogic
    //   this.filterHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('hairLogic', !logic)
    // },
    // changeFilterEyesLogic() {
    //   let logic = this.$store.state.Performers.filters.eyesLogic
    //   this.filterEyesLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('eyesLogic', !logic)
    // },
    // changeFilterBodyLogic() {
    //   let logic = this.$store.state.Performers.filters.bodyLogic
    //   this.filterBodyLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('bodyLogic', !logic)
    // },
    // changeFilterPussyHairLogic() {
    //   let logic = this.$store.state.Performers.filters.pussyHairLogic
    //   this.filterPussyHairLogicIcon = logic ? 'mdi-math-norm' : 'mdi-ampersand' 
    //   this.updateFiltersOfPerformers('pussyHairLogic', !logic)
    // },
    // addNewTab() {
    //   let tabId = shortid.generate()
    //   let tab = { 
    //     name: this.$store.getters.performersFilters, 
    //     link: `/performers/:${tabId}?tabId=${tabId}`,
    //     id: tabId,
    //     filters: _.cloneDeep(this.$store.state.Performers.filters),
    //     icon: 'account-outline'
    //   }
    //   this.$store.dispatch('addNewTab', tab)
    // },
    // removeTag(item) { 
    //   const index = this.$store.state.Performers.filters.tags.indexOf(item.name)
    //   if (index >= 0) this.$store.state.Performers.filters.tags.splice(index, 1)
    //   this.$store.state.hoveredImage = false
    // },
    // removeCountry(item) { 
    //   const index = this.$store.state.Performers.filters.nation.indexOf(item.name)
    //   if (index >= 0) this.$store.state.Performers.filters.nation.splice(index, 1)
    //   this.$store.state.hoveredImage = false
    // },
    resetAllFilters() {
      this.$store.state.Settings.performerFilters = [{
        param: null,
        cond: null,
        val: null,
        type: null,
        flag: null,
        lock: false,
      }]
      this.$store.dispatch('filterPerformers')

      let newFilters = _.cloneDeep(this.$store.state.Settings.performerFilters)

      if (this.tabId === 'default') { // for performers page (not for tab)
        this.$store.getters.settings.set('performerFilters', newFilters).write()
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.performerFiltersForTabName,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    toggleFavorites() {
      this.$store.state.Performers.showFavorites = !this.$store.state.Performers.showFavorites
      this.$store.dispatch('filterPerformers')
    },
    toggleBookmarks() {
      this.$store.state.Performers.showBookmarks = !this.$store.state.Performers.showBookmarks
      this.$store.dispatch('filterPerformers')
    },
    // updateFiltersOfPerformers(key, value){
    //   this.$store.commit('updateFiltersOfPerformers', {key, value})
    //   this.updateFiltersOfPerformersTab()
    // },
    toggleSortDirection() {
      this.$store.state.Performers.sortDirection = this.sortDirection==='asc' ? 'desc':'asc'
      setTimeout(()=>{
        this.$store.dispatch('filterPerformers')
      },200)
    },
    selectAllPerformers() {
      this.$store.state.Performers.selection.clearSelection()
      let selected = this.$store.state.Performers.selection.select('.performer-card')
      this.$store.state.Performers.selection.keepSelection()
      this.getSelectedPerformers(selected)
      for (let i=0;i<selected.length;++i) {
        selected[i].classList.add("selected")
      }
    },
    getSelectedPerformers(selectedPerformers){
      let ids = selectedPerformers.map(item => (item.dataset.id))
      this.$store.commit('updateSelectedPerformers', ids)
    },
  },
}
</script>