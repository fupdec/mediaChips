<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">

    <div class="headline text-h3 text-center my-6">Videos</div>

    <v-container fluid v-if="!$store.state.Videos.filteredEmpty" class="pagination-container my-6">
      <v-overflow-btn v-model="videosPerPage" hint="items per page" persistent-hint
        :items="videosPerPagePreset" dense height="36" solo disable-lookup hide-no-data
        class="items-per-page-dropdown"
      ></v-overflow-btn>
      <v-spacer></v-spacer>
      <v-pagination 
        v-model="videosCurrentPage"
        :length="videosPagesSum"
        :total-visible="getNumberOfPagesLimit"
      ></v-pagination>
      <v-spacer></v-spacer>
      <v-overflow-btn v-if="videosPagesSum > 5"
        v-model="videosCurrentPage" :items="pages" dense height="36" solo
        class="items-per-page-dropdown jump-to-page-menu"
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
    
    <div v-if="$store.state.Videos.filteredEmpty" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching videos for the selected filters.
    </div>

    <Loading />

    <v-container fluid class="videos-grid" :class="[cardSize, gapSize]">
      <!-- Video Blocks parsing -->
      <VideoCard v-for="(video) in videosOnPage" :key="video.id" :video="video"/>
    </v-container>

    <v-pagination
      v-if="!$store.state.Videos.filteredEmpty" class="my-10"
      v-model="videosCurrentPage"
      :length="videosPagesSum"
      :total-visible="getNumberOfPagesLimit"
    ></v-pagination>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>

    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </vuescroll>
</template>


<script>
import VideosGrid from '@/mixins/VideosGrid'
import vuescroll from 'vuescroll'

export default {
  name: 'Videos',
  components: {
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mixins: [VideosGrid],
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
    })
  },
  data: () => ({
    isScrollToTopVisible: false,
  }),
  computed: {
    cardSize() {
      return `card-size-${this.$store.state.Settings.videoCardSize}`
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    tabId() {
      return this.$route.query.tabId
    },
    tabFilters() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id:this.tabId}).value().filters    
      }
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
      if (this.tabId === 'default' || typeof this.tabFilters === 'undefined') {
        // const presetDefault = this.$store.state.Settings.videosFiltersPresetDefault
        // const presetLoaded = this.$store.state.Bookmarks.videosDefaultPresetLoaded
        // if (presetDefault && !presetLoaded) {
        //   const presets = this.$store.state.Bookmarks.filtersPresets.videos
        //   const presetFilters = _.find(presets, {default: true}).filters
        //   newFilters = _.cloneDeep(presetFilters)
        //   this.$store.state.Bookmarks.videosDefaultPresetLoaded = true
        // } else {
          // TODO: create function for saving filters in separated database
        //   }
        newFilters = _.cloneDeep(this.$store.getters.settings.get('videoFilters').value())
      } else {
        newFilters = _.cloneDeep(this.tabFilters)
      }
      this.$store.state.Settings.videoFilters = newFilters
      this.$store.dispatch('filterVideos', true)
    },
  },
  watch: {
    $route(newRoute) {
      if (!this.$route.path.includes('/videos/:')) return
      this.initFilters()
    },
  }
}
</script>