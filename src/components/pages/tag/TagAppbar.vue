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

    <VideosAppbarActions v-if="$store.state.Tags.activeTab===0"/>
    <PerformersAppbarActions v-if="$store.state.Tags.activeTab===1"/>

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Tags.dialogEditTag = true" 
            icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit tag</span>
      </v-tooltip>
      <DialogEditTag v-if="$store.state.Tags.dialogEditTag"/>
      
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="dialogDeleteTag=true" v-on="on">
            <v-icon>mdi-delete-forever</v-icon>
          </v-btn>
        </template>
        <span>Delete tag</span>
      </v-tooltip>
    </div>

    <v-dialog v-model="dialogDeleteTag" scrollable persistent max-width="600">
      <v-card>
        <v-card-title class="headline red--text">Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>You want to delete tag "{{tag.name}}"</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn class="ma-4" @click="dialogDeleteTag = false">
            No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" class="ma-4" dark @click="deleteTag">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView v-if="$store.state.Tags.activeTab===0"/>
    <PerformersAppbarCardView v-if="$store.state.Tags.activeTab===1"/>
	</div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'TagAppbar',
  components: {
    DialogEditTag: () => import('@/components/pages/tags/DialogEditTag.vue'),
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    PerformersAppbarActions: () => import('@/components/elements/PerformersAppbarActions.vue'),
    PerformersAppbarCardView: () => import('@/components/elements/PerformersAppbarCardView.vue'),
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogDeleteTag: false,
  }),
  computed: {
    tag() {
      return this.$store.getters.tags.find({ id: this.tagId }).value()    
    },
    tagId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    deleteTag() {
      this.$store.commit('updateSelectedTags', [this.tagId])
      this.$store.dispatch('deleteTags')
      this.dialogDeleteTag = false
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