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
  },
  methods: {
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
    remove(item, array) { 
      const index = this[array].indexOf(item);
      if (index >= 0) this[array].splice(index, 1);
    },
    applyAllFilters() {
      this.$store.dispatch('filterVideos')
    },
    resetAllFilters() {
      this.$store.commit('resetFilteredVideos')
      this.$store.dispatch('filterVideos')
    },
  },
}
</script>