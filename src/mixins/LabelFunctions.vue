<script>
export default {
  // TODO check functions and remove this file
  methods: {
    videoLink(videoPath) {
      return `/video/:${this.getVideoId(videoPath)}?tabId=default`
    },
    getVideoId(videoPath) {
      return this.$store.getters.videos.find({path: videoPath}).value().id
    },
    performerLink(itemName) {
      return `/performer/:${this.getPerformerId(itemName)}?tabId=default`
    },
    getPerformerId(itemName) {
      return this.$store.getters.performers.find({name: itemName}).value().id
      // TODO fix open new tab with performer from performers tab, not from page with perfs
    },
    addNewTabPerformer(performerName) {
      let tabId, tabName
      if (performerName) {
        tabId = this.getPerformerId(performerName)
        tabName = performerName
      } else if (this.performer) {
        tabId = this.performer.id
        tabName = this.performer.name
      } else return
      
      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with performer "${tabName}" already exists`
        })
        return
      }

      let tab = { 
        name: tabName,
        link: `/performer/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'account-details'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    tagLink(itemName) {
      return `/tag/:${this.getTagId(itemName)}?tabId=default`
    },
    getTagId(itemName) {
      return this.$store.getters.tags.find({name: itemName}).value().id
    },
    addNewTabWebsite(websiteName) {
      let tabId, tabName
      if (websiteName) {
        tabId = this.getWebsiteId(websiteName)
        tabName = websiteName
      } else if (this.website) {
        tabId = this.website.id
        tabName = this.website.name
      } else return

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with website "${tabName}" already exists`
        })
        return
      }
      let tab = { 
        name: tabName,
        link: `/website/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'web-box'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    websiteLink(itemName) {
      return `/website/:${this.getWebsiteId(itemName)}?tabId=default`
    },
    getWebsiteId(itemName) {
      return this.$store.getters.websites.find({name: itemName}).value().id
    },
  },
}
</script>