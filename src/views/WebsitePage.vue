<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="website-header-wrapper">
      <div class="all-thumbs-website">
        <v-img v-for="(imgUrl, i) in videoThumbImgUrls" :key="i" 
          :src="imgUrl" :aspect-ratio="16/9" width="20%" />
      </div>
      <div class="website-header" >
        <div class="gradient" :style="gradient"></div>
        <div class="background" :style="headerColor"></div>
        <div class="website-logo">
          <v-img :src="getImgUrl(websiteId)" max-width="300" class="ma-3 logo">
            <div v-if="website.favorite" class="favorite">
              <v-icon color="white">mdi-heart</v-icon>
            </div>
          </v-img>
          <div class="mx-3">
            <v-chip label outlined class="mb-2 d-flex">
              <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
            </v-chip>
            <v-chip label outlined class="mb-2 d-flex">
              <v-icon left size="20">mdi-calendar-edit</v-icon> Last Edit: {{dateEdit}}
            </v-chip>
            <v-chip label outlined class="d-flex">
              <v-icon left size="20">mdi-eye</v-icon>Number of Views: {{website.views}}
            </v-chip>
          </div>
        </div>
        <div class="website-info">
          <div class="text-h2 pa-4 website-name">
            <v-tooltip v-if="website.network" bottom>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on" large class="mb-2 mr-4">mdi-wan</v-icon>
              </template>
              <span>Network</span>
            </v-tooltip>
            <v-tooltip v-if="childWebsite" bottom>
              <template v-slot:activator="{ on }">
                <v-icon v-on="on" large class="mb-2 mr-4">mdi-lan</v-icon>
              </template>
              <span>Child Website</span>
            </v-tooltip>
            <span>{{website.name}}</span> 
            <v-tooltip v-if="website.url" bottom>
              <template v-slot:activator="{ on }">
                <v-btn @click="openLink" v-on="on" large icon class="ma-2">
                  <v-icon>mdi-link-variant</v-icon>
                </v-btn>
              </template>
              <span>Open Website in Browser<br>URL: {{website.url}}</span>
            </v-tooltip>
            <span v-if="childWebsite" class="ml-2 body-2">is a child of</span>
          </div>
          
          <div v-if="childWebsite" class="px-4 mb-6">
            <v-card @click.middle="addNewTabWebsite(childWebsite)" :to="websiteLink(childWebsite)"
              class="network-card" hover>
              <v-img :src="getImgUrl(getWebsiteId(childWebsite))" aspect-ratio="3"/>
              <v-card-title>
                <v-icon small left>mdi-wan</v-icon>
                  {{ childWebsite }}
                </v-card-title>
            </v-card>
          </div>
          
          <div v-if="website.network && website.childWebsites.length" class="child-websites px-4">
            <div class="mb-2">Child websites</div>
            <div class="grid mb-4">
              <v-card v-for="child in website.childWebsites" :key="child" class="child-card" hover 
                :to="websiteLink(child)" @click.middle="addNewTabWebsite(child)">
                <v-img :src="getImgUrl(getWebsiteId(child))" aspect-ratio="1.5"/>
                <v-card-title>{{ child }}</v-card-title>
              </v-card>
            </div>
          </div>
          <div v-if="performersOfWebsite.length" class="px-4 performers-title">
            <span>Performers of website </span>
            <v-btn v-if="activePerformers.length" @click="showAllPerformers" 
              x-small rounded class="mx-4">
              <v-icon left>mdi-eye-outline</v-icon> Show all
            </v-btn>
          </div>
          <v-chip-group v-model="activePerformers" active-class="active-chip" 
            multiple column class="px-4 pt-2 chips-performers">
            <v-chip v-for="performer in performersOfWebsite" :key="performer"
              outlined small class="mr-1 mb-1 px-2"
              @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
              @mouseleave.stop="$store.state.hoveredImage=false"
              @click="$store.state.hoveredImage=false"
              @click.middle="addNewTabPerformer(performer)"
            > {{ performer }} </v-chip>
          </v-chip-group>
        </div>
      </div>
    </div>
    
    <v-container v-if="filters.length>0" fluid class="d-flex justify-center align-start mt-10">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn @click="removeAllFilters" v-on="on" fab x-small dark color="red" class="mr-4">
            <v-icon>mdi-filter-off</v-icon>
          </v-btn>
        </template>
        <span>Remove All Filters</span>
      </v-tooltip>
      <v-chip v-for="(filter, i) in filters" :key="i" class="ma-1" color="primary"
        small close :disabled="filter.lock" @click:close="removeFilter(i)">
        {{filter.param}} {{filter.cond}} 
        <span v-if="filter.type=='array'" class="ml-1">{{filter.val.join(', ')}}</span>
        <span v-else class="ml-1">{{filter.val}}</span>
      </v-chip>
    </v-container>

    <v-container v-if="!$store.state.Videos.filteredEmpty" fluid class="pagination-container my-6">
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

    <div v-if="$store.state.Videos.filteredEmpty" class="text-center pt-10">
      <div><v-icon size="100" class="ma-10">mdi-close</v-icon></div>
      There are no matching videos for the selected filters.
    </div>

    <Loading />

    <v-container fluid class="videos-grid" :class="[cardSize, gapSize]">
      <!-- Video Blocks parsing -->
      <VideoCard v-for="(video) in videosOnPage" :key="video.id" :video="video"/>
    </v-container>

    <v-pagination class="pt-10 pb-16"
      v-if="!$store.state.Videos.filteredEmpty"
      v-model="videosCurrentPage"
      :length="videosPagesSum"
      :total-visible="getNumberOfPagesLimit"
    ></v-pagination>
    
    <div v-show="$store.state.Settings.navigationSide=='2'" class="py-6"></div>
    
    <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
      class="scroll-to-top" fixed fab color="primary">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>

    <DialogEditWebsite v-if="$store.state.Websites.dialogEditWebsite"/>
  </vuescroll>
