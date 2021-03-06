<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <v-toolbar dense>
      <v-spacer></v-spacer>
      <v-btn-toggle v-model="chars" group multiple color="primary">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="27" v-on="on">#</v-btn>
          </template>
          <span>Symbol</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small class="ma-0" :value="0" v-on="on">0-9</v-btn>
          </template>
          <span>Number</span>
        </v-tooltip>
        <v-btn v-for="(char,i) in alphabet" :key="i" icon small class="ma-0" :value="i+1">
          {{char}}
        </v-btn>
      </v-btn-toggle>
      <v-tooltip bottom v-if="chars.length">
        <template v-slot:activator="{ on }">
          <v-btn @click="clearChars" icon small tile class="ml-2" v-on="on">
            <v-icon size="20">mdi-alphabetical-variant-off</v-icon>
          </v-btn>
        </template>
        <span>Clear all characters</span>
      </v-tooltip>
      <v-spacer></v-spacer>
    </v-toolbar>

    <div class="headline text-h3 text-center my-6"> Performers
      <span class="text-h5">({{$store.getters.filteredPerformersTotal}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start mt-10">
      <v-icon left>mdi-filter</v-icon>
      <v-chip v-for="(filter, i) in filters" :key="i" class="mr-2 mb-2" color="primary" 
        small close :disabled="filter.lock" @click:close="removeFilter(i)">
        {{filter.param}} {{filter.cond}} 
        <span v-if="filter.type=='array'" class="ml-1">{{filter.val.join(', ')}}</span>
        <span v-else class="ml-1">{{filter.val}}</span>
      </v-chip>
    </v-container>

    <v-container fluid v-if="!$store.state.Performers.filteredEmpty" 
      class="pagination-container mb-6">
      <v-overflow-btn v-model="performersPerPage" hint="items per page" persistent-hint
        :items="performersPerPagePreset" dense height="36" solo disable-lookup hide-no-data
        class="items-per-page-dropdown"
      ></v-overflow-btn>
      <v-spacer></v-spacer>
      <v-pagination
        v-model="performersCurrentPage"
        :length="performersPagesSum"
        :total-visible="getNumberOfPagesLimit"
      ></v-pagination>
      <v-spacer></v-spacer>
      <v-overflow-btn v-if="performersPagesSum > 5"
        v-model="performersCurrentPage" :items="pages" dense height="36" solo
        class="items-per-page-dropdown width-70 jump-to-page-menu" 
        disable-lookup hint="jump to page" persistent-hint hide-no-data
        :menu-props="{ 
          auto:true, 
          contentClass:'jump-to-page-menu',
          nudgeBottom: -118,
          origin:'center center', 
          transition:'scale-transition'
        }"
      ></v-overflow-btn>
      <div v-else style="min-width:80px;"></div>
    </v-container>
      
    <div v-if="$store.state.Performers.filteredEmpty" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching performers for the selected filters.
    </div>

    <Loading />

    <v-container fluid class="performers-grid" :class="[cardSize, gapSize]">
      <PerformerCard v-for="(performer) in performersOnPage" 
        :key="performer.id"
        :performer="performer" 
      />
    </v-container>

    <v-pagination
      v-if="!$store.state.Performers.filteredEmpty"
      v-model="performersCurrentPage"
      :length="performersPagesSum" :total-visible="getNumberOfPagesLimit"
      class="pt-10 pb-16"
    ></v-pagination>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    
    <PerformersGridElements />

<!-- TODO make correct display bottom sheet with bottom sidebar -->
    <v-bottom-sheet v-if="bottomProfile" 
      v-model="$store.state.Performers.bottomSheet" 
      hide-overlay inset no-click-animation persistent
    >
      <v-sheet class="bottom-profle">
        <v-container fluid class="pt-0">
          <v-row>
            <v-col cols="4" class="pb-0">
              <div>Category: <b>{{performer.category.join(', ')}}</b></div>
              <div>Career: <b>{{performer.start}} - {{performer.end}}</b></div>
              <div>Birth (age): <b>{{getAge(performer.birthday)}}</b></div>
            </v-col>
            <v-col cols="4" class="pb-0">
              <div>Ethnicity: <b>{{performer.ethnicity.join(', ')}}</b></div>
              <div>Hair color: <b>{{performer.hair.join(', ')}}</b></div>
              <div>Eyes color: <b>{{performer.eyes.join(', ')}}</b></div>
            </v-col>
            <v-col cols="4" class="pb-0">
              <span class="mr-2">Height: <b>{{performer.height}}</b></span>
              <span>Weight: <b>{{performer.weight}}</b></span><br>
              <span class="mr-2">Bra: <b>{{performer.bra}}</b></span>
              <span class="mr-2">Waist: <b>{{performer.waist}}</b></span>
              <span>Hip: <b>{{performer.hip}}</b></span><br>
              <span class="mr-2">Cups: <b>{{performer.cups.join(', ')}}</b></span>
              <span>Boobs: <b>{{performer.boobs.join(', ')}}</b></span>
            </v-col>
            <v-col v-for="param in params" :key="param.name" cols="4" class="py-0">
              {{param.name}}: <b>{{getCustomParamValue(param.name, param.type)}}</b>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </v-bottom-sheet>
  </vuescroll>
</template>


<script>
import PerformersGrid from '@/mixins/PerformersGrid'
import PerformersGridElements from '@/components/elements/PerformersGridElements.vue'
import vuescroll from 'vuescroll'

export default {
  name: "Performers",
  components: {
    DialogEditPerformerInfo: () => import('@/components/pages/performers/DialogEditPerformerInfo.vue'),
    PerformersGridElements,
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mixins: [PerformersGrid],
  mounted () {
    this.$nextTick(function () {
      this.initFilters()
    })
  },
  data: () => ({
    isScrollToTopVisible: false,
  }),
  computed: {
    tab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id: +this.tabId}).value()    
      }
    },
    tabId() {
      return this.$route.query.tabId
    },
    performer() {
      const id = this.$store.getters.getSelectedPerformers[0]
      return this.$store.getters.performers.find({id: id}).value()
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    params() {
      return this.$store.state.Settings.customParametersPerformer
    },
    bottomProfile() {
      let selectedSingle = this.$store.getters.getSelectedPerformers.length == 1
      let bottomProfile = !this.$store.state.Settings.performerBottomProfileHidden
      let notBottomNavigation = this.$store.state.Settings.navigationSide != 2
      return selectedSingle && bottomProfile && notBottomNavigation
    },
    filters() {
      return this.$store.state.Settings.performerFilters
    },
  },
  methods: {
    removeFilter(i) {
      this.filters.splice(i, 1)
      this.$store.dispatch('filterPerformers')
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    initFilters() {
      let newFilters
      if (this.tabId === 'default' || typeof this.tab.filters === 'undefined') {
        // const presetDefault = this.$store.state.Settings.performersFiltersPresetDefault
        // const presetLoaded = this.$store.state.Bookmarks.performersDefaultPresetLoaded
        // if (presetDefault && !presetLoaded) {
        //   const presets = this.$store.state.Bookmarks.filtersPresets.performers
        //   const presetFilters = _.find(presets, {default: true}).filters
        //   newFilters = _.cloneDeep(presetFilters)
        //   this.$store.state.Bookmarks.performersDefaultPresetLoaded = true
        // } else {
        //   newFilters = _.cloneDeep(this.$store.state.Performers.filtersReserved)
          // TODO create function for saving filters in separated database
        // }
        newFilters = _.cloneDeep(this.$store.getters.settings.get('performerFilters').value())
        this.$store.state.Settings.performerSortBy = this.$store.getters.settings.get('performerSortBy').value()
        this.$store.state.Settings.performerSortDirection = this.$store.getters.settings.get('performerSortDirection').value()
        this.$store.state.Settings.performerPage = this.$store.getters.settings.get('performerPage').value()
        this.$store.state.Settings.performerFirstChar = this.$store.getters.settings.get('performerFirstChar').value()
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Settings.performerSortBy = this.tab.sortBy || 'name'
        this.$store.state.Settings.performerSortDirection = this.tab.sortDirection || 'asc'
        this.$store.state.Settings.performerPage = this.tab.page || 1
        this.$store.state.Settings.performerFirstChar = this.tab.firstChar || []
      }
      this.$store.state.Settings.performerFilters = newFilters
      this.$store.dispatch('filterPerformers', true)
    },
    getAge(birthday) {
      let age
      if(birthday) {
        age = birthday.match(/\d{4}/)[0]
        age = `${age} (${new Date().getFullYear() - age})`
      } else { age = '' }
      return age
    },
    getCustomParamValue(name, type) {
      if (type == 'array') {
        if (this.performer[name].length) {
          return this.performer[name].join(', ')
        } else return ''
      } else if (type == 'boolean') {
        if (this.performer[name]) {
          return 'Yes'
        } else return 'No'
      } else {
        if (this.performer[name].length) {
          return this.performer[name]
        } else return ''
      }
    },
  },
  watch: {
    $route() {
      if (!this.$route.path.includes('/performers/:')) return
      this.initFilters()
    },
  }
}
</script>


<style lang="less">
.bottom-profle {
  font-size: 12px;
  margin-bottom: 20px;
}
</style>