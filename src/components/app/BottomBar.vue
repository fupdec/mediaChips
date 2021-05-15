<template>
  <v-bottom-navigation v-if="navigationSide=='2'" absolute style="bottom:20px" shift>
    <!-- TODO custom background color depends on current route -->
    <vuescroll :ops="ops">
      <div class="bottom-menu">
        <v-btn to="/home" text color="secondary">
          <span>Home</span>
          <v-icon>mdi-home-outline</v-icon>
        </v-btn>

        <v-btn to="/videos/:default?tabId=default" @click.middle="addNewTabVideos" text color="secondary">
          <span>Videos</span>
          <v-icon>mdi-video-outline</v-icon>
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

        <v-btn v-for="meta in metaList" :key="meta.id" exact :to="`/meta/?metaId=${meta.id}&tabId=default`" text color="secondary">
          <span>{{meta.settings.name}}</span>
          <v-icon>mdi-{{meta.settings.icon}}</v-icon>
        </v-btn>

        <v-btn to="/settings" text color="secondary">
          <span>Settings</span>
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>

        <div v-if="folders.length && watchFolders" @mouseover="folderHovered=true" @mouseleave="folderHovered=false" class="ml-6 folders">
          <v-tooltip v-for="(folder, i) in folders" :key="i" top>
            <template v-slot:activator="{ on, attrs }">
              <div class="folder-wrapper">
                <v-btn v-bind="attrs" v-on="on" @click="openDialogFolder(folder.path)" text color="secondary" class="folder">
                  <v-icon v-if="foldersUpdated">mdi-folder-outline</v-icon>
                  <v-icon v-else>mdi-folder-sync-outline</v-icon>
                </v-btn>
                <v-badge :value="getLostFiles(folder.path)" :content="getLostFiles(folder.path)" color="warning"
                  :dot="!folderHovered" :offset-x="folderHovered?70:58" :offset-y="folderHovered?-6:-8"/>
                <v-badge :value="getNewFiles(folder.path)" :content="getNewFiles(folder.path)" color="info"
                  :dot="!folderHovered" :offset-x="folderHovered?70:58" :offset-y="folderHovered?18:10"/>
              </div>
            </template>
            <span>{{folder.name}}</span>
          </v-tooltip>
        </div>
      </div>
    </vuescroll>
  </v-bottom-navigation>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'BottomBar',
  props: {
    foldersUpdated: Boolean,
  },
  components: {
    vuescroll,
  },
  data: () => ({
    navigationMenu: 1,
    isShowPerformerBtn: false,
    isShowWebsiteBtn: false,
    folderHovered: false,
    ops: {
      scrollPanel: {
        scrollingY: false
      },
      rail: {
        size: '4px',
      }
    },
  }),
  computed: {
    navigationSide() { return this.$store.state.Settings.navigationSide },
    tabId() { return this.$route.query.tabId },
    folders() { return this.$store.state.Settings.folders },
    foldersData() { return this.$store.state.foldersData },
    watchFolders() { return this.$store.state.Settings.watchFolders },
    metaList() { return this.$store.state.Meta.metaList },
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
    $route(newValue, oldValue) {
      this.isShowPerformerBtn = this.$router.currentRoute.path.includes('/performer/') && this.tabId=='default'
      this.isShowWebsiteBtn = this.$router.currentRoute.path.includes('/website/') && this.tabId=='default'
    },
  },
}
</script>


<style lang="less" scoped>
.v-btn {
  -webkit-user-drag: none !important;
  &.folder {
    .v-btn__content > *:not(.v-icon) {
      opacity: 0 !important; 
    }
    .v-icon {
      transform: none !important;
    }
  }
}
.folders {
  display: flex;
  height: 100%;
}
.v-btn.folder,
.folder-wrapper {
  height: 100%;
}
.bottom-menu {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 56px;
}
</style>