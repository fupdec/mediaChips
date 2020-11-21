<script>
const fs = require("fs")
const path = require("path")

export default {
  mounted () {
    this.$nextTick(function () {
      this.$store.state.Videos.filters.duration = [0, this.maxDuration]
    })
  },
  computed: {
    itemId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    isPerformerPage() {
      return this.$route.path.includes('/performer/:')  
    },
    isTagPage() {
      return this.$route.path.includes('/tag/:')  
    },
    isWebsitePage() {
      return this.$route.path.includes('/website/:')  
    },
    performers() {
      return this.$store.getters.performers.orderBy([p=>p.name.toLowerCase()],['asc']).value()
    },
    tags() {
      let tags = this.$store.getters.tags.filter(t=>(t.category.includes('video')))
      return tags.orderBy(p=>(p.name.toLowerCase()),['asc']).value()
    },
    websites() {
      return this.$store.getters.websites.orderBy([w=>w.name.toLowerCase()],['asc']).value()
    },
    maxDuration() {
      let maxDuration = 0
      this.$store.getters.videos.map(vid=>{
        if (maxDuration < vid.duration) maxDuration = vid.duration
      }).value()
      maxDuration = Math.ceil(maxDuration/60)
      return maxDuration
    },
    pathToUserData() {
      return this.$store.getters.getPathToUserData
    },
    tabId() {
      return this.$route.query.tabId  
    },
  },
  methods: {
    getItem(itemType) {
      return this.$store.getters[itemType].find({ id: this.itemId }).value()    
    },
    getPerformerColorDependsRating(rating) { 
      if (rating === 0) {
        return `rgba(150, 150, 150, 0.1)`
      } else {
        return `rgba(255, 190, 0, ${0.05*rating})`
      }
    },
    getImgPerformersUrl(performerId) {
      let imgAvatarPerformer = path.join(this.pathToUserData, `/media/performers/${performerId}_avatar.jpg`)
      let imgAvatarChecked = this.checkImageExist(imgAvatarPerformer)
      let imgMainPerformer = path.join(this.pathToUserData, `/media/performers/${performerId}_main.jpg`)
      let imgMainChecked = this.checkImageExist(imgMainPerformer)
      if (imgAvatarChecked) {
        return imgAvatarChecked + '?lastmod='+Date.now()
      } else if (imgMainChecked) {
        return imgMainChecked + '?lastmod='+Date.now()
      } else {
        return path.join(this.pathToUserData, '/img/templates/performer.png') + '?lastmod='+Date.now()
      }
    },
    getImgTagsUrl(tagId) {
      let imgTag = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      let imgChecked = this.checkImageExist(imgTag)
      if (imgChecked) {
        return imgChecked + '?lastmod='+Date.now()
      } else {
        return path.join(this.pathToUserData, '/img/templates/tag.png') + '?lastmod='+Date.now()
      }
    },
    getImgWebsiteUrl(websiteId) {
      let imgWebsite = path.join(this.pathToUserData, `/media/websites/${websiteId}_.jpg`)
      let imgChecked = this.checkImageExist(imgWebsite)
      if (imgChecked) {
        return imgChecked + '?lastmod='+Date.now()
      } else {
        return path.join(this.pathToUserData, '/img/templates/website.png') + '?lastmod='+Date.now()
      }
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return false
      }
    },
    updateTabFilters() {
      const pages = ['/performer/:','/website/:']
      let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
      if (this.tabId === 'default') {
        this.$store.state.Videos.filtersReserved = newFilters
      } else if (this.$route.path.includes('/tag/:')) {
        let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
        this.$store.getters.tabsDb.find({id: this.tabId}).get('filters').assign({videos: newFilters}).write()
      } else if (pages.some(p => this.$route.path.includes(p))) {
        let newFilters = _.cloneDeep(this.$store.state.Videos.filters)
        this.$store.getters.tabsDb.find({id:this.tabId}).assign({filters:newFilters}).write()
      } else {
        this.$store.getters.tabsDb.find({id: this.tabId}).assign({
          name: this.$store.getters.videosFilters,
          filters: newFilters,
        }).write()
        this.$store.commit('getTabsFromDb')
      }
    },
    applyAllFilters() {
      this.$store.dispatch('filterVideos')
      this.updateTabFilters()
    },
    resetAllFilters() {
      this.$store.commit('resetFilteredVideos')
      if (this.isPerformerPage) {
        let item = this.getItem('performers')
        this.updateFiltersOfVideos('performers', [item.name])
      } else if (this.isTagPage) {
        let item = this.getItem('tags')
        this.updateFiltersOfVideos('tags', [item.name])
      } else if (this.isWebsitePage) {
        let item = this.getItem('websites')
        this.updateFiltersOfVideos('websites', [item.name])
      } else {
        this.updateTabFilters()
      }
      this.$store.dispatch('filterVideos')
    },
    remove(item, array) { 
      const index = this[array].indexOf(item)
      if (index >= 0) this[array].splice(index, 1)
    },
  },
}
</script>