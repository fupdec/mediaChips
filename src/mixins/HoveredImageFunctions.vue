<script>
const fs = require("fs")
const path = require("path")

export default {
  computed: {
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
    getImgPerformersUrl(performerId) {
      let imgAvatarPerformer = path.join(this.pathToUserData, `/media/performers/${performerId}_avatar.jpg`)
      let imgAvatarChecked = this.checkImageExist(imgAvatarPerformer)
      let imgMainPerformer = path.join(this.pathToUserData, `/media/performers/${performerId}_main.jpg`)
      let imgMainChecked = this.checkImageExist(imgMainPerformer)
      if (imgAvatarChecked) {
        return 'file://' + imgAvatarChecked
      } else if (imgMainChecked) {
        return 'file://' + imgMainChecked
      } else {
        return path.join('file://', this.pathToUserData, '/img/templates/performer.png')
      }
    },
    getImgTagsUrl(tagId) {
      let imgTag = path.join(this.pathToUserData, `/media/tags/${tagId}_.jpg`)
      let imgChecked = this.checkImageExist(imgTag)
      if (imgChecked) {
        return 'file://' + imgChecked
      } else {
        return path.join('file://', this.pathToUserData, '/img/templates/tag.png')
      }
    },
    getImgWebsiteUrl(websiteId) {
      let imgWebsite = path.join(this.pathToUserData, `/media/websites/${websiteId}_.jpg`)
      let imgChecked = this.checkImageExist(imgWebsite)
      if (imgChecked) {
        return 'file://' + imgChecked
      } else {
        return path.join('file://', this.pathToUserData, '/img/templates/website.png')
      }
    },
    checkImageExist(imgPath) {
      if (fs.existsSync(imgPath)) {
        return imgPath
      } else {
        return false
      }
    },
  },
}
</script>