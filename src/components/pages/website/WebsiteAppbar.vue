<template>
	<div class="app-bar-container">
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Websites.dialogEditWebsite = true" 
            icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit website</span>
      </v-tooltip>
      <DialogEditWebsite v-if="$store.state.Websites.dialogEditWebsite"/>
    </div>

    <VideosAppbarActions />
    
    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn icon tile @click="dialogDeleteWebsite=true" v-on="on">
            <v-icon>mdi-delete-forever</v-icon>
          </v-btn>
        </template>
        <span>Delete website</span>
      </v-tooltip>
    </div>

    <v-dialog v-model="dialogDeleteWebsite" scrollable persistent max-width="600">
      <v-card>
        <v-card-title class="headline red--text">Are you sure?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text style="white-space: pre-wrap;">
            <div>You want to delete website "{{website.name}}"</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn class="ma-4" @click="dialogDeleteWebsite = false">
            No, Keep it
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red" class="ma-4" dark @click="deleteWebsite">
            <v-icon left>mdi-delete-alert</v-icon> Yes, delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView />
	</div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'WebsiteAppbar',
  components: {
    DialogEditWebsite: () => import("@/components/pages/websites/DialogEditWebsite.vue"),
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogDeleteWebsite: false,
  }),
  computed: {
    website() {
      return this.$store.getters.websites.find({ id: this.websiteId }).value()    
    },
    websiteId() {
      return this.$route.params.id.replace(/:/g, '')    
    },
    tabId() {
      return this.$route.query.tabId
    },
  },
  methods: {
    deleteWebsite() {
      this.$store.commit('updateSelectedWebsites', [this.websiteId])
      this.$store.dispatch('deleteWebsites')
      this.dialogDeleteWebsite = false
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