<template>
  <v-navigation-drawer v-if="navigationSide=='1'" 
    app permanent mini-variant expand-on-hover clipped
  >
    <vuescroll :ops="ops">
      <v-list nav dense>
        <v-list-item link to="/home" color="secondary" draggable="false"> 
          <v-list-item-icon>
            <v-icon>mdi-home-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/videos/:default?tabId=default"
          @click.middle="addNewTabVideos" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-video-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Videos</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/performers/:default?tabId=default"
          @click.middle="addNewTabPerformers" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-account-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Performers</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowPerformerBtn" link :to="$router.currentRoute" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-account-details</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Performer</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/tags/:default?tabId=default"
          @click.middle="addNewTabTags" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-tag-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Tags</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/websites/:default?tabId=default" 
          @click.middle="addNewTabWebsites" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-web</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Websites</v-list-item-title>
        </v-list-item>
        
        <v-list-item v-if="isShowWebsiteBtn" link :to="$router.currentRoute" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-web-box</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Website</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/playlists/:default?tabId=default"
          @click.middle="addNewTabPlaylists" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Playlists</v-list-item-title>
        </v-list-item>
        
        <v-list-item link to="/settings" color="secondary" draggable="false">
          <v-list-item-icon> 
            <v-icon>mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>
      </v-list>

      <div @mouseover="folderHovered=true" @mouseleave="folderHovered=false">
        <v-list nav dense>
          <v-list-item v-for="(folder, i) in folders" :key="i" @click="openDialogFolder(folder)">
            <v-list-item-icon> 
              <v-icon>mdi-folder-outline</v-icon>
              <v-badge :value="getLostFiles(folder)" :content="getLostFiles(folder)" color="warning"
                :dot="!folderHovered" :offset-x="folderHovered?35:30" :offset-y="folderHovered?12:6"/>
              <v-badge :value="getNewFiles(folder)" :content="getNewFiles(folder)" color="info"
                :dot="!folderHovered" :offset-x="folderHovered?35:30" :offset-y="folderHovered?35:26"/>
            </v-list-item-icon>
            <v-list-item-title>{{folder}}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </vuescroll>
  </v-navigation-drawer>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'SideBar',
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    isShowPerformerBtn: false,
    isShowWebsiteBtn: false,
    ops: {
      scrollPanel: {
        scrollingX: false
      },
      rail: {
        size: '4px',
      }
    },
    folderHovered: false,
  }),
  computed: {
    navigationSide() {
      return this.$store.state.Settings.navigationSide
    },
    tabId() {
      return this.$route.query.tabId
    },
    folders() {
      return this.$store.state.Settings.folders
    },
    foldersData() {
      return this.$store.state.foldersData
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
    getLostFiles(folder) {
      if (_.filter(this.foldersData, {folder}).length) {
        const index = _.findIndex(this.foldersData, {folder})
        return this.foldersData[index].lostFiles.length
      } else return ''
    },
    getNewFiles(folder) {
      if (_.filter(this.foldersData, {folder}).length) {
        const index = _.findIndex(this.foldersData, {folder})
        return this.foldersData[index].newFiles.length
      } else return ''
    },
    openDialogFolder(folder) {
      if (_.filter(this.foldersData, {folder}).length) this.$emit('openDialogFolder', folder)
    },
  },
  watch: {
    $route() {
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/') && this.tabId=='default'
      this.isShowWebsiteBtn = this.$router.currentRoute.path.includes('/website/') && this.tabId=='default'
    },
  },
}
</script>