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
    <v-divider vertical></v-divider>

    <div>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogEditMetaCard=true" icon tile v-on="on"> 
            <v-icon>mdi-pencil</v-icon></v-btn>
        </template>
        <span>Edit {{meta.settings.nameSingular}}</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="$store.state.Meta.dialogEditMetaCardImages=true" icon tile v-on="on"> 
            <v-icon>mdi-image-edit-outline</v-icon></v-btn>
        </template>
        <span>Edit Images</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn @click="dialogDeleteMetaCard=true" icon tile v-on="on"> 
            <v-icon>mdi-delete</v-icon></v-btn>
        </template>
        <span>Delete {{meta.settings.nameSingular}}</span>
      </v-tooltip>
    </div>
    
    <v-spacer></v-spacer>

    <VideosAppbarCardView />


    <DialogEditSingleMetaCard v-if="$store.state.Meta.dialogEditMetaCard"/>
    <DialogEditMetaCardImages v-if="$store.state.Meta.dialogEditMetaCardImages"/>
    <v-dialog v-if="dialogDeleteMetaCard" v-model="dialogDeleteMetaCard" persistent scrollable max-width="600">
      <v-card>
        <v-toolbar color="error">
          <span class="headline">Are you sure?</span>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteMetaCard=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteMetaCard" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <vuescroll>
          <v-card-text class="text-center">
            <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
            <div>You want to delete {{meta.settings.nameSingular.toLowerCase()}} {{card.meta.name}}</div>  
          </v-card-text>
        </vuescroll>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'
import MetaGetters from '@/mixins/MetaGetters.vue'

export default {
  name: 'MetaCardAppbar',
  components: {
    VideosAppbarActions: () => import('@/components/elements/VideosAppbarActions.vue'),
    VideosAppbarCardView: () => import('@/components/elements/VideosAppbarCardView.vue'),
    DialogEditSingleMetaCard: () => import('@/components/pages/meta/DialogEditSingleMetaCard.vue'),
    DialogEditMetaCardImages: () => import('@/components/pages/meta/DialogEditMetaCardImages.vue'),
    vuescroll,
  },
  mixins: [MetaGetters],
  mounted() { this.$nextTick(function () {}) },
  data: () => ({
    dialogDeleteMetaCard: false,
    deleteVideos: false,
  }),
  computed: {
    metaCardId() { return this.$route.query.cardId },
    card() { return this.$store.getters.metaCards.find({id: this.metaCardId}).value() },
    tabId() { return this.$route.query.tabId },
  },
  methods: {
    deleteMetaCard() { 
      this.dialogDeleteMetaCard = false
      this.$store.state.Meta.selectedMeta = [this.metaCardId]
      this.$store.dispatch('deleteMetaCard') 
      if (this.tabId !== 'default') this.$store.dispatch('closeTab', this.tabId)
      else this.$router.push('/home')
      this.$store.state.Settings.videoFilters = []
    }
  },
  watch: {},
}
</script>