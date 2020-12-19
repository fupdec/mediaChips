<script>
export default {
  methods: {
    performerLink(itemName) {
      return `/performer/:${this.getPerformerId(itemName)}?tabId=default`
    },
    getPerformerId(itemName) {
      return this.$store.getters.performers.find({name: itemName}).value().id
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
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
    },
    addNewTabTag(tagName) {
      console.log(tagName)
      let tabId, tabName
      if (tagName) {
        tabId = this.getTagId(tagName)
        tabName = tagName
      } else if (this.tag) {
        tabId = this.tag.id
        tabName = this.tag.name
      } else return

      if (this.$store.getters.tabsDb.find({id: tabId}).value()) {
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Tab with tag "${tabName}" already exists`
        })
        return
      }

      let tab = { 
        name: tabName,
        link: `/tag/:${tabId}?tabId=${tabId}`,
        id: tabId,
        icon: 'tag-outline'
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
        icon: 'web'
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