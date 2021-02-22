<template>
  <v-bottom-navigation v-if="navigationSide=='2'" absolute style="bottom:20px" shift>
    <v-btn to="/home" text color="secondary">
      <span>Home</span>
      <v-icon>mdi-home-outline</v-icon>
    </v-btn>

    <v-btn to="/videos/:default?tabId=default" @click.middle="addNewTabVideos" text color="secondary">
      <span>Videos</span>
      <v-icon>mdi-video-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowVideoBtn" :to="$router.currentRoute" text color="secondary">
      <span>Video</span>
      <v-icon>mdi-television-play</v-icon>
    </v-btn>

    <v-btn to="/performers/:default?tabId=default" @click.middle="addNewTabPerformers" text color="secondary">
      <span>Performers</span>
      <v-icon>mdi-account-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowPerformerBtn" :to="$router.currentRoute" text color="secondary">
      <span>Performer</span>
      <v-icon>mdi-account-details</v-icon>
    </v-btn>

    <v-btn to="/tags/:default?tabId=default" @click.middle="addNewTabTags" text color="secondary">
      <span>Tags</span>
      <v-icon>mdi-tag-outline</v-icon>
    </v-btn>

    <v-btn v-if="isShowTagBtn" :to="$router.currentRoute" text color="secondary">
      <span>Tag</span>
      <v-icon>mdi-tag-text-outline</v-icon>
    </v-btn>

    <v-btn to="/websites/:default?tabId=default" @click.middle="addNewTabWebsites" text color="secondary">
      <span>Websites</span>
      <v-icon>mdi-web</v-icon>
    </v-btn>

    <v-btn v-if="isShowWebsiteBtn" :to="$router.currentRoute" text color="secondary">
      <span>Website</span>
      <v-icon>mdi-web-box</v-icon>
    </v-btn>

    <v-btn to="/playlists/:default?tabId=default" @click.middle="addNewTabPlaylists" text color="secondary">
      <span>Playlists</span>
      <v-icon>mdi-format-list-bulleted</v-icon>
    </v-btn>

    <v-btn to="/settings" text color="secondary">
      <span>Settings</span>
      <v-icon>mdi-cog-outline</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>


<script>
export default {
  name: 'BottomBar',
  data: () => ({
    navigationMenu: 1,
    isShowVideoBtn: false,
    isShowPerformerBtn: false,
    isShowWebsiteBtn: false,
    isShowTagBtn: false,
  }),
  computed: {
    navigationSide() {
      return this.$store.state.Settings.navigationSide
    },
  },
  methods: {
    addNewTabVideos() {
      let tabId = Date.now()
      let tab = { 
        name: this.$store.getters.videoFiltersForTabName, 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.videoFilters),
        sortBy: this.$store.state.Settings.videoSortBy,
        sortDirection: this.$store.state.Settings.videoSortDirection,
        page: 1,
        icon: 'video-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    addNewTabPerformers() {
      let tabId = Date.now()
      let tab = { 
        name: this.$store.getters.performerFiltersForTabName, 
        link: `/performers/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.performerFilters),
        sortBy: this.$store.state.Settings.performerSortBy,
        sortDirection: this.$store.state.Settings.performerSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.performerFirstChar,
        icon: 'account-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    addNewTabTags() {
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.tagFiltersForTabName, 
        link: `/tags/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.tagFilters),
        sortBy: this.$store.state.Settings.tagSortBy,
        sortDirection: this.$store.state.Settings.tagSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.tagFirstChar,
        color: this.$store.state.Settings.tagColor,
        icon: 'tag-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    addNewTabWebsites() {
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.websiteFiltersForTabName, 
        link: `/websites/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.websiteFilters),
        sortBy: this.$store.state.Settings.websiteSortBy,
        sortDirection: this.$store.state.Settings.websiteSortDirection,
        page: 1,
        firstChar: this.$store.state.Settings.websiteFirstChar,
        color: this.$store.state.Settings.websiteColor,
        icon: 'web'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
    addNewTabPlaylists() {
      let tabId = Date.now()
      let tab = {
        name: this.$store.getters.playlistFiltersForTabName, 
        link: `/playlists/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: _.cloneDeep(this.$store.state.Settings.playlistFilters),
        sortBy: this.$store.state.Settings.playlistSortBy,
        sortDirection: this.$store.state.Settings.playlistSortDirection,
        page: 1,
        icon: 'format-list-bulleted'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$router.push(tab.link)
    },
  },
  watch: {
    $route(newValue, oldValue) {
      this.isShowVideoBtn = this.$router.currentRoute.path.includes('/video/')
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/')
      this.isShowWebsiteBtn = this.$router.currentRoute.path.includes('/website/')
      this.isShowTagBtn = this.$router.currentRoute.path.includes('/tag/')
    },
  },
}
</script>


<style lang="less" scoped>
.v-btn {
  -webkit-user-drag: none !important;
}
</style>