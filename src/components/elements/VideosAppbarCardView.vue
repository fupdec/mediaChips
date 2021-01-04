<template>
	<div>
    <v-menu offset-y nudge-bottom="10" open-on-hover close-delay="1000" :close-on-content-click="false">
      <template v-slot:activator="{ on, attrs }">
        <v-badge :content="getCardSizeIcon()" class="text-uppercase" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn v-bind="attrs" v-on="on" icon tile>
            <v-icon>mdi-card-bulleted</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <v-card width="300">
        <v-card-title class="py-1">
          <span class="headline">Card size</span>
          <v-spacer></v-spacer>
          <v-icon>mdi-card-bulleted-settings</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-slider v-model="$store.state.Settings.videoCardSize"
          min="1" max="5" step="1" :tick-labels="cardSizes"
          @input="changeCardSize" class="pa-6"
        />
      </v-card>
    </v-menu>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
				<v-badge :value="isChipsColored" class="colored" overlap offset-x="25" offset-y="25">
          <v-btn @click="toggleChipsColored()" v-on="on" icon tile>
            <v-icon>mdi-label</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isChipsColored">Make labels grey</span>
      <span v-else>Make labels colored</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isEditBtnHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleEditBtnVisibilty()" v-on="on">
            <v-icon>mdi-movie-edit</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isEditBtnHidden">Show edit button</span>
      <span v-else>Hide edit button</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isQualityLabelHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleQualityLabelVisibilty()" v-on="on">
            <v-icon>mdi-video-box</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isQualityLabelHidden">Show Quality Label</span>
      <span v-else>Hide Quality Label</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isDurationHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleDurationVisibilty()" v-on="on">
            <v-icon>mdi-timer</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isDurationHidden">Show Duration</span>
      <span v-else>Hide Duration</span>
    </v-tooltip>

    <v-tooltip bottom v-if="!$store.state.Settings.ratingAndFavoriteInCard">
      <template v-slot:activator="{ on }">
        <v-badge :value="isRatingHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleRatingVisibilty()" v-on="on">
            <v-icon>mdi-star</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isRatingHidden">Show Rating</span>
      <span v-else>Hide Rating</span>
    </v-tooltip>

    <v-tooltip bottom v-if="!$store.state.Settings.ratingAndFavoriteInCard">
      <template v-slot:activator="{ on }">
        <v-badge :value="isFavoriteHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFavoriteVisibilty()" v-on="on">
            <v-icon>mdi-heart</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFavoriteHidden">Show Favorite heart</span>
      <span v-else>Hide Favorite heart</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileNameHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileNameVisibilty()" v-on="on">
            <v-icon>mdi-alphabetical-variant</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileNameHidden">Show Filename</span>
      <span v-else>Hide Filename</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isFileInfoHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleFileInfoVisibilty()" v-on="on">
            <v-icon>mdi-filmstrip</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isFileInfoHidden">Show File Information</span>
      <span v-else>Hide File Information</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isPerformersHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="togglePerformerVisibilty()" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isPerformersHidden">Show Performers</span>
      <span v-else>Hide Performers</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isTagsHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleTagsVisibilty()" v-on="on">
            <v-icon>mdi-tag</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isTagsHidden">Show Tags</span>
      <span v-else>Hide Tags</span>
    </v-tooltip>
    
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-badge :value="isWebsiteHidden" icon="mdi-close" color="secondary" overlap offset-x="25" offset-y="25">
          <v-btn icon tile @click="toggleWebsiteVisibilty()" v-on="on">
            <v-icon>mdi-web</v-icon>
          </v-btn>
        </v-badge>
      </template>
      <span v-if="isWebsiteHidden">Show Website</span>
      <span v-else>Hide Website</span>
    </v-tooltip>
	</div>
</template>


<script>
export default {
  name: 'VideosAppbarCardView',
  components: {
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    cardSizes: ['XS','S','M','L','XL'],
  }),
  computed: {
    isChipsColored: {
      get() {
        return this.$store.state.Videos.videoChipsColored
      },
      set(value) {
        this.$store.dispatch('updateVideoChipsColored', value)
      },
    },
    isEditBtnHidden: {
      get() {
        return this.$store.state.Videos.videoEditBtnHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoEditBtnHidden', value)
      },
    },
    isFileNameHidden: {
      get() {
        return this.$store.state.Videos.videoFileNameHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileNameHidden', value)
      },
    },
    isFileInfoHidden: {
      get() {
        return this.$store.state.Videos.videoFileInfoHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFileInfoHidden', value)
      },
    },
    isRatingHidden: {
      get() {
        return this.$store.state.Videos.videoRatingHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoRatingHidden', value)
      },
    },
    isFavoriteHidden: {
      get() {
        return this.$store.state.Videos.videoFavoriteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoFavoriteHidden', value)
      },
    },
    isQualityLabelHidden: {
      get() {
        return this.$store.state.Videos.videoQualityLabelHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoQualityLabelHidden', value)
      },
    },
    isDurationHidden: {
      get() {
        return this.$store.state.Videos.videoDurationHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoDurationHidden', value)
      },
    },
    isPerformersHidden: {
      get() {
        return this.$store.state.Videos.videoPerformersHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoPerformersHidden', value)
      },
    },
    isTagsHidden: {
      get() {
        return this.$store.state.Videos.videoTagsHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoTagsHidden', value)
      },
    },
    isWebsiteHidden: {
      get() {
        return this.$store.state.Videos.videoWebsiteHidden
      },
      set(value) {
        this.$store.dispatch('updateVideoWebsiteHidden', value)
      },
    },
  },
  methods: {
    changeCardSize(event) {
      this.getCardSizeIcon()
      this.$store.getters.settings.set('videoCardSize', event).write()
    },
    getCardSizeIcon() {
      let size = ''
      switch(this.$store.state.Settings.videoCardSize) {
        case 1: size = 'xs'; break;
        case 2: size = 's'; break;
        case 3: size = 'm'; break;
        case 4: size = 'l'; break;
        case 5: size = 'xl'; break;
      }
      return size
    },
    toggleChipsColored() {
      this.isChipsColored = !this.isChipsColored
    },
    toggleEditBtnVisibilty() {
      this.isEditBtnHidden = !this.isEditBtnHidden
    },
    toggleFileNameVisibilty() {
      this.isFileNameHidden = !this.isFileNameHidden
    },
    toggleQualityLabelVisibilty() {
      this.isQualityLabelHidden = !this.isQualityLabelHidden
    },
    toggleDurationVisibilty() {
      this.isDurationHidden = !this.isDurationHidden
    },
    toggleRatingVisibilty() {
      this.isRatingHidden = !this.isRatingHidden
    },
    toggleFavoriteVisibilty() {
      this.isFavoriteHidden = !this.isFavoriteHidden
    },
    toggleFileInfoVisibilty() {
      this.isFileInfoHidden = !this.isFileInfoHidden
    },
    togglePerformerVisibilty() {
      this.isPerformersHidden = !this.isPerformersHidden
    },
    toggleTagsVisibilty() {
      this.isTagsHidden = !this.isTagsHidden
    },
    toggleWebsiteVisibilty() {
      this.isWebsiteHidden = !this.isWebsiteHidden
    },
  },
  watch: {
  },
}
</script>