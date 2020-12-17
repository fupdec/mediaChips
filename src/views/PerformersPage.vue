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

    <div class="headline text-h3 text-center my-6">Performers</div>

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

    <v-container fluid class="performers-grid" :class="cardSize">
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
    
    <div v-show="$store.getters.navigationSide=='0'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
    
    <PerformersGridElements />
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
    filtersTab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id:this.tabId}).value().filters    
      }
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
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
      if (this.tabId === 'default' || typeof this.filtersTab === 'undefined') {
        const presetDefault = this.$store.state.Settings.performersFiltersPresetDefault
        const presetLoaded = this.$store.state.Bookmarks.performersDefaultPresetLoaded
        if (presetDefault && !presetLoaded) {
          const presets = this.$store.state.Bookmarks.filtersPresets.performers
          const presetFilters = _.find(presets, {default: true}).filters
          newFilters = _.cloneDeep(presetFilters)
          this.$store.state.Bookmarks.performersDefaultPresetLoaded = true
        } else {
          newFilters = _.cloneDeep(this.$store.state.Performers.filtersReserved)
        }
      } else {
        newFilters = _.cloneDeep(this.filtersTab)
      }
      this.$store.state.Performers.filters = newFilters
      this.$store.dispatch('filterPerformers')
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/performers/:')) return
      this.initFilters()
    },
  }
}
</script>