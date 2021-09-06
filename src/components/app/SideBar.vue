<template>
  <v-navigation-drawer app permanent mini-variant expand-on-hover clipped>
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
        
        <v-list-item link to="/playlists/:default?tabId=default"
          @click.middle="addNewTabPlaylists" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Playlists</v-list-item-title>
        </v-list-item>

        <v-divider v-if="metaList.length>0" class="my-1"/>

        <draggable v-model="metaList" v-bind="dragOptions">
          <transition-group type="transition">
            <v-list-item v-for="meta in metaList" :key="meta.id" @click.middle="addNewTabMetaCards(meta)"
              link exact :to="`/meta/?metaId=${meta.id}&tabId=default`" color="secondary" draggable="false">
              <v-list-item-icon>
                <v-icon>mdi-{{meta.settings.icon}}</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{meta.settings.name}}</v-list-item-title>
            </v-list-item>
          </transition-group>
        </draggable>

        <v-list-item v-if="hiddenMetaList.length" @click="showHidden=!showHidden" color="secondary" draggable="false">
          <v-list-item-icon>
            <v-icon>mdi-chevron-{{showHidden?'up':'down'}}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Toggle hidden</v-list-item-title>
        </v-list-item>

        <div v-if="showHidden">
          <v-list-item v-for="meta in hiddenMetaList" :key="meta.id+1" @click.middle="addNewTabMetaCards(meta)"
            link exact :to="`/meta/?metaId=${meta.id}&tabId=default`" color="secondary" draggable="false">
            <v-list-item-icon>
              <v-icon>mdi-{{meta.settings.icon}}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{meta.settings.name}}</v-list-item-title>
          </v-list-item>
        </div>
        
        <v-divider class="my-1"/>
        
        <v-list-item link to="/settings" color="secondary" draggable="false">
          <v-list-item-icon> 
            <v-icon>mdi-cog-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>

        <div v-if="folders.length && watchFolders" @mouseover="folderHovered=true" @mouseleave="folderHovered=false">
          <v-divider class="my-1"/>
          <v-list-item v-for="(folder, i) in folders" :key="i" @click="openDialogFolder(folder.path)">
            <v-list-item-icon> 
              <v-icon v-if="foldersUpdated">mdi-folder-outline</v-icon>
              <v-icon v-else>mdi-folder-sync-outline</v-icon>
              <v-badge :value="getLostFiles(folder.path)" :content="getLostFiles(folder.path)" color="warning"
                :dot="!folderHovered" :offset-x="folderHovered?35:30" :offset-y="folderHovered?12:6"/>
              <v-badge :value="getNewFiles(folder.path)" :content="getNewFiles(folder.path)" color="info"
                :dot="!folderHovered" :offset-x="folderHovered?35:30" :offset-y="folderHovered?35:26"/>
            </v-list-item-icon>
            <v-list-item-title>{{folder.name}}</v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
    </vuescroll>
  </v-navigation-drawer>
</template>


<script>
import draggable from "vuedraggable"
import vuescroll from 'vuescroll'

export default {
  name: 'SideBar',
  props: { foldersUpdated: Boolean, },
  components: { vuescroll, draggable },
  data: () => ({
    showHidden: false,
    ops: {
      scrollPanel: { scrollingX: false },
      rail: { size: '4px', }
    },
    folderHovered: false,
    dragOptions: { animation: 200, },
  }),
  computed: {
    tabId() { return this.$route.query.tabId },
    folders() { return this.$store.state.Settings.folders },
    foldersData() { return this.$store.state.foldersData },
    watchFolders() { return this.$store.state.Settings.watchFolders },
    metaList: {
      get() { 
        let list = _.filter(this.$store.state.Meta.complexMetaList, i=>i.settings.hidden!==true)
        return list.sort((a, b) => a.state.order - b.state.order)
      },
      set(value) { 
        for (let i = 0; i < value.length; i++) {
          const id = value[i].id
          this.$store.getters.meta.find({id}).set('state.order', i).write()
        }
        this.$store.commit('updateComplexMetaListFromDb')
      },
    },
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