</template>


<script>
const fs = require("fs")
const path = require("path")
const shell = require('electron').shell

import VideosGrid from '@/mixins/VideosGrid'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'
import LabelFunctions from '@/mixins/LabelFunctions'

export default {
  name: 'WebsitePage',
  components: {
    vuescroll,
    DialogEditWebsite: () => import("@/components/pages/websites/DialogEditWebsite.vue"),
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mixins: [VideosGrid, ShowImageFunction, LabelFunctions],
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
      this.updateViews()
    })
  },
  data: () => ({
    activePerformers: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    website() {
      return this.$store.getters.websites.find({ id: this.websiteId }).value()    
    },
    websiteId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    videosOnPage() {
      return this.$store.getters.videosOnPage
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.videoCardSize}`
    },
    headerColor() {
      return `background: ${this.website.color}`
    },
    gradient() {
      let color = this.$vuetify.theme.isDark ? '#121212' : '#fff'
      let gradient = `linear-gradient(to top, ${color}, rgba(0,0,0,.0) 35%)`
      return `background: ${gradient}`
    },
    performersOfWebsite() {
      let videos = this.videosOfWebsite.value()
      let performers = []
      for (let i=0; i<videos.length; i++) {
        for (let p=0; p<videos[i].performers.length; p++) {
          performers.push(videos[i].performers[p])
        }
      }
      let performersUnique = [...new Set(performers)]
      performersUnique = performersUnique.slice(0,100)
      return performersUnique.sort((a, b) => a.localeCompare(b))
    },
    videosOfWebsite() {
      return this.$store.getters.videos.filter(video=>video.websites.includes(this.website.name))
    },
    videoThumbImgUrls() {
      let imgUrls = this.videosOfWebsite.orderBy('rating',['desc']).take(40).value().map(v=>{
        let imgPath = path.join(this.pathToUserData, `/media/thumbs/${v.id}.jpg`)
        if (fs.existsSync(imgPath)) {
          return 'file://' + imgPath
        } else return ''
      })
      return imgUrls
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    tabId() {
      return this.$route.query.tabId
    },
    tab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id:this.tabId}).value()  
      }
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
    childWebsite() {
      let network = this.$store.getters.websites.filter(web=>
          (web.network&&web.childWebsites.includes(this.website.name))).value()
      if (network.length) {
        network = network[0].name
      } else network = ''
      return network
    },
    dateAdded() {
      let date = new Date(this.website.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.website.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    filters() {
      return this.$store.state.Settings.videoFilters
    },
  },
  methods: {
    removeAllFilters() {
      this.$store.state.Settings.videoFilters = [{
        param: 'websites',
        cond: 'one of',
        val: [this.website.name],
        type: 'array',
        flag: null,
        lock: true,
      },{
        param: 'performers',
        cond: 'one of',
        val: [],
        type: 'array',
        flag: null,
        lock: true,
      }]
      this.activePerformers = []
      this.$store.dispatch('filterVideos')
    },
    removeFilter(i) {
      this.filters.splice(i, 1)
      this.$store.dispatch('filterVideos')
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 500) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    showAllPerformers() {
      this.activePerformers = []
    },
    initFilters() {
      let defaultFilters = [{
        param: 'websites',
        cond: 'one of',
        val: [this.website.name],
        type: 'array',
        flag: null,
        lock: true,
      },{
        param: 'performers',
        cond: 'one of',
        val: this.getFilteredPerformers(),
        type: 'array',
        flag: null,
        lock: true,
      }]
      if (this.tabId === 'default' || typeof this.tab === 'undefined') {
        this.$store.state.Settings.videoFilters = _.cloneDeep(defaultFilters)
        this.$store.state.Settings.videoSortBy = 'name'
        this.$store.state.Settings.videoSortDirection = 'asc'
        this.$store.state.Settings.videoPage = 1
      } else {
        this.$store.state.Settings.videoFilters = _.cloneDeep(this.tab.filters) || _.cloneDeep(defaultFilters)
        this.$store.state.Settings.videoSortBy = this.tab.sortBy || 'name'
        this.$store.state.Settings.videoSortDirection = this.tab.sortDirection || 'asc'
        this.$store.state.Settings.videoPage = this.tab.page || 1
      }
      this.$store.dispatch('filterVideos', true)
    },
    getImgUrl(websiteId) {
      let imgPath = path.join(this.pathToUserData, `/media/websites/${websiteId}_.jpg`)
      return 'file://' + this.checkImageExist(imgPath)
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/website.png')
      }
    },
    getWebsite(itemName) {
      return this.$store.getters.websites.find({name: itemName}).value()
    },
    getFilteredPerformers() {
      let active = this.activePerformers
      let all = this.performersOfWebsite
      let filtered = [] 
      for (let i=0; i<active.length; i++) {
        filtered.push(all[active[i]])
      }
      return filtered
    },
    updateFilters() {
      const defaults = [{
        param: 'websites',
        cond: 'one of',
        val: [this.website.name],
        type: 'array',
        flag: null,
        lock: true,
      },{
        param: 'performers',
        cond: 'one of',
        val: this.getFilteredPerformers(),
        type: 'array',
        flag: null,
        lock: true,
      }]
      const others = _.filter(this.$store.state.Settings.videoFilters, {lock: false})
      this.$store.state.Settings.videoFilters = _.cloneDeep([...defaults, ...others])
      // if (this.tabId !== 'default' || typeof this.tab !== 'undefined') {
      //   this.$store.dispatch('saveFiltersOfVideos', this.$route)
      // }
      this.$store.dispatch('filterVideos')
    },
    updateViews() {
      this.$store.getters.websites.filter({id: this.website.id}).each(i=>{
        i.views = i.views + 1
      }).write()
    },
    openLink() {
      shell.openExternal(this.website.url)
    },
  },
  watch: {
    activePerformers() {
      this.updateFilters()
    },
    $route(newRoute) {
      if (!this.$route.path.includes('/website/:')) return
      this.initFilters()
    },
  }
}
</script>


<style lang="less" scoped>
.child-websites {
  .child-card {
    .v-card__title {
      padding: 0 5px;
      font-size: 10px;
      line-height: 2;
    }
  }
  .grid {
    display: grid;
    grid-gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
.website-header {
  display: flex;
  align-items: flex-start;
  padding-bottom: 100px;
  z-index: 2;
  &-wrapper {
    position: relative;
    overflow: hidden;
  }
  .website-name {
    z-index: 2;
    font-weight: bold;
  }
  .website-logo {
    .favorite {
      position: absolute;
      right: 0;
      top: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 45px 45px 0;
      border-color: transparent rgba(255, 0, 76, 0.8)  transparent transparent;
      .v-icon {
        position: absolute;
        right: -42px;
        top: 2px;
      }
    }
  }
  .website-logo,
  .logo,
  .chips-performers,
  .performers-title {
    z-index: 2;
  }
  .website-info {
    display: flex;
    flex-direction: column;
    z-index: 2;
  }
  .background {
    position: absolute;
    opacity: 0.75;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    pointer-events: none;
  }
  .gradient {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 1;
    pointer-events: none;
  }
  .v-chip.active-chip {
    background: white !important;
    color: #000;
  }
}
.all-thumbs-website {
  display: flex;
  flex-wrap: wrap;
  position: absolute;
  opacity: 0.7;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}
.network-card {
  .v-card__title {
    padding: 0 5px;
    font-size: 14px;
    line-height: 2;
  }
}
</style>