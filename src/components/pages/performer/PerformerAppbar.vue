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

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Performers.dialogEditPerformerInfo = true" 
            icon tile v-on="on"> 
            <v-icon>mdi-account-edit</v-icon>
          </v-btn>
        </template>
        <span>Edit performer</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="dialogDeletePerformer=true" v-on="on">
            <v-icon>mdi-delete-forever</v-icon>
          </v-btn>
        </template>
        <span>Delete performer</span>
      </v-tooltip>
    </div>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView />

    
    <v-dialog v-model="dialogDeletePerformer" persistent scrollable max-width="800">
      <v-card>
        <v-card-title class="headline red--text">
          Delete performer {{performer.name}}?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="mx-4">
          <v-checkbox v-model="deleteVideos" color="red" hide-details class="mr-6"> 
            <template v-slot:label>
              <span class="red--text">Delete videos with this performer from database</span>
            </template>
          </v-checkbox>
          <v-spacer></v-spacer>
          <v-checkbox v-model="$store.state.Videos.deleteFile" color="red" hide-details 
            :disabled="!deleteVideos"> 
            <template v-slot:label>
              <span class="red--text">Also delete files</span>
            </template>
          </v-checkbox>
        </v-card-actions>
        <v-card-actions>
          <v-btn class="ma-4" 
            @click="dialogDeletePerformer = false">No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" dark class="ma-4" @click="deletePerformer">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'PerformerAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogDeletePerformer: false,
    deleteVideos: false,
  }),
  computed: {
    performerId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    performer() {
      return this.$store.getters.performers.find({ id: this.performerId }).value()    
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    deletePerformer() {
      if (this.deleteVideos) {
        let vids = this.$store.getters.videos.filter(v=>(
          v.performers.includes(this.performer.name))
        ).map('id').value()
        this.$store.commit('updateSelectedVideos', vids)
        this.$store.dispatch('deleteVideos')
      }
      this.$store.commit('updateSelectedPerformers', [this.performerId])
      this.$store.dispatch('deletePerformers')
      this.dialogDeletePerformer = false
      if (this.tabId !== 'default') {
        this.$store.dispatch('closeTab', this.tabId)
      }
      this.$router.push('/home')
    },
  },
  watch: {
  },
}
</script>


<style lang="less" scoped>
.colored {
  border-radius: 3px;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red)
}
</style>