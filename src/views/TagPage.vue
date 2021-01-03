<template>
  <vuescroll ref="mainContainer" @handle-scroll="handleScroll">
    <div class="tag-header-wrapper">
      <div v-if="$store.state.Tags.activeTab===0" class="all-thumbs-videos">
        <v-img v-for="(imgUrl, i) in videoThumbImgUrls" :key="i" 
          :src="imgUrl" :aspect-ratio="16/9" width="20%" />
      </div>
      <div v-if="$store.state.Tags.activeTab===1" class="all-thumbs-performers">
        <v-img v-for="(imgUrl, i) in performerThumbImgUrls" :key="i" 
          :src="imgUrl" :aspect-ratio="5/8" width="15%" />
      </div>
      <div class="tag-header">
        <div class="gradient" :style="gradient"></div>
        <div class="background" :style="headerColor"></div>
        <v-img :src="getImgUrl(tagId)" max-width="300" class="ma-3 logo"/>
        <div class="tag-info">
          <div class="text-h2 pa-4 tag-name"> {{tag.name}} 
            <span v-if="tag.altNames.length" class="alternate-names"> 
              ({{tag.altNames.join(', ')}})
            </span>
          </div>
          <div v-if="$store.state.Tags.activeTab===0" class="chips-tag-wrapper">
            <div class="px-4 performers-title" v-show="performersWithTagInVideos.length"> 
              <span>Performers with tag in videos</span>
              <v-btn v-if="activePerformers.length" @click="showAllPerformers" 
                x-small rounded class="mx-4">
                <v-icon left>mdi-eye-outline</v-icon> Show all
              </v-btn>
            </div>
            <v-chip-group v-model="activePerformers" active-class="active-chip" 
              multiple column class="px-4 pt-2 chips-performers">
              <v-chip v-for="performer in performersWithTagInVideos" :key="performer"
                outlined small class="mr-2 mb-1"
                @mouseover.stop="showImage($event, getPerformerId(performer), 'performer')" 
                @mouseleave.stop="$store.state.hoveredImage=false"
                @click="$store.state.hoveredImage=false"
                @click.middle="addNewTabPerformer(performer)"
              > {{ performer }} </v-chip>
            </v-chip-group>
          </div>
        </div>
      </div>
    </div>

    <v-tabs v-model="$store.state.Tags.activeTab" grow @change="changeTab">
      <v-tab>Videos ({{$store.getters.filteredVideosTotal}})</v-tab>
      <v-tab>Performers ({{$store.getters.filteredPerformersTotal}})</v-tab>
    </v-tabs>

    <v-tabs-items v-model="$store.state.Tags.activeTab">
      <v-tab-item> <!-- VIDEOS -->
        <v-container fluid
          v-if="!$store.state.Videos.filteredEmpty" 
          class="pagination-container mb-6 pt-10" 
        >
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
          <VideoCard 
            v-for="(video) in videosOnPage" 
            :key="video.id" :video="video"
          />
        </v-container>

        <v-pagination class="pt-10 pb-16"
          v-if="!$store.state.Videos.filteredEmpty"
          v-model="videosCurrentPage"
          :length="videosPagesSum"
          :total-visible="getNumberOfPagesLimit"
        ></v-pagination>
        
        <div v-show="$store.getters.navigationSide=='2'" class="py-6"></div>
        
        <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
          class="scroll-to-top" fixed fab color="primary">
          <v-icon>mdi-chevron-up</v-icon>
        </v-btn>

        <DialogEditTag v-if="$store.state.Tags.dialogEditTag"/>
      
      </v-tab-item>
      
      <v-tab-item> <!-- PERFORMERS -->
        <v-container fluid v-if="!$store.state.Performers.filteredEmpty" 
          class="pagination-container mb-6 pt-10">
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
        
        <div v-show="$store.getters.navigationSide=='2'" class="py-6"></div>

        <v-btn @click="scrollToTop" v-show="isScrollToTopVisible" 
          class="scroll-to-top" fixed fab color="primary">
          <v-icon>mdi-chevron-up</v-icon>
        </v-btn>
        
        <PerformersGridElements />
      </v-tab-item>
    </v-tabs-items>
  </vuescroll>
</template>


<script>
const fs = require("fs")
const path = require("path")

