<template>
	<div class="app-bar-container">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="$store.state.Settings.dialogScanVideos=true" v-on="on">
            <v-icon>mdi-video-plus</v-icon>
          </v-btn>
        </template>
        <span>Add new videos</span>
      </v-tooltip>
    </div>

    <VideosAppbarActions />
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="openRandomVideo" icon tile v-on="on"> 
          <v-icon>mdi-dice-5</v-icon>
        </v-btn>
      </template>
      <span>Open random video</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$store.state.Videos.dialogFolderTree = true" icon tile v-on="on"> 
          <v-badge :value="!isTreeEmpty" :content="treeBadgeContent" overlap bottom style="z-index: 5;">
            <v-icon>mdi-file-tree</v-icon>
          </v-badge>
        </v-btn>
      </template>
      <span>Open folder tree</span>
    </v-tooltip>
    
    <DialogFolderTree v-if="$store.state.Videos.dialogFolderTree"/>

    <v-spacer></v-spacer>

    <VideosAppbarCardView />
  </div>
</template>


<script>
export default {
  name: 'VideosAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    DialogFolderTree: () => import('@/components/pages/videos/DialogFolderTree.vue'),
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
  }),
  computed: {
    isTreeEmpty() {
      if (this.$store.state.Videos.filters.tree.length) {
        return false
      } else return true
    },
    treeBadgeContent() {
      return this.$store.state.Videos.filters.tree.length  
    },
  },
  methods: {
    openRandomVideo() {
      const rand = this.getRandomIntInclusive(1, this.$store.getters.videosTotal)
      const videoId = this.$store.getters.videos.value()[rand].id
      this.openVideoPage(videoId)
    },
    getRandomIntInclusive(min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    openVideoPage(videoId) {
      this.$router.push(`/video/:${videoId}?tabId=default`)
    },
  },
  watch: {
  },
}
</script>