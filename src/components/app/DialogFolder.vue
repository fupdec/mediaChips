<template>
  <v-dialog v-model="$store.state.dialogFolder" scrollable width="1200">
    <v-card class="pb-4">
      <v-card-title primary-title class="py-1 pl-4 pr-2">
        <div class="headline"><v-icon left>mdi-folder</v-icon>{{folder.folder}}</div>
        <v-spacer></v-spacer>
        <v-btn @click="$store.state.dialogFolder=false" icon>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-actions v-if="folder.lostFiles.length" class="pa-4">
        <v-btn @click="toggleListLostFiles" color="orange" dark>
          <v-icon left>mdi-format-list-numbered</v-icon> Toggle full list
        </v-btn>
        <v-alert dense text color="orange" class="mb-0 ml-6">
          Number of videos lost: {{folder.lostFiles.length}}
        </v-alert>
        <v-spacer></v-spacer>
        <v-btn @click="openTabWithLostVideos" color="secondary">
          <v-icon left>mdi-tab-plus</v-icon> Open tab with lost videos
        </v-btn>
      </v-card-actions>
      <vuescroll v-if="listLostFiles">
        <v-card-text class="py-0">
          <v-alert text dense outlined color="orange" class="ma-0 caption">
            <span v-for="(filePath, i) in folder.lostFiles" :key="i" 
              @click="copyPath(i, 'lostFiles')" title="Copy to clipboard" class="path">
              {{i+1}}) {{filePath}}<br> </span>
          </v-alert>
        </v-card-text>
      </vuescroll>
      <v-card-actions v-if="folder.newFiles.length" class="pa-4">
        <v-btn @click="toggleListNewFiles" color="blue" dark>
          <v-icon left>mdi-format-list-numbered</v-icon> Toggle full list
        </v-btn>
        <v-alert dense text color="blue" class="mb-0 ml-6">
          Number of videos new: {{folder.newFiles.length}}
        </v-alert>
        <v-spacer></v-spacer>
        <v-btn @click="$store.state.dialogFolder=false" color="green" dark>
          <v-icon left>mdi-plus</v-icon> Add new videos
        </v-btn>
      </v-card-actions>
      <vuescroll v-if="listNewFiles">
        <v-card-text class="py-0">
          <v-alert text dense outlined color="blue" class="ma-0 caption">
            <span v-for="(filePath, i) in folder.newFiles" :key="i"
              @click="copyPath(i, 'newFiles')" title="Copy to clipboard" class="path">
              {{i+1}}) {{filePath}}<br></span>
          </v-alert>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: "DialogFolder",
  props: {
    folder: Object,
    isWatcherReady: Boolean,
	},
  components: {
    vuescroll,
	},
  mixins: [], 
  mounted () {
    this.$nextTick(function () {
      if (this.folder.lostFiles.length<10 && this.folder.lostFiles.length>0) this.listLostFiles = true
      if (this.folder.newFiles.length<10 && this.folder.newFiles.length>0) this.listNewFiles = true
      if (this.folder.lostFiles.length==0 && this.folder.newFiles.length>0) this.listNewFiles = true
      if (this.folder.newFiles.length==0 && this.folder.lostFiles.length>0) this.listNewFiles = true
    })
  },
  updated() {
  },
  data: () => ({
    listLostFiles: false,
    listNewFiles: false,
  }),
  computed: {
  },
  methods: {
    toggleListLostFiles() {
      this.listLostFiles = !this.listLostFiles
      this.listNewFiles = false
    },
    toggleListNewFiles() {
      this.listNewFiles = !this.listNewFiles
      this.listLostFiles = false
    },
    openTabWithLostVideos() {
      console.log(this.folder.lostFiles)
      // return
      let tabId = Date.now()
      let tab = { 
        name: 'Lost videos', 
        link: `/videos/:${tabId}?tabId=${tabId}`,
        id: tabId,
        filters: [{
          param: 'path',
          cond: 'one of',
          val: this.folder.lostFiles,
          type: 'array',
          flag: 'lostVideos',
          lock: true,
        }],
        sortBy: 'path',
        sortDirection: 'asc',
        page: 1,
        icon: 'video-off-outline'
      }
      this.$store.dispatch('addNewTab', tab)
      this.$store.state.dialogFolder = false
      this.$router.push(tab.link)
    },
    copyPath(i, type) {
      navigator.clipboard.writeText(this.folder[type][i])
    },
  },
  watch: {
  }
}
</script>


<style lang="less" scoped>
.path {
  cursor: pointer;
}
</style>