import VideosGrid from '@/mixins/VideosGrid'
import PerformersGrid from '@/mixins/PerformersGrid'
import PerformersGridElements from '@/components/elements/PerformersGridElements.vue'
import CropImage from '@/mixins/CropImage'
import vuescroll from 'vuescroll'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  name: 'TagPage',
  mixins: [VideosGrid, PerformersGrid, ShowImageFunction],
  components: {
    DialogEditTag: () => import("@/components/pages/tags/DialogEditTag.vue"),
    PerformersGridElements,
    vuescroll,
    Loading: () => import('@/components/elements/Loading.vue'),
  },
  mounted() {
    this.$nextTick(function () {
      this.initFilters()
    })
  },
  data: () => ({
    activePerformers: [],
    isScrollToTopVisible: false,
  }),
  computed: {
    tag() {
      return this.$store.getters.tags.find({ id: this.tagId }).value()    
    },
    tagId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    cardSize() {
      return `card-size-${this.$store.state.Settings.videoCardSize}`
    },
    headerColor() {
      return `background: ${this.tag.color}`
    },
    gradient() {
      let color = this.$vuetify.theme.isDark ? '#1e1e1e' : '#fff'
      let gradient = `linear-gradient(to top, ${color}, rgba(0,0,0,.0) 35%)`
      return `background: ${gradient}`
    },
    performersWithTag() {
      return this.$store.getters.performers.filter(p=>(p.tags.includes(this.tag.name)))
    },
    performersWithTagInVideos() {
      let videos = this.videosWithTag.value()
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
    videosWithTag() {
      return this.$store.getters.videos.filter(v=>(v.tags.includes(this.tag.name)))
    },
    videoThumbImgUrls() {
      let imgUrls = this.videosWithTag.orderBy('rating',['desc']).take(40).value().map(v=>{
        let imgPath = path.join(this.pathToUserData, `/media/thumbs/${v.id}.jpg`)
        if (fs.existsSync(imgPath)) {
          return imgPath
        } else return false
      })
      return imgUrls
    },
    performerThumbImgUrls() {
      let imgUrls = this.performersWithTag.orderBy('rating',['desc']).take(20).value().map(v=>{
        let imgPath = path.join(this.pathToUserData, `/media/performers/${v.id}_main.jpg`)
        if (fs.existsSync(imgPath)) {
          return imgPath
        } else return false
      })
      return imgUrls
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    tabId() {
      return this.$route.query.tabId
    },
    filtersTab() {
      if (this.tabId === 'default') {
        return undefined
      } else {
        return this.$store.getters.tabsDb.find({id:this.tabId}).get('filters').value()  
      }
    },
    gapSize() {
      return `gap-size-${this.$store.state.Settings.gapSize}`
    },
  },
  methods: {
    changeTab() {
      // console.log(this.$store.state.Tags.activeTab)
    },
    scrollToTop() {
      this.$refs.mainContainer.scrollTo({y: 0},500,"easeInQuad")
    },
    handleScroll(vertical) {
      if (vertical.scrollTop > 500) {
        this.isScrollToTopVisible = true
      } else this.isScrollToTopVisible = false
    },
    initFilters() {
      this.$store.commit('resetFilteredVideos')
      this.$store.commit('resetFilteredPerformers')
      if (this.tabId !== 'default' && typeof this.filtersTab === 'undefined') {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          filters: {
            videos: _.cloneDeep(this.$store.state.Videos.filters),
            performers: _.cloneDeep(this.$store.state.Performers.filters),
          }
        }).write()
      } else if (this.tabId !== 'default' && this.filtersTab) {
        this.$store.state.Videos.filters = _.cloneDeep(this.filtersTab.videos)
        this.$store.state.Performers.filters = _.cloneDeep(this.filtersTab.performers)
      }
      this.updateFiltersOfVideos('tags', [this.tag.name])
      this.updateFiltersOfPerformers('tags', [this.tag.name])
    },
    showAllPerformers() {
      this.activePerformers = []
    },
    filterPerformers() {
      let active = this.activePerformers
      let all = this.performersWithTagInVideos
      let filtered = [] 
      for (let i=0; i<active.length; i++) {
        filtered.push(all[active[i]])
      }
      this.updateFiltersOfVideos('performers', filtered)
    },
    updateTabFiltersOfVideos() {
      if (this.tabId !== 'default') {
        let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({videos: newFilters}).write()
      }
    },
    updateTabFiltersOfPerformers() {
      if (this.tabId !== 'default') {
        let newFilters = _.cloneDeep(this.$store.state.Performers.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({performers: newFilters}).write()
      }
    },
    updateFiltersOfVideos(key, value){
      this.$store.commit('updateFiltersOfVideos', {key, value})
      this.$store.dispatch('filterVideos')
      this.updateTabFiltersOfVideos()
    },
    updateFiltersOfPerformers(key, value){
      this.$store.commit('updateFiltersOfPerformers', {key, value})
      this.$store.dispatch('filterPerformers')
      this.updateTabFiltersOfPerformers()
    },
    getImgUrl(tagId) {
      let imgPath = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      return this.checkImageExist(imgPath)+'?lastmod='+Date.now()
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return path.join(this.pathToUserData, '/img/templates/tag.png')
      }
    },
    addNewTabPerformer(performerName) {
      let tabId = this.getPerformerId(performerName)
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with performer "${performerName}" already exists`
        })
        return
      }
      let tab = { 
        name: performerName,
        link: `/performer/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    getPerformerId(itemName) {
      return this.$store.getters.performers.find({name: itemName}).value().id
    },
  },
  watch: {
    activePerformers() {
      this.filterPerformers()
    },
    $route(newRoute) {
      if (!this.$route.path.includes('/tag/:')) return
      this.initFilters()
    },
  }
}
</script>


<style lang="less" scoped>
.tag-header {
  display: flex;
  align-items: flex-start;
  padding-bottom: 100px;
  z-index: 2;
  &-wrapper {
    position: relative;
    overflow: hidden;
  }
  .tag-name {
    z-index: 2;
    font-weight: bold;
  }
  .alternate-names {
    font-size: 0.5em;
    font-weight: normal;
  }
  .logo,
  .chips-tag-wrapper,
  .chips-performers,
  .performers-title {
    z-index: 2;
  }
  .tag-info {
    display: flex;
    flex-direction: column;
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
.all-thumbs-videos {
  display: flex;
  flex-wrap: wrap;
  position: absolute;
  opacity: 0.7;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}
.all-thumbs-performers {
  display: flex;
  flex-wrap: wrap;
  position: absolute;
  opacity: 0.7;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
}
</style>