<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">

    <div class="headline text-h3 d-flex align-center justify-center my-4">
      <v-icon x-large left>mdi-video-outline</v-icon> Videos
      <span class="text-h5 ml-2">({{numberFilteredVideos}})</span>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start py-0">
      <FiltersChips :filters="filters" type="Video" />
    </v-container>

    <v-container fluid v-if="numberFilteredVideos" class="pagination-container my-4">
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
    
    <div v-if="totalVideos==0" class="text-center">
      <div><v-icon size="100" class="ma-10">mdi-video</v-icon></div>
      It's so empty... maybe add some videos
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on">mdi-help-circle-outline</v-icon>
        </template>
        <span>Click on the icon <v-icon dark>mdi-video-plus</v-icon> in the upper left corner, on appbar</span>
      </v-tooltip>
    </div>
    
    
    <div v-if="numberFilteredVideos==0&&totalVideos>0" class="text-center"> 
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching videos for the selected filters
    </div>

    <v-container fluid class="card-grid wide-image" :class="[cardSize, gapSize]">
      <!-- Video Blocks parsing -->
      <VideoCard v-for="(video, i) in videosOnPage" :key="video.id" :video="video" :i="i" :reg="reg"/>
    </v-container>

    <v-pagination
      v-if="numberFilteredVideos" class="my-10"
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
import Keys from '@/mixins/Keys'

export default {
  name: 'Videos',
  components: {
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
    FiltersChips: () => import('@/components/elements/FiltersChips.vue'),
  },
  mixins: [VideosGrid,Keys],
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
    })
  },
  data: () => ({
    isScrollToTopVisible: false,
  }),
  computed: {
    cardSize() { return `card-size-${this.$store.state.Settings.videoCardSize}` },
    gapSize() { return `gap-size-${this.$store.state.Settings.gapSize}` },
    tabId() { return this.$route.query.tabId },
    tab() {
      if (this.tabId === 'default') return undefined
      else return this.$store.getters.tabsDb.find({id: +this.tabId}).value()  
    },
    filters() { return this.$store.state.Settings.videoFilters },
    numberFilteredVideos() { return this.$store.state.Videos.filteredVideos.length },
    totalVideos() { return this.$store.getters.videos.value().length },
  },
  methods: {
    scrollToTop() { this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad") },
    handleScroll(vertical) {
      if (vertical.scrollTop > 150) this.isScrollToTopVisible = true 
      else this.isScrollToTopVisible = false
    },
    initFilters() {
      let newFilters
      if (this.tabId === 'default' || typeof this.tab.filters === 'undefined') {
        newFilters = _.cloneDeep(this.$store.getters.settings.get('videoFilters').value())
        this.$store.state.Settings.videoSortBy = this.$store.getters.settings.get('videoSortBy').value()
        this.$store.state.Settings.videoSortDirection = this.$store.getters.settings.get('videoSortDirection').value()
        this.$store.state.Settings.videoPage = this.$store.getters.settings.get('videoPage').value()
      } else {
        newFilters = _.cloneDeep(this.tab.filters)
        this.$store.state.Settings.videoSortBy = this.tab.sortBy
        this.$store.state.Settings.videoSortDirection = this.tab.sortDirection
        this.$store.state.Settings.videoPage = this.tab.page
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