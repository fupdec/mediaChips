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
    <v-bottom-sheet 
      v-if="$store.getters.getSelectedPerformers.length==1 && $store.state.Settings.navigationSide!=2" 
      v-model="$store.state.Performers.bottomSheet" 
      hide-overlay inset no-click-animation persistent
    >
      <v-sheet class="bottom-profle">
        <v-container fluid class="py-0">
          <v-row>
            <v-col cols="12" md="4">
              <div>Category: <i>{{performer.category.join(', ')}}</i></div>
              <div>Career: <i>{{performer.start}} - {{performer.end}}</i></div>
              <div>Birth (age): <i>{{getAge(performer.birthday)}}</i></div>
            </v-col>
            <v-col cols="12" md="4">
              <div>Ethnicity: <i>{{performer.ethnicity.join(', ')}}</i></div>
              <div>Hair color: <i>{{performer.hair.join(', ')}}</i></div>
              <div>Eyes color: <i>{{performer.eyes.join(', ')}}</i></div>
            </v-col>
            <v-col cols="12" md="4">
              <span class="mr-2">Height: <i>{{performer.height}}</i></span>
              <span>Weight: <i>{{performer.weight}}</i></span><br>
              <span class="mr-2">Bra: <i>{{performer.bra}}</i></span>
              <span class="mr-2">Waist: <i>{{performer.waist}}</i></span>
              <span>Hip: <i>{{performer.hip}}</i></span><br>
              <span class="mr-2">Cups: <i>{{performer.cups.join(', ')}}</i></span>
              <span>Boobs: <i>{{performer.boobs.join(', ')}}</i></span>
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
    performer() {
      const id = this.$store.getters.getSelectedPerformers[0]
      return this.$store.getters.performers.find({id: id}).value()
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
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
      } else {
        newFilters = _.cloneDeep(this.filtersTab)
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