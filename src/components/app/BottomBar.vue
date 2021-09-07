<template>
  <v-bottom-navigation absolute style="bottom:20px" shift>
    <!-- TODO custom background color depends on current route -->
    <vuescroll :ops="ops">
      <div class="bottom-menu">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" to="/home" text color="secondary" title="Home">
              <span>Home</span>
              <v-icon>mdi-home-outline</v-icon>
            </v-btn>
          </template>
          <span>Home</span>
        </v-tooltip>

        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" to="/videos/:default?tabId=default" @click.middle="addNewTabVideos" text color="secondary" title="Videos">
              <span>Videos</span>
              <v-icon>mdi-video-outline</v-icon>
            </v-btn>
          </template>
          <span>Videos</span>
        </v-tooltip>

        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" to="/playlists/:default?tabId=default" @click.middle="addNewTabPlaylists" text color="secondary" title="Playlists">
              <span>Playlists</span>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
          <span>Playlists</span>
        </v-tooltip>
        
        <v-divider v-if="metaList.length>0" vertical/>

        <v-tooltip v-for="meta in metaList" :key="meta.id" top>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" exact @click.middle="addNewTabMetaCards(meta)"
              :to="`/meta/?metaId=${meta.id}&tabId=default`" text color="secondary" :title="meta.settings.name">
              <span>{{meta.settings.name}}</span>
              <v-icon>mdi-{{meta.settings.icon}}</v-icon>
            </v-btn>
          </template>
          <span>{{meta.settings.name}}</span>
        </v-tooltip>

        <v-menu v-if="hiddenMetaList.length" offset-y top open-on-hover>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" text color="secondary" class="folder btn-hidden">
              <span>Hidden</span>
              <v-icon>mdi-chevron-up</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item v-for="meta in hiddenMetaList" :key="meta.id+1" link exact text color="secondary"
              @click.middle="addNewTabMetaCards(meta)"
              :to="`/meta/?metaId=${meta.id}&tabId=default`">
              <v-icon left>mdi-{{meta.settings.icon}}</v-icon>
              <span class="pr-2">{{meta.settings.name}}</span>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider vertical/>
        
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" to="/settings" text color="secondary" title="Settings">
              <span>Settings</span>
              <v-icon>mdi-cog-outline</v-icon>
            </v-btn>
          </template>
          <span>Settings</span>
        </v-tooltip>

        <div v-if="folders.length && watchFolders" @mouseover="folderHovered=true" @mouseleave="folderHovered=false" class="folders">
          <v-divider vertical/>
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
    tabId() { return this.$route.query.tabId },
    folders() { return this.$store.state.Settings.folders.filter(i=>i.watch) },
    foldersData() { return this.$store.state.foldersData },
    watchFolders() { return this.$store.state.Settings.watchFolders },
    metaList() { return _.filter(this.$store.state.Meta.complexMetaList, i=>i.settings.hidden!==true) },
    hiddenMetaList() { return _.filter(this.$store.state.Meta.complexMetaList, i=>i.settings.hidden===true) },
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
    addNewTabMetaCards(meta) {
      let tabId = Date.now().toString()
      let tab = { 
        name: meta.settings.name, 
        link: `/meta/?metaId=${meta.id}&tabId=${tabId}`,
        id: tabId,
        filters: [],
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        icon: meta.settings.icon
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
  .v-btn {
    letter-spacing: 0;
  }
  .btn-hidden {
    min-width: 50px;
  }
}
</